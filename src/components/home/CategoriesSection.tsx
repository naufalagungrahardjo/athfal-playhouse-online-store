
import { useLanguage } from '@/contexts/LanguageContext';
import { CategoryCard } from './CategoryCard';

export const CategoriesSection = () => {
  const { language } = useLanguage();

  const categories = [
    {
      title: "Pop Up Class",
      href: "/products/pop-up-class",
      image: "https://images.unsplash.com/photo-1588072432836-e10032774350?w=100&h=100&fit=crop&auto=format",
      bgColor: "bg-athfal-yellow/20"
    },
    {
      title: "Bumi Class",
      href: "/products/bumi-class",
      image: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=100&h=100&fit=crop&auto=format",
      bgColor: "bg-athfal-green/20"
    },
    {
      title: "Tahsin Class",
      href: "/products/tahsin-class",
      image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=100&h=100&fit=crop&auto=format",
      bgColor: "bg-athfal-pink/20"
    },
    {
      title: "Play Kit",
      href: "/products/play-kit",
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=100&h=100&fit=crop&auto=format",
      bgColor: "bg-athfal-teal/20"
    },
    {
      title: "Konsultasi",
      href: "/products/consultation",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop&auto=format",
      bgColor: "bg-athfal-light-pink/30"
    },
    {
      title: "Merchandise",
      href: "/products/merchandise",
      image: "https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=100&h=100&fit=crop&auto=format",
      bgColor: "bg-athfal-bright-yellow/20"
    }
  ];

  return (
    <section className="py-16 bg-athfal-peach/10">
      <div className="athfal-container">
        <h2 className="text-3xl font-bold text-center mb-12 text-athfal-pink">
          {language === 'id' ? 'Kategori Produk Kami' : 'Our Product Categories'}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.title} {...category} />
          ))}
        </div>
      </div>
    </section>
  );
};
