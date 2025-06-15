
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAboutContent } from '@/hooks/useAboutContent';

export const AboutSection = () => {
  const { language } = useLanguage();
  const { content } = useAboutContent();

  return (
    <section className="py-16 bg-gradient-to-br from-athfal-light-pink/20 to-athfal-peach/30">
      <div className="athfal-container">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-6 text-athfal-pink">
              {language === 'id' ? content.heroTitle.id : content.heroTitle.en}
            </h2>
            <p className="text-gray-700 mb-6">
              {language === 'id'
                ? content.heroSubtitle.id
                : content.heroSubtitle.en}
            </p>
            {/* Extra paragraph using visionDescription as a meaningful CMS field.
                You could create a dedicated aboutExtraParagraph in about_content if needed */}
            <p className="text-gray-700 mb-6">
              {language === 'id'
                ? content.visionDescription.id
                : content.visionDescription.en}
            </p>
            <Link to="/about">
              <Button className="bg-athfal-teal hover:bg-athfal-teal/80 text-white py-2 px-6">
                {language === 'id' ? 'Pelajari Lebih Lanjut' : 'Learn More'}
              </Button>
            </Link>
          </div>
          <div className="md:w-1/2 mt-6 md:mt-0">
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-xl">
                <img
                  src={content.heroImage}
                  alt="Children playing"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-athfal-yellow rounded-full p-4 shadow-lg animate-bounce-slow">
                <img
                  src="/lovable-uploads/4e490da3-e092-4eec-b20b-d66ed04832e7.png"
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
