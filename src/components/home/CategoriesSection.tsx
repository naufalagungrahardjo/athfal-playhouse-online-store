import { useCategories } from '@/hooks/useCategories';
import { useLanguage } from '@/contexts/LanguageContext';
import { CategoryCard } from './CategoryCard';

export const CategoriesSection = () => {
  const { language } = useLanguage();
  const { categories, loading } = useCategories();

  return (
    <section className="py-16 bg-athfal-peach/10">
      <div className="athfal-container">
        <h2 className="text-3xl font-bold text-center mb-12 text-athfal-pink">
          {language === 'id' ? 'Kategori Produk Kami' : 'Our Product Categories'}
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-2xl aspect-square mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-2/3 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.title}
                href={`/products/${category.slug}`}
                image={category.image}
                bgColor={category.bg_color}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
