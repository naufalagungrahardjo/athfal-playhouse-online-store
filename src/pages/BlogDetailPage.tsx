import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";

// Expanded mock blog data
const MOCK_BLOGS = [
  {
    id: "blog1",
    title: "Memahami Tahapan Perkembangan Anak Usia 2-5 Tahun",
    content: `
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac diam vulputate, volutpat libero at, efficitur nisl. Ut vel nulla fermentum, dignissim elit vel, scelerisque turpis. Nulla facilisi. Donec ultricies nisi eget libero faucibus, et lacinia nulla interdum.</p>
      
      <h2>Tahapan Perkembangan Kognitif</h2>
      <p>Suspendisse potenti. In hac habitasse platea dictumst. Fusce convallis ex at mauris eleifend fermentum. Duis eu posuere erat. Sed vel elit eget nunc maximus tempor. Pellentesque rutrum semper urna vel dapibus. Sed vel enim vel orci mollis posuere. Integer euismod nulla a feugiat ultrices.</p>
      
      <p>Morbi maximus mi in nisi dapibus, at tempus dui dignissim. Proin in aliquam est, et porta est. Cras in nunc eget tortor porta dictum id ac lacus. Integer ornare lorem a quam aliquam, ut rutrum eros ornare. Vestibulum dictum eleifend turpis vitae efficitur. Proin vulputate bibendum magna, et blandit orci venenatis a.</p>
      
      <h2>Perkembangan Motorik Anak</h2>
      <p>Curabitur at est justo. Donec convallis libero felis, eu vulputate mi pharetra eget. Sed sit amet felis tellus. Integer euismod fermentum nibh, vitae volutpat enim fermentum a. Pellentesque dignissim leo ac ante commodo, sed consectetur nulla vehicula.</p>
    `,
    image: "https://images.unsplash.com/photo-1571210862729-78a52d3779a2",
    author: "Fadhilah Ramadhannisa",
    date: "2023-05-15",
    category: "Perkembangan Anak",
  },
  {
    id: "blog2",
    title: "Tips Memilih Mainan Edukasi untuk Balita",
    content: `
      <p>Curabitur at est justo. Donec convallis libero felis, eu vulputate mi pharetra eget. Sed sit amet felis tellus. Integer euismod fermentum nibh, vitae volutpat enim fermentum a. Pellentesque dignissim leo ac ante commodo, sed consectetur nulla vehicula.</p>
      
      <h2>Manfaat Mainan Edukasi</h2>
      <p>Vivamus lacinia metus quis velit tincidunt, non suscipit risus pretium. Praesent ut metus a odio dictum varius eget eget magna. Integer vitae tempor purus. Nulla a nunc in orci vestibulum vulputate. Sed pharetra felis in justo mollis, vitae auctor ligula sagittis.</p>
      
      <p>Nulla facilisi. Proin non augue nec est varius accumsan. Etiam congue laoreet tellus, quis fermentum mauris sagittis id. Vivamus quis leo sed risus bibendum scelerisque. Suspendisse potenti. Etiam vel arcu vel turpis tincidunt varius.</p>
      
      <h2>Memilih Mainan yang Tepat</h2>
      <p>Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Cras eget ultricies enim. Ut mollis aliquet felis, id varius velit iaculis vel. Maecenas feugiat tellus quis nibh viverra, id auctor orci condimentum. Maecenas at mauris luctus, luctus odio eget, suscipit justo.</p>
    `,
    image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30",
    author: "Ahmad Rifqi",
    date: "2023-04-22",
    category: "Tips & Trik",
  },
  {
    id: "blog3",
    title: "Pentingnya Bermain dalam Proses Belajar Anak",
    content: `
      <p>Vivamus lacinia metus quis velit tincidunt, non suscipit risus pretium. Praesent ut metus a odio dictum varius eget eget magna. Integer vitae tempor purus. Nulla a nunc in orci vestibulum vulputate.</p>
      
      <h2>Belajar Melalui Bermain</h2>
      <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aliquam sit amet finibus nulla, et ultricies ex. Duis tempus diam eu tortor semper, in pretium libero tristique. Etiam hendrerit nisi nec magna tincidunt vestibulum.</p>
      
      <p>Cras euismod ipsum nec nunc vestibulum, vel ullamcorper urna aliquet. Nam luctus pulvinar magna, vel fermentum elit mollis vel. Mauris vel leo ac orci iaculis gravida. Fusce pharetra fermentum libero, a tempus nisi auctor quis. Donec ut eleifend mauris.</p>
      
      <h2>Manfaat Bermain untuk Perkembangan</h2>
      <p>Maecenas sit amet nisl id nisl tincidunt eleifend. Aliquam erat volutpat. Sed vel orci id neque viverra varius. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. In a magna vel sapien posuere gravida eget quis magna.</p>
    `,
    image: "https://images.unsplash.com/photo-1484820540004-14229fe36ca4",
    author: "Siti Fatimah",
    date: "2023-03-18",
    category: "Metode Pembelajaran",
  },
  {
    id: "blog4",
    title: "Mengenalkan Al-Quran pada Anak Sejak Dini",
    content: `
      <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aliquam sit amet finibus nulla, et ultricies ex. Duis tempus diam eu tortor semper, in pretium libero tristique. Etiam hendrerit nisi nec magna tincidunt vestibulum.</p>
      
      <h2>Pentingnya Mengenalkan Al-Quran Sejak Dini</h2>
      <p>Fusce commodo lacus sit amet libero elementum, quis pulvinar mi varius. Etiam id magna vel felis semper tristique. Vestibulum nec turpis tortor. Suspendisse vestibulum mi eget lectus sollicitudin convallis. Nullam tristique sapien velit, et posuere justo tincidunt nec.</p>
      
      <p>Morbi at mi vel velit tempus dignissim. Fusce eleifend mi nec quam consequat, id dignissim magna commodo. Nullam tristique sapien velit, et posuere justo tincidunt nec. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.</p>
      
      <h2>Metode Pengenalan yang Menyenangkan</h2>
      <p>Nulla feugiat ex id mauris elementum, ac pulvinar urna molestie. Sed vitae sem magna. Nulla facilisi. Nulla feugiat ex id mauris elementum, ac pulvinar urna molestie. Sed vitae sem magna. Nulla facilisi.</p>
    `,
    image: "https://images.unsplash.com/photo-1507838153414-b4b713384a76",
    author: "Budi Santoso",
    date: "2023-02-10",
    category: "Pendidikan Islam",
  },
  {
    id: "blog5",
    title: "Cara Mengatasi Tantrum pada Balita",
    content: `
      <p>Donec vehicula tortor quis odio elementum, eget tincidunt nisl consequat. Sed auctor nisi quis urna finibus, vel tincidunt massa feugiat. Nulla facilisi. In auctor nisi non magna cursus, vel aliquam nunc tempor.</p>
      
      <h2>Memahami Penyebab Tantrum</h2>
      <p>Integer lacus magna, posuere vel est ut, vestibulum porta nulla. Nullam auctor sem vitae nisi commodo, nec congue velit tincidunt. Cras rhoncus magna sit amet mauris placerat, vel varius urna fringilla. Sed eleifend tortor a justo interdum varius.</p>
      
      <p>Cras sodales turpis nec mauris finibus, non rutrum nisi lacinia. Praesent eu risus sed lacus volutpat finibus ut nec felis. Curabitur facilisis nibh eget nunc dictum, at feugiat magna accumsan. Suspendisse potenti.</p>
      
      <h2>Strategi Menangani Tantrum</h2>
      <p>Praesent lectus arcu, pellentesque vitae tempor id, fringilla eu tellus. Aliquam porttitor dui vel metus varius, id suscipit eros eleifend. Suspendisse in tortor sit amet neque fringilla tristique sed id enim. Nullam auctor sem vitae nisi commodo, nec congue velit tincidunt.</p>
    `,
    image: "https://images.unsplash.com/photo-1615572359976-1fe39507ed7b",
    author: "Fadhilah Ramadhannisa",
    date: "2023-01-05",
    category: "Psikologi Anak",
  },
  {
    id: "blog6",
    title: "Makanan Sehat untuk Mendukung Kecerdasan Anak",
    content: `
      <p>Fusce commodo lacus sit amet libero elementum, quis pulvinar mi varius. Etiam id magna vel felis semper tristique. Vestibulum nec turpis tortor. Suspendisse vestibulum mi eget lectus sollicitudin convallis.</p>
      
      <h2>Nutrisi Penting untuk Perkembangan Otak</h2>
      <p>Cras sodales turpis nec mauris finibus, non rutrum nisi lacinia. Praesent eu risus sed lacus volutpat finibus ut nec felis. Curabitur facilisis nibh eget nunc dictum, at feugiat magna accumsan. Suspendisse potenti.</p>
      
      <p>Praesent lectus arcu, pellentesque vitae tempor id, fringilla eu tellus. Aliquam porttitor dui vel metus varius, id suscipit eros eleifend. Suspendisse in tortor sit amet neque fringilla tristique sed id enim.</p>
      
      <h2>Menu Sehat untuk Anak</h2>
      <p>Integer lacus magna, posuere vel est ut, vestibulum porta nulla. Nullam auctor sem vitae nisi commodo, nec congue velit tincidunt. Cras rhoncus magna sit amet mauris placerat, vel varius urna fringilla. Sed eleifend tortor a justo interdum varius.</p>
    `,
    image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352",
    author: "Siti Fatimah",
    date: "2022-12-10",
    category: "Nutrisi Anak",
  },
  {
    id: "blog7",
    title: "Mengenalkan Konsep Waktu pada Anak Prasekolah",
    content: `
      <p>Integer lacus magna, posuere vel est ut, vestibulum porta nulla. Nullam auctor sem vitae nisi commodo, nec congue velit tincidunt. Cras rhoncus magna sit amet mauris placerat, vel varius urna fringilla.</p>
      
      <h2>Pentingnya Memahami Konsep Waktu</h2>
      <p>Praesent lectus arcu, pellentesque vitae tempor id, fringilla eu tellus. Aliquam porttitor dui vel metus varius, id suscipit eros eleifend. Suspendisse in tortor sit amet neque fringilla tristique sed id enim.</p>
      
      <p>Cras sodales turpis nec mauris finibus, non rutrum nisi lacinia. Praesent eu risus sed lacus volutpat finibus ut nec felis. Curabitur facilisis nibh eget nunc dictum, at feugiat magna accumsan.</p>
      
      <h2>Aktivitas Belajar Konsep Waktu</h2>
      <p>Fusce commodo lacus sit amet libero elementum, quis pulvinar mi varius. Etiam id magna vel felis semper tristique. Vestibulum nec turpis tortor. Suspendisse vestibulum mi eget lectus sollicitudin convallis.</p>
    `,
    image: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902",
    author: "Ahmad Rifqi",
    date: "2022-11-15",
    category: "Pendidikan Anak",
  },
  {
    id: "blog8",
    title: "Menanamkan Kemandirian pada Anak Sejak Dini",
    content: `
      <p>Praesent lectus arcu, pellentesque vitae tempor id, fringilla eu tellus. Aliquam porttitor dui vel metus varius, id suscipit eros eleifend. Suspendisse in tortor sit amet neque fringilla tristique sed id enim.</p>
      
      <h2>Pentingnya Kemandirian</h2>
      <p>Cras sodales turpis nec mauris finibus, non rutrum nisi lacinia. Praesent eu risus sed lacus volutpat finibus ut nec felis. Curabitur facilisis nibh eget nunc dictum, at feugiat magna accumsan. Suspendisse potenti.</p>
      
      <p>Integer lacus magna, posuere vel est ut, vestibulum porta nulla. Nullam auctor sem vitae nisi commodo, nec congue velit tincidunt. Cras rhoncus magna sit amet mauris placerat, vel varius urna fringilla.</p>
      
      <h2>Langkah-langkah Menumbuhkan Kemandirian</h2>
      <p>Fusce commodo lacus sit amet libero elementum, quis pulvinar mi varius. Etiam id magna vel felis semper tristique. Vestibulum nec turpis tortor. Suspendisse vestibulum mi eget lectus sollicitudin convallis.</p>
    `,
    image: "https://images.unsplash.com/photo-1542810634-71277d95dcbb",
    author: "Budi Santoso",
    date: "2022-10-20",
    category: "Parenting",
  }
];

// Related blog type
type Blog = {
  id: string;
  title: string;
  image: string;
  date: string;
  category: string;
};

const BlogDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const [blog, setBlog] = useState<(typeof MOCK_BLOGS)[0] | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    // Find the blog with the matching ID
    const foundBlog = MOCK_BLOGS.find((b) => b.id === id);
    if (foundBlog) {
      setBlog(foundBlog);
      
      // Get related blogs (excluding the current one)
      const related = MOCK_BLOGS
        .filter((b) => b.id !== id)
        .slice(0, 3)
        .map(({ id, title, image, date, category }) => ({
          id,
          title,
          image,
          date,
          category,
        }));
      
      setRelatedBlogs(related);
    }
  }, [id]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

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

        {/* Blog content */}
        <div className="prose max-w-none mb-12">
          <div dangerouslySetInnerHTML={{ __html: blog.content }} />
        </div>

        {/* Related articles */}
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
      </div>
    </div>
  );
};

export default BlogDetailPage;
