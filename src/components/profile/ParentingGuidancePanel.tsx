import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Search, ArrowLeft, X } from "lucide-react";
import { format } from "date-fns";
import DOMPurify from "dompurify";

interface ParentBlog {
  id: string;
  title: string;
  content: string;
  image: string | null;
  author: string | null;
  date: string | null;
  category: string | null;
  meta_description: string | null;
  is_ai_content: boolean | null;
}

const ParentingGuidancePanel = () => {
  const { language } = useLanguage();
  const [blogs, setBlogs] = useState<ParentBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<ParentBlog | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("blogs")
        .select("id,title,content,image,author,date,category,meta_description,is_ai_content,expiry_date")
        .eq("published", true)
        .eq("is_parent_reference", true)
        .order("created_at", { ascending: false });
      const now = new Date();
      const filtered = ((data as any[]) || []).filter(
        (b) => !b.expiry_date || new Date(b.expiry_date) > now
      );
      setBlogs(filtered as ParentBlog[]);
      setLoading(false);
    };
    load();
  }, []);

  const stripHtml = (html: string) =>
    (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  // Convert bare/old YouTube links and blockquote embeds into responsive iframes
  const processContent = (content: string): string => {
    if (!content) return content;
    let html = content.replace(
      /<div[^>]*class="instagram-embed[^"]*"[^>]*>[\s\S]*?<blockquote[^>]*data-instgrm-permalink="https?:\/\/(?:www\.)?instagram\.com\/(?:[\w.]+\/)?(?:p|reel|tv)\/([\w-]+)\/[^"]*"[^>]*>[\s\S]*?<\/blockquote>[\s\S]*?<\/div>/gi,
      (_, postId) =>
        `<div class="instagram-embed my-4" style="display:flex;justify-content:center;"><iframe src="https://www.instagram.com/p/${postId}/embed" width="400" height="500" frameborder="0" scrolling="no" allowtransparency="true" style="border:none;overflow:hidden;max-width:100%;border-radius:8px;"></iframe></div>`
    );
    return html;
  };

  // When an image inside the rendered content is clicked, open it in the lightbox
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      const src = (target as HTMLImageElement).src;
      if (src) setLightbox(src);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return blogs;
    return blogs.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.category || "").toLowerCase().includes(q) ||
        stripHtml(b.content).toLowerCase().includes(q)
    );
  }, [blogs, search]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={language === "id" ? "Cari topik parenting..." : "Search parenting topics..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {language === "id"
              ? "Belum ada artikel parenting yang tersedia."
              : "No parenting articles available yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setActive(b)}
              className="text-left rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow"
            >
              {b.image && (
                <img
                  src={b.image}
                  alt={b.title}
                  className="w-full h-32 object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-3">
                {b.category && (
                  <span className="text-[11px] font-medium text-athfal-pink">
                    {b.category}
                  </span>
                )}
                <p className="font-semibold text-sm mt-1 break-words">{b.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {b.meta_description || stripHtml(b.content).slice(0, 120)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl pr-6">{active.title}</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {active.author ? `${active.author} · ` : ""}
                  {active.date ? format(new Date(active.date), "MMM d, yyyy") : ""}
                </p>
              </DialogHeader>
              {active.image && (
                <img
                  src={active.image}
                  alt={active.title}
                  onClick={() => setLightbox(active.image!)}
                  className="w-full max-h-80 object-contain rounded-md bg-accent cursor-zoom-in"
                />
              )}
              <div
                ref={contentRef}
                onClick={handleContentClick}
                className="prose prose-sm max-w-none [&_img]:cursor-zoom-in [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-md"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(processContent(active.content || ""), {
                    ADD_TAGS: ["iframe"],
                    ADD_ATTR: ["allowfullscreen", "frameborder", "allow", "scrolling", "allowtransparency"],
                    ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "u", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "img", "a", "div", "span", "blockquote", "pre", "code", "table", "thead", "tbody", "tr", "th", "td", "hr", "sub", "sup", "iframe"],
                    ALLOWED_ATTR: ["href", "src", "alt", "class", "style", "target", "rel", "width", "height", "frameborder", "allowfullscreen", "allow", "scrolling", "allowtransparency"],
                  }),
                }}
              />
              <Button variant="outline" onClick={() => setActive(null)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                {language === "id" ? "Kembali" : "Back"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-image lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-4xl bg-transparent border-0 shadow-none p-0 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {lightbox && (
            <img
              src={lightbox}
              alt=""
              className="max-h-[85vh] max-w-full object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParentingGuidancePanel;
