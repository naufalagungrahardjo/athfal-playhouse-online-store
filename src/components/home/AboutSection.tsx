
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export const AboutSection = () => {
  const { language } = useLanguage();

  return (
    <section className="py-16 bg-gradient-to-br from-athfal-light-pink/20 to-athfal-peach/30">
      <div className="athfal-container">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-6 text-athfal-pink">
              {language === 'id' ? 'Tentang Athfal Playhouse' : 'About Athfal Playhouse'}
            </h2>
            <p className="text-gray-700 mb-6">
              {language === 'id' 
                ? 'Athfal Playhouse adalah tempat bermain dan belajar untuk anak-anak yang menyenangkan dan edukatif. Kami menyediakan berbagai program dan aktivitas yang dirancang untuk membantu perkembangan anak-anak baik secara kognitif maupun motorik.'
                : 'Athfal Playhouse is a fun and educational play and learning space for children. We provide a variety of programs and activities designed to help children\'s development both cognitively and motorically.'
              }
            </p>
            <p className="text-gray-700 mb-6">
              {language === 'id'
                ? 'Dengan metode pembelajaran yang interaktif dan menyenangkan, kami membantu anak-anak untuk mengembangkan kreativitas dan kemampuan berpikir kritis mereka sejak dini.'
                : 'With interactive and fun learning methods, we help children develop their creativity and critical thinking skills from an early age.'
              }
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
                  src="https://images.unsplash.com/photo-1635107510862-53886e926b74?w=800&h=600&fit=crop&auto=format"
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
