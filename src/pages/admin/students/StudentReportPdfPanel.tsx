import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Download, Loader2, ChevronDown, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateStudentReportPdf, ProgramSummaryRow, ReportFieldPage } from "@/lib/studentReportPdf";

type PageDef = { key: string; label: string };

type Props = {
  studentId: string;
  studentName: string;
  summary: ProgramSummaryRow[];
  fields: ReportFieldPage[];
  /** All report fields (key + label), regardless of whether text was written — used to render a photo upload slot for every page. */
  allFields: { key: string; label: string }[];
  /** Class / program name shown on the default cover page. */
  className?: string;
};

// Page 1 uses the "summary" key; each descriptive field is its own page.
const SUMMARY_KEY = "summary";
// Big A5-landscape documentation photo shown on page 1, below the attendance summary.
const LANDSCAPE_KEY = "summary_landscape";

const stripCacheBuster = (url: string) => url.split("?")[0];

// Re-encode any image URL into a clean baseline PNG data URL via a canvas.
// jsPDF's addImage silently fails on progressive JPEGs, WebP, or CMYK images,
// which is why "successful" uploads showed up blank in the PDF. Drawing onto a
// canvas normalizes every source to a format jsPDF can always embed.
const urlToDataUrl = async (url: string): Promise<string> => {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Image request failed (${res.status})`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            // Cap dimensions so the PDF stays a reasonable size.
            const maxDim = 1600;
            let { naturalWidth: w, naturalHeight: h } = img;
            if (!w || !h) { reject(new Error("Image has invalid dimensions")); return; }
            const scale = Math.min(1, maxDim / Math.max(w, h));
            w = Math.round(w * scale);
            h = Math.round(h * scale);
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) { reject(new Error("Could not prepare image for PDF")); return; }
            // White matte so transparent PNGs don't turn black in the PDF.
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/jpeg", 0.92));
          } catch {
            reject(new Error("Could not convert image for PDF"));
          }
        };
        img.onerror = () => reject(new Error("Uploaded image could not be loaded"));
        img.src = objectUrl;
      });
      return dataUrl;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (err: any) {
    throw new Error(err?.message || "Uploaded image could not be prepared for PDF");
  }
};

export default function StudentReportPdfPanel({ studentId, studentName, summary, fields, allFields, className }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [themeUrl, setThemeUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [landscapeUrl, setLandscapeUrl] = useState("");
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  // White reading-panel opacity (0 = fully transparent, 1 = solid white). Default 90%.
  const [cardOpacity, setCardOpacity] = useState(0.9);

  // Always render a photo upload slot for Page 1 plus every report field,
  // regardless of whether final-report text has been written yet.
  const photoPages: PageDef[] = [{ key: SUMMARY_KEY, label: "Halaman 1 — Ringkasan" }, ...allFields];

  // Load the global theme + this student's photos.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: theme }, { data: cover }, { data: logo }, { data: landscape }, { data: studentPhotos }] = await Promise.all([
        supabase.from("student_report_assets").select("image_url").eq("scope", "theme").maybeSingle(),
        supabase.from("student_report_assets").select("image_url").eq("scope", "cover").maybeSingle(),
        supabase.from("student_report_assets").select("image_url").eq("scope", "logo").maybeSingle(),
        supabase.from("student_report_assets").select("image_url").eq("scope", "landscape").maybeSingle(),
        supabase.from("student_report_assets").select("page_key,image_url").eq("scope", "photo").eq("student_id", studentId),
      ]);
      if (cancelled) return;
      setThemeUrl(theme?.image_url ? `${stripCacheBuster(theme.image_url)}?t=${Date.now()}` : "");
      setCoverUrl(cover?.image_url ? `${stripCacheBuster(cover.image_url)}?t=${Date.now()}` : "");
      setLogoUrl(logo?.image_url ? `${stripCacheBuster(logo.image_url)}?t=${Date.now()}` : "");
      setLandscapeUrl(landscape?.image_url ? `${stripCacheBuster(landscape.image_url)}?t=${Date.now()}` : "");
      const map: Record<string, string> = {};
      (studentPhotos || []).forEach((r: any) => { if (r.page_key) map[r.page_key] = `${stripCacheBuster(r.image_url)}?t=${Date.now()}`; });
      setPhotos(map);
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const saveTheme = useCallback(async (url: string) => {
    const cleanUrl = stripCacheBuster(url);
    const { error: deleteError } = await supabase.from("student_report_assets").delete().eq("scope", "theme");
    if (deleteError) throw deleteError;
    if (cleanUrl) {
      const { error } = await supabase.from("student_report_assets").insert({ scope: "theme", image_url: cleanUrl });
      if (error) throw error;
    }
    setThemeUrl(url);
    toast({ title: "Saved", description: url ? "Background theme updated." : "Background theme removed." });
  }, [toast]);

  const saveCover = useCallback(async (url: string) => {
    const cleanUrl = stripCacheBuster(url);
    const { error: deleteError } = await supabase.from("student_report_assets").delete().eq("scope", "cover");
    if (deleteError) throw deleteError;
    if (cleanUrl) {
      const { error } = await supabase.from("student_report_assets").insert({ scope: "cover", image_url: cleanUrl });
      if (error) throw error;
    }
    setCoverUrl(url);
    toast({ title: "Saved", description: url ? "Custom cover updated — it now fully replaces the default cover." : "Custom cover removed — using the default cover design." });
  }, [toast]);

  const saveLogo = useCallback(async (url: string) => {
    const cleanUrl = stripCacheBuster(url);
    const { error: deleteError } = await supabase.from("student_report_assets").delete().eq("scope", "logo");
    if (deleteError) throw deleteError;
    if (cleanUrl) {
      const { error } = await supabase.from("student_report_assets").insert({ scope: "logo", image_url: cleanUrl });
      if (error) throw error;
    }
    setLogoUrl(url);
    toast({ title: "Saved", description: url ? "Business logo updated — it now appears on every student report cover." : "Business logo removed." });
  }, [toast]);

  const saveLandscape = useCallback(async (url: string) => {
    const cleanUrl = stripCacheBuster(url);
    const { error: deleteError } = await supabase.from("student_report_assets").delete().eq("scope", "landscape");
    if (deleteError) throw deleteError;
    if (cleanUrl) {
      const { error } = await supabase.from("student_report_assets").insert({ scope: "landscape", image_url: cleanUrl });
      if (error) throw error;
    }
    setLandscapeUrl(url);
    toast({ title: "Saved", description: url ? "Page 1 documentation photo updated — it now appears on every student report." : "Page 1 documentation photo removed." });
  }, [toast]);

  const savePhoto = useCallback(async (pageKey: string, url: string) => {
    const cleanUrl = stripCacheBuster(url);
    const { error: deleteError } = await supabase.from("student_report_assets").delete().eq("scope", "photo").eq("student_id", studentId).eq("page_key", pageKey);
    if (deleteError) throw deleteError;
    if (cleanUrl) {
      const { error } = await supabase.from("student_report_assets").insert({ scope: "photo", student_id: studentId, page_key: pageKey, image_url: cleanUrl });
      if (error) throw error;
    }
    setPhotos(prev => ({ ...prev, [pageKey]: url }));
    toast({ title: "Saved", description: url ? "Student photo updated." : "Student photo removed." });
  }, [studentId, toast]);

  const downloadPdf = async () => {
    setGenerating(true);
    try {
      const themeDataUrl = themeUrl ? await urlToDataUrl(themeUrl) : null;
      const coverDataUrl = coverUrl ? await urlToDataUrl(coverUrl) : null;
      const logoDataUrl = logoUrl ? await urlToDataUrl(logoUrl) : null;
      const photosByPage: Record<string, string | null> = {};
      await Promise.all(
        photoPages.map(async (p) => {
          photosByPage[p.key] = photos[p.key] ? await urlToDataUrl(photos[p.key]) : null;
        })
      );
      // Big landscape documentation photo for page 1.
      photosByPage[LANDSCAPE_KEY] = landscapeUrl ? await urlToDataUrl(landscapeUrl) : null;
      // Include a PDF page for any field that has saved text OR an uploaded photo,
      // so a photo attached to a text-less field still appears in the report.
      const fieldsWithText = new Set(fields.map((f) => f.key));
      const extraPhotoFields: ReportFieldPage[] = allFields
        .filter((f) => !fieldsWithText.has(f.key) && photos[f.key])
        .map((f) => ({ key: f.key, label: f.label, content: "" }));
      const pdfFields = [...fields, ...extraPhotoFields];
      await generateStudentReportPdf({
        studentName,
        generatedDate: new Date().toISOString(),
        summary,
        fields: pdfFields,
        themeDataUrl,
        coverDataUrl,
        logoDataUrl,
        className,
        photosByPage,
        cardOpacity,
      });
      toast({ title: "Report ready", description: "PDF downloaded." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate PDF", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-semibold">A4 PDF Report</h3>
            <p className="text-xs text-muted-foreground">Page 1 = attendance summary, then one page per report field.</p>
          </div>
          <Button onClick={downloadPdf} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
            Download PDF
          </Button>
        </div>

        <Collapsible open={open} onOpenChange={setOpen} className="mt-4">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              <ImageIcon className="h-4 w-4 mr-1" /> Background theme & photos
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${open ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-6">
            <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">White background transparency</Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {Math.round((1 - cardOpacity) * 100)}% transparent
                </span>
              </div>
              <Slider
                value={[cardOpacity]}
                onValueChange={(v) => setCardOpacity(v[0])}
                min={0}
                max={1}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Drag left to make the white panel more transparent so your uploaded design shows through. Drag fully left to remove it entirely.
              </p>
            </div>
            <div className="rounded-lg border p-4 bg-muted/30">
              <ImageUpload
                value={themeUrl}
                onChange={saveTheme}
                label="Background Theme (applies to every page & every student)"
                hint="Upload a kid-friendly PNG/JPG. Recommended A4 portrait ratio (e.g. 1240×1754). Leave empty for the default theme."
              />
            </div>
            <div className="rounded-lg border p-4 bg-muted/30">
              <ImageUpload
                value={logoUrl}
                onChange={saveLogo}
                label="Business Logo (shown centered above the title on the default cover)"
                hint="Upload your business logo (PNG with transparent background works best). It is centered and scaled proportionally above the 'Student Report' title. Applies to every student. Only used on the default cover (not when a custom front cover is set)."
              />
            </div>
            <div className="rounded-lg border p-4 bg-muted/30">
              <ImageUpload
                value={coverUrl}
                onChange={saveCover}
                label="Custom Front Cover (applies to every student)"
                hint="Optional. Upload a full A4 portrait design (e.g. 1240×1754). When set, it FULLY replaces the default cover — the default class name / 'Student Report' design will not be used. Leave empty to keep the default kid-friendly cover."
              />
            </div>
            <div className="rounded-lg border p-4 bg-muted/30">
              <ImageUpload
                value={landscapeUrl}
                onChange={saveLandscape}
                label="Page 1 Documentation Photo (A5 landscape) — applies to every student"
                hint="Shown on page 1 below the attendance summary. Best as an A5 landscape image (e.g. 1748×1240, ratio ~1.42:1). Upload once and it is used on every student's report."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photoPages.map((p) => (
                <div key={p.key} className="rounded-lg border p-4">
                  <ImageUpload
                    value={photos[p.key] || ""}
                    onChange={(url) => savePhoto(p.key, url)}
                    label={`${p.label} — Student Photo`}
                  />
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}