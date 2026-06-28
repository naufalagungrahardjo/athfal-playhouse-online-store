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

const urlToDataUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
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
      setThemeUrl(theme?.image_url || "");
      const map: Record<string, string> = {};
      (studentPhotos || []).forEach((r: any) => { if (r.page_key) map[r.page_key] = r.image_url; });
      setPhotos(map);
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const saveTheme = useCallback(async (url: string) => {
    setThemeUrl(url);
    await supabase.from("student_report_assets").delete().eq("scope", "theme");
    if (url) {
      const { error } = await supabase.from("student_report_assets").insert({ scope: "theme", image_url: url });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: "Saved", description: url ? "Background theme updated." : "Background theme removed." });
  }, [toast]);

  const savePhoto = useCallback(async (pageKey: string, url: string) => {
    setPhotos(prev => ({ ...prev, [pageKey]: url }));
    await supabase.from("student_report_assets").delete().eq("scope", "photo").eq("student_id", studentId).eq("page_key", pageKey);
    if (url) {
      const { error } = await supabase.from("student_report_assets").insert({ scope: "photo", student_id: studentId, page_key: pageKey, image_url: url });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
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