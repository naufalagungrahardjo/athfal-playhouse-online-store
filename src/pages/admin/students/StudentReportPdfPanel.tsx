import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  /** Programs the student is enrolled in. The report design (theme/cover/logo/landscape) is scoped per program. */
  enrolledPrograms: { id: string; name: string }[];
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

export default function StudentReportPdfPanel({ studentId, studentName, summary, fields, allFields, enrolledPrograms }: Props) {
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

  // Which program's report design is being edited/generated. The design assets
  // (theme, cover, logo, landscape) are scoped per program so each class can
  // have its own look. Default to the first program the student is enrolled in.
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");

  useEffect(() => {
    setSelectedProgramId(prev => {
      if (prev && enrolledPrograms.some(p => p.id === prev)) return prev;
      return enrolledPrograms[0]?.id || "";
    });
  }, [enrolledPrograms]);

  const selectedProgram = enrolledPrograms.find(p => p.id === selectedProgramId);

  // Always render a photo upload slot for Page 1 plus every report field,
  // regardless of whether final-report text has been written yet.
  const photoPages: PageDef[] = [{ key: SUMMARY_KEY, label: "Halaman 1 — Ringkasan" }, ...allFields];

  // Load the selected program's design assets + this student's photos.
  // Design assets are scoped per program; a global (no-program) asset is used
  // as a fallback when the program has not been given its own design yet.
  useEffect(() => {
    let cancelled = false;
    const pid = selectedProgramId || null;
    const pickForProgram = (rows: any[] | null) => {
      if (!rows || rows.length === 0) return "";
      const specific = pid ? rows.find(r => r.program_id === pid) : null;
      const fallback = rows.find(r => r.program_id === null);
      const chosen = specific || fallback;
      return chosen?.image_url ? `${stripCacheBuster(chosen.image_url)}?t=${Date.now()}` : "";
    };
    (async () => {
      const [{ data: theme }, { data: cover }, { data: logo }, { data: landscape }, { data: studentPhotos }] = await Promise.all([
        supabase.from("student_report_assets").select("image_url,program_id").eq("scope", "theme"),
        supabase.from("student_report_assets").select("image_url,program_id").eq("scope", "cover"),
        supabase.from("student_report_assets").select("image_url,program_id").eq("scope", "logo"),
        supabase.from("student_report_assets").select("image_url,program_id").eq("scope", "landscape"),
        supabase.from("student_report_assets").select("page_key,image_url").eq("scope", "photo").eq("student_id", studentId),
      ]);
      if (cancelled) return;
      setThemeUrl(pickForProgram(theme));
      setCoverUrl(pickForProgram(cover));
      setLogoUrl(pickForProgram(logo));
      setLandscapeUrl(pickForProgram(landscape));
      const map: Record<string, string> = {};
      (studentPhotos || []).forEach((r: any) => { if (r.page_key) map[r.page_key] = `${stripCacheBuster(r.image_url)}?t=${Date.now()}`; });
      setPhotos(map);
    })();
    return () => { cancelled = true; };
  }, [studentId, selectedProgramId]);

  // Save a program-scoped design asset (theme/cover/logo/landscape).
  const saveProgramAsset = useCallback(async (
    scope: "theme" | "cover" | "logo" | "landscape",
    url: string,
    setLocal: (u: string) => void,
    savedMsg: string,
    removedMsg: string,
  ) => {
    if (!selectedProgramId) {
      toast({ title: "Select a program", description: "This student has no program to attach the design to.", variant: "destructive" });
      return;
    }
    const cleanUrl = stripCacheBuster(url);
    const { error: deleteError } = await supabase
      .from("student_report_assets")
      .delete()
      .eq("scope", scope)
      .eq("program_id", selectedProgramId);
    if (deleteError) throw deleteError;
    if (cleanUrl) {
      const { error } = await supabase
        .from("student_report_assets")
        .insert({ scope, image_url: cleanUrl, program_id: selectedProgramId });
      if (error) throw error;
    }
    setLocal(url);
    toast({ title: "Saved", description: url ? savedMsg : removedMsg });
  }, [selectedProgramId, toast]);

  const programLabel = selectedProgram?.name ? `“${selectedProgram.name}”` : "this program";
  const saveTheme = useCallback((url: string) =>
    saveProgramAsset("theme", url, setThemeUrl, `Background theme updated for ${programLabel}.`, `Background theme removed for ${programLabel}.`),
  [saveProgramAsset, programLabel]);
  const saveCover = useCallback((url: string) =>
    saveProgramAsset("cover", url, setCoverUrl, `Custom cover updated for ${programLabel} — it now fully replaces the default cover.`, `Custom cover removed for ${programLabel}.`),
  [saveProgramAsset, programLabel]);
  const saveLogo = useCallback((url: string) =>
    saveProgramAsset("logo", url, setLogoUrl, `Business logo updated for ${programLabel}.`, `Business logo removed for ${programLabel}.`),
  [saveProgramAsset, programLabel]);
  const saveLandscape = useCallback((url: string) =>
    saveProgramAsset("landscape", url, setLandscapeUrl, `Page 1 documentation photo updated for ${programLabel}.`, `Page 1 documentation photo removed for ${programLabel}.`),
  [saveProgramAsset, programLabel]);

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
      // Restrict the attendance summary to the selected program so each
      // program produces its own distinct report.
      const programSummary = selectedProgram
        ? summary.filter((s) => s.programName === selectedProgram.name)
        : summary;
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
        summary: programSummary.length ? programSummary : summary,
        fields: pdfFields,
        themeDataUrl,
        coverDataUrl,
        logoDataUrl,
        className: selectedProgram?.name,
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
            <p className="text-xs text-muted-foreground">Page 1 = attendance summary, then one page per report field. The design is set per program.</p>
          </div>
          <Button onClick={downloadPdf} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
            Download PDF
          </Button>
        </div>

        <div className="mt-3">
          <Label className="text-sm">Report program (design applies to this program)</Label>
          {enrolledPrograms.length > 0 ? (
            <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
              <SelectTrigger className="mt-1 max-w-md">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {enrolledPrograms.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">This student is not enrolled in any program yet.</p>
          )}
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