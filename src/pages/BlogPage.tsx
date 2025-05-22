
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";

// Mock blog data
const MOCK_BLOGS = [
  {
    id: "blog1",
    title: "Memahami Tahapan Perkembangan Anak Usia 2-5 Tahun",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac diam vulputate, volutpat libero at, efficitur nisl...",
    image: "https://images.unsplash.com/photo-1571210862729-78a52d3779a2",
    author: "Fadhilah Ramadhannisa",
    date: "2023-05-15",
    category: "Perkembangan Anak",
  },
  {
    id: "blog2",
    title: "Tips Memilih Mainan Edukasi untuk Balita",
    content: "Curabitur at est justo. Donec convallis libero felis, eu vulputate mi pharetra eget. Sed sit amet felis tellus...",
    image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30",
    author: "Ahmad Rifqi",
    date: "2023-04-22",
    category: "Tips & Trik",
  },
  {
    id: "blog3",
    title: "Pentingnya Bermain dalam Proses Belajar Anak",
    content: "Vivamus lacinia metus quis velit tincidunt, non suscipit risus pretium. Praesent ut metus a odio dictum varius eget eget magna...",
    image: "https://images.unsplash.com/photo-1484820540004-14229fe36ca4",
    author: "Siti Fatimah",
    date: "2023-03-18",
    category: "Metode Pembelajaran",
  },
  {
    id: "blog4",
    title: "Mengenalkan Al-Quran pada Anak Sejak Dini",
    content: "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aliquam sit amet finibus nulla...",
    image: "https://images.unsplash.com/photo-1507838153414-b4b713384a76",
    author: "Budi Santoso",
    date: "2023-02-10",
    category: "Pendidikan Islam",
  },
  {
    id: "blog5",
    title: "Cara Mengatasi Tantrum pada Balita",
    content: "Donec vehicula tortor quis odio elementum, eget tincidunt nisl consequat. Sed auctor nisi quis urna finibus, vel tincidunt massa feugiat...",
    image: "https://images.unsplash.com/photo-1615572359976-1fe39507ed7b",
    author: "Fadhilah Ramadhannisa",
    date: "2023-01-05",
    category: "Psikologi Anak",
  },
];

const BlogPage = () => {
  const { language } = useLanguage();
  const [blogs] = useState(MOCK_BLOGS);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <h1 className="text-3xl font-bold text-athfal-pink mb-8">
          {language === "id" ? "Blog & Artikel" : "Blog & Articles"}
        </h1>

        {/* Featured blog */}
        <div className="mb-12">
          <Link to={`/blog/${blogs[0].id}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-athfal-peach/10 rounded-3xl overflow-hidden hover:shadow-md transition-all">
              <div className="h-64 md:h-auto">
                <img
                  src={blogs[0].image}
                  alt={blogs[0].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col justify-center">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatDate(blogs[0].date)}</span>
                  <span className="mx-2">•</span>
                  <span>{blogs[0].category}</span>
                </div>
                <h2 className="text-2xl font-bold text-athfal-green mb-2">
                  {blogs[0].title}
                </h2>
                <p className="text-gray-600 mb-4">{blogs[0].content}</p>
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
          {blogs.slice(1).map((blog) => (
            <Link to={`/blog/${blog.id}`} key={blog.id}>
              <Card className="overflow-hidden h-full hover:shadow-md transition-all">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
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
                    {blog.content}
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
