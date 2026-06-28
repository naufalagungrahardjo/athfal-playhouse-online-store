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
};

// Page 1 uses the "summary" key; each descriptive field is its own page.
const SUMMARY_KEY = "summary";

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

export default function StudentReportPdfPanel({ studentId, studentName, summary, fields }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [themeUrl, setThemeUrl] = useState("");
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  // White reading-panel opacity (0 = fully transparent, 1 = solid white). Default 90%.
  const [cardOpacity, setCardOpacity] = useState(0.9);

  const photoPages: PageDef[] = [{ key: SUMMARY_KEY, label: "Halaman 1 — Ringkasan" }, ...fields];

  // Load the global theme + this student's photos.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: theme }, { data: studentPhotos }] = await Promise.all([
        supabase.from("student_report_assets").select("image_url").eq("scope", "theme").maybeSingle(),
        supabase.from("student_report_assets").select("page_key,image_url").eq("scope", "photo").eq("student_id", studentId),
      ]);
      if (cancelled) return;
      setThemeUrl(theme?.image_url ? `${stripCacheBuster(theme.image_url)}?t=${Date.now()}` : "");
      const map: Record<string, string> = {};
      (studentPhotos || []).forEach((r: any) => { if (r.page_key) map[r.page_key] = `${stripCacheBuster(r.image_url)}?t=${Date.now()}`; });
      setPhotos(map);
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const saveTheme = useCallback(async (url: string) => {
    const cleanUrl = stripCacheBuster(url);
    setThemeUrl(url);
    await supabase.from("student_report_assets").delete().eq("scope", "theme");
    if (cleanUrl) {
      const { error } = await supabase.from("student_report_assets").insert({ scope: "theme", image_url: cleanUrl });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: "Saved", description: url ? "Background theme updated." : "Background theme removed." });
  }, [toast]);

  const savePhoto = useCallback(async (pageKey: string, url: string) => {
    const cleanUrl = stripCacheBuster(url);
    setPhotos(prev => ({ ...prev, [pageKey]: url }));
    await supabase.from("student_report_assets").delete().eq("scope", "photo").eq("student_id", studentId).eq("page_key", pageKey);
    if (cleanUrl) {
      const { error } = await supabase.from("student_report_assets").insert({ scope: "photo", student_id: studentId, page_key: pageKey, image_url: cleanUrl });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: "Saved", description: url ? "Student photo updated." : "Student photo removed." });
  }, [studentId, toast]);

  const downloadPdf = async () => {
    setGenerating(true);
    try {
      const themeDataUrl = themeUrl ? await urlToDataUrl(themeUrl) : null;
      const photosByPage: Record<string, string | null> = {};
      await Promise.all(
        photoPages.map(async (p) => {
          photosByPage[p.key] = photos[p.key] ? await urlToDataUrl(photos[p.key]) : null;
        })
      );
      await generateStudentReportPdf({
        studentName,
        generatedDate: new Date().toISOString(),
        summary,
        fields,
        themeDataUrl,
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