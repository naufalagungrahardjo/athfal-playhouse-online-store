
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWebsiteCopy } from "@/hooks/useWebsiteCopy";

export const CTASection = () => {
  const { copy } = useWebsiteCopy();
  const { language } = useLanguage();

  return (
    <section className="py-16 bg-gradient-to-br from-athfal-teal-light/30 to-athfal-pink/10">
      <div className="athfal-container flex flex-col gap-8">
        <div className="w-full text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-athfal-teal mb-4">
            {language === "id"
              ? copy.homePage.ctaSectionTitle.id
              : copy.homePage.ctaSectionTitle.en}
          </h2>
          <p className="text-gray-700 mb-6">
            {language === "id"
              ? copy.homePage.ctaSectionSubtitle.id
              : copy.homePage.ctaSectionSubtitle.en}
          </p>
          <Link to="/products">
            <Button className="bg-athfal-pink hover:bg-athfal-pink/80 text-white py-3 px-8 rounded-full text-lg">
              {language === 'id' ? 'Daftar Kelas' : 'Register for Classes'}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
