
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";
import { useBlogs } from "@/hooks/useBlogs";

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

const BlogPage = () => {
  const { language } = useLanguage();
  const { blogs, loading } = useBlogs();

  // Only show published blogs on the public site
  const publishedBlogs = blogs.filter(blog => blog.published);

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
      <div className="min-h-screen flex justify-center items-center">
        <div>Loading blogs...</div>
      </div>
    );
  }

  if (publishedBlogs.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="athfal-container py-12">
          <h1 className="text-3xl font-bold text-athfal-pink mb-8">
            {language === "id" ? "Blog & Artikel" : "Blog & Articles"}
          </h1>
          <div className="text-center py-12">
            <p className="text-gray-500">
              {language === "id" ? "Belum ada artikel yang dipublikasikan." : "No articles published yet."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <h1 className="text-3xl font-bold text-athfal-pink mb-8">
          {language === "id" ? "Blog & Artikel" : "Blog & Articles"}
        </h1>

        {/* Featured blog */}
        <div className="mb-12">
          <Link to={`/blog/${publishedBlogs[0].id}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-athfal-peach/10 rounded-3xl overflow-hidden hover:shadow-md transition-all">
              <div className="flex items-center justify-center p-4">
                <div className="bg-accent rounded-2xl flex items-center justify-center w-full" style={{ aspectRatio: '16/9', maxWidth: 1920 }}>
                  <img
                    src={publishedBlogs[0].image}
                    alt={publishedBlogs[0].title}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
              </div>
              <div className="p-6 flex flex-col justify-center">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatDate(publishedBlogs[0].date)}</span>
                  <span className="mx-2">•</span>
                  <span>{publishedBlogs[0].category}</span>
                </div>
                <h2 className="text-2xl font-bold text-athfal-green mb-2">
                  {publishedBlogs[0].title}
                </h2>
                <p className="text-gray-600 mb-4">{stripHtml(publishedBlogs[0].content).substring(0, 150)}...</p>
                <div className="flex items-center mt-2">
                  <Button variant="link" className="text-athfal-pink p-0 flex items-center">
                    {language === "id" ? "Baca selengkapnya" : "Read more"}{" "}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Blog list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedBlogs.slice(1).map((blog) => (
            <Link to={`/blog/${blog.id}`} key={blog.id}>
              <Card className="overflow-hidden h-full hover:shadow-md transition-all">
                <div className="flex items-center justify-center overflow-hidden">
                  <div className="bg-accent flex items-center justify-center w-full" style={{ aspectRatio: '16/9' }}>
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="object-contain max-w-full max-h-full hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(blog.date)}</span>
                  </div>
                  <h3 className="font-semibold text-lg text-athfal-pink mb-2 line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-2">
                    {stripHtml(blog.content).substring(0, 100)}...
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-athfal-green bg-athfal-green/10 px-2 py-1 rounded-full">
                      {blog.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
