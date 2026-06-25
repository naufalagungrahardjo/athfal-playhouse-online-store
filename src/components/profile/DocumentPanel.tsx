import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, FileImage, Download, FolderOpen, Search } from "lucide-react";
import { format } from "date-fns";

interface ParentDocument {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_name: string | null;
  created_at: string;
}

const DocumentPanel = () => {
  const { language } = useLanguage();
  const [docs, setDocs] = useState<ParentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("parent_documents")
        .select("*")
        .order("created_at", { ascending: false });
      setDocs((data as ParentDocument[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      d.title.toLowerCase().includes(q) ||
      (d.description || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={language === "id" ? "Cari dokumen..." : "Search documents..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {language === "id"
              ? "Belum ada dokumen yang tersedia."
              : "No documents available yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((d) => {
            const isImage = d.file_type === "image";
            const Icon = isImage ? FileImage : FileText;
            return (
              <div
                key={d.id}
                className="rounded-lg border bg-card p-4 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-athfal-pink/10 p-2 shrink-0">
                    <Icon className="h-5 w-5 text-athfal-pink" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm break-words">{d.title}</p>
                    {d.description && (
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {d.description}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {format(new Date(d.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                {isImage && (
                  <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={d.file_url}
                      alt={d.title}
                      className="w-full max-h-40 object-cover rounded-md border"
                      loading="lazy"
                    />
                  </a>
                )}
                <div className="flex gap-2 mt-auto">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                      {language === "id" ? "Lihat" : "View"}
                    </a>
                  </Button>
                  <Button asChild size="sm" className="flex-1 bg-athfal-pink hover:bg-athfal-pink/90">
                    <a href={d.file_url} download={d.file_name || d.title} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-1" />
                      {language === "id" ? "Unduh" : "Download"}
                    </a>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentPanel;
