import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, ArrowLeft, User } from "lucide-react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { useBlogs, Blog } from "@/hooks/useBlogs";
import { SEOHead } from "@/components/SEOHead";

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

const BlogDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { blogs, loading } = useBlogs();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    if (!loading && blogs.length > 0 && slug) {
      const foundBlog = blogs.find((b) => b.slug === slug) || blogs.find((b) => b.id === slug);
      if (foundBlog) {
        setBlog(foundBlog);
        const related = blogs
          .filter((b) => b.id !== foundBlog.id && b.published)
          .slice(0, 3);
        setRelatedBlogs(related);
      }
    }
  }, [slug, blogs, loading]);

  // Convert old blockquote-based Instagram embeds to iframe embeds
  const processInstagramContent = (content: string): string => {
    if (!content) return content;
    // Match blockquote-based Instagram embeds and convert to iframe
    return content.replace(
      /<div[^>]*class="instagram-embed[^"]*"[^>]*>[\s\S]*?<blockquote[^>]*data-instgrm-permalink="https?:\/\/(?:www\.)?instagram\.com\/(?:[\w.]+\/)?(?:p|reel|tv)\/([\w-]+)\/[^"]*"[^>]*>[\s\S]*?<\/blockquote>[\s\S]*?<\/div>/gi,
      (_, postId) => `<div class="instagram-embed my-4" style="display:flex;justify-content:center;"><iframe src="https://www.instagram.com/p/${postId}/embed" width="400" height="500" frameborder="0" scrolling="no" allowtransparency="true" style="border:none;overflow:hidden;max-width:100%;border-radius:8px;"></iframe></div>`
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="athfal-container py-12 min-h-screen">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading blog...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="athfal-container py-12 min-h-screen">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            {language === "id" ? "Blog tidak ditemukan" : "Blog not found"}
          </h2>
          <Link to="/blog">
            <Button variant="outline" className="mx-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === "id" ? "Kembali ke Blog" : "Back to Blog"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={blog.title}
        description={blog.meta_description || stripHtml(blog.content).substring(0, 155)}
        image={blog.image}
        url={`/blog/${blog.slug || blog.id}`}
        type="article"
      />
      <div className="w-full">
        <div className="max-w-[760px] mx-auto px-2 sm:px-6 py-12">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link to="/" className="text-gray-500 hover:text-athfal-pink">
              {language === "id" ? "Beranda" : "Home"}
            </Link>
            <span className="mx-2 text-gray-500">/</span>
            <Link to="/blog" className="text-gray-500 hover:text-athfal-pink">
              Blog
            </Link>
            <span className="mx-2 text-gray-500">/</span>
            <span className="text-gray-700">{blog.title}</span>
          </div>

          {/* Blog header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-athfal-pink mb-4">
              {blog.title}
            </h1>
            <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDate(blog.date)}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>{blog.author}</span>
              </div>
              <span className="px-2 py-1 bg-athfal-green/10 text-athfal-green rounded-full">
                {blog.category}
              </span>
            </div>
          </div>

          {/* Featured image */}
          <div className="mb-8 flex justify-center">
            <div className="bg-accent rounded-3xl flex items-center justify-center w-full" style={{ aspectRatio: '16/9', maxWidth: 1920 }}>
              <img
                src={blog.image}
                alt={blog.title}
                className="object-contain max-w-full max-h-full rounded-3xl"
              />
            </div>
          </div>

          {/* Blog content - Support HTML content */}
          <div className="flex justify-center">
            <div
              className="prose prose-lg max-w-[900px] w-full bg-white px-6 sm:px-8 md:px-10 mb-12 rounded-xl"
              style={{ boxShadow: "0 2px 24px rgba(0,0,0,0.02)" }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(processInstagramContent(blog.content), { ADD_TAGS: ['iframe', 'blockquote'], ADD_ATTR: ['allowfullscreen', 'frameborder', 'allow', 'scrolling', 'allowtransparency'], ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'a', 'div', 'span', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'sub', 'sup', 'iframe'], ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel', 'width', 'height', 'frameborder', 'allowfullscreen', 'allow', 'scrolling', 'allowtransparency'] }) }}
                className="whitespace-pre-wrap"
              />
            </div>
          </div>

          <style>
            {`
              .prose img {
                max-width: 100%;
                height: auto;
                margin: 2rem auto;
                border-radius: 1.25rem;
                box-shadow: 0 4px 24px rgba(0,0,0,0.06);
                display: block;
              }
              @media (max-width: 1024px) {
                .prose {
                  max-width: 100vw;
                  padding-left: 1rem !important;
                  padding-right: 1rem !important;
                }
              }
              @media (max-width: 768px) {
                .prose {
                  max-width: 100vw;
                  padding-left: 0.5rem !important;
                  padding-right: 0.5rem !important;
                }
                .prose img {
                  max-width: 100%;
                  margin: 1rem 0;
                  border-radius: 0.75rem;
                }
              }
            `}
          </style>

          {/* Related articles */}
          {relatedBlogs.length > 0 && (
            <div className="mt-16 border-t pt-8">
              <h2 className="text-2xl font-bold mb-6 text-athfal-pink">
                {language === "id" ? "Artikel Terkait" : "Related Articles"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedBlogs.map((relatedBlog) => (
                  <Link to={`/blog/${relatedBlog.slug || relatedBlog.id}`} key={relatedBlog.id} className="group">
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all h-full">
                      <div className="aspect-[4/3] overflow-hidden">
                        <img 
                          src={relatedBlog.image} 
                          alt={relatedBlog.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(relatedBlog.date)}</span>
                        </div>
                        <h3 className="font-semibold text-athfal-pink line-clamp-2">
                          {relatedBlog.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage;
