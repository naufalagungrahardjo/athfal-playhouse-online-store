
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBlogs, Blog } from "@/hooks/useBlogs";

const BlogDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { blogs, loading } = useBlogs();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    if (!loading && blogs.length > 0 && id) {
      // Find the blog with the matching ID
      const foundBlog = blogs.find((b) => b.id === id);
      if (foundBlog) {
        setBlog(foundBlog);
        
        // Get related blogs (excluding the current one)
        const related = blogs
          .filter((b) => b.id !== id && b.published)
          .slice(0, 3);
        
        setRelatedBlogs(related);
      }
    }
  }, [id, blogs, loading]);

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
    <div className="min-h-screen">
      <div className="athfal-container py-12">
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
        <div className="mb-8 rounded-3xl overflow-hidden">
          <img
            src={blog.image}
            alt={blog.title}
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Blog content - Support HTML content */}
        <div className="prose prose-lg max-w-none mb-12">
          <div 
            dangerouslySetInnerHTML={{ __html: blog.content }} 
            className="whitespace-pre-wrap"
          />
        </div>

        {/* Related articles */}
        {relatedBlogs.length > 0 && (
          <div className="mt-16 border-t pt-8">
            <h2 className="text-2xl font-bold mb-6 text-athfal-pink">
              {language === "id" ? "Artikel Terkait" : "Related Articles"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Link to={`/blog/${relatedBlog.id}`} key={relatedBlog.id} className="group">
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
  );
};

export default BlogDetailPage;
