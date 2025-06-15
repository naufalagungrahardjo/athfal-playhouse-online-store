import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWebsiteCopy } from '@/hooks/useWebsiteCopy';

export const AboutSection = () => {
  const { language } = useLanguage();
  const { copy } = useWebsiteCopy();

  return (
    <section className="py-16 bg-gradient-to-br from-athfal-light-pink/20 to-athfal-peach/30">
      <div className="athfal-container">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-6 text-athfal-pink">
              {language === 'id' ? copy.homePage.aboutTitle.id : copy.homePage.aboutTitle.en}
            </h2>
            <p className="text-gray-700 mb-6">
              {language === 'id'
                ? copy.homePage.aboutDescription.id
                : copy.homePage.aboutDescription.en}
            </p>
            <p className="text-gray-700 mb-6">
              {language === 'id'
                ? copy.homePage.aboutExtraParagraph.id
                : copy.homePage.aboutExtraParagraph.en}
            </p>
            <a href="/about">
              <Button className="bg-athfal-teal hover:bg-athfal-teal/80 text-white py-2 px-6">
                {language === 'id' ? 'Pelajari Lebih Lanjut' : 'Learn More'}
              </Button>
            </a>
          </div>
          <div className="md:w-1/2 mt-6 md:mt-0">
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-xl">
                <img
                  src={copy.homePage.heroImage}
                  alt="Children playing"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-athfal-yellow rounded-full p-4 shadow-lg animate-bounce-slow">
                <img
                  src={copy.homePage.aboutDecorativeImage || "/lovable-uploads/4e490da3-e092-4eec-b20b-d66ed04832e7.png"}
                  alt="Decorative element"
                  className="w-16 h-16"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
