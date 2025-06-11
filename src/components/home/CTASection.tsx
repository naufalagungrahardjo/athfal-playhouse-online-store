
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export const CTASection = () => {
  const { language } = useLanguage();

  return (
    <section className="py-16 bg-athfal-yellow/30">
      <div className="athfal-container text-center">
        <h2 className="text-3xl font-bold mb-6 text-athfal-pink">
          {language === 'id' ? 'Bergabung Sekarang' : 'Join Now'}
        </h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
          {language === 'id' 
            ? 'Temukan berbagai kegiatan menyenangkan dan edukatif untuk anak-anak Anda di Athfal Playhouse!'
            : 'Discover various fun and educational activities for your children at Athfal Playhouse!'
          }
        </p>
        <Link to="/products/pop-up-class">
          <Button className="bg-athfal-pink hover:bg-athfal-pink/80 text-white py-3 px-8 rounded-full text-lg">
            {language === 'id' ? 'Daftar Kelas' : 'Register for Classes'}
          </Button>
        </Link>
      </div>
    </section>
  );
};
