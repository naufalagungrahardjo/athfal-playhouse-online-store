
import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <img 
            src="/lovable-uploads/bcf7e399-f8e5-4001-8bfe-dd335c021c8e.png" 
            alt="Athfal Playhouse Logo" 
            className="h-16 mx-auto"
          />
        </div>
        
        <h1 className="text-6xl font-bold text-athfal-pink mb-4">404</h1>
        
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {language === 'id' 
            ? 'Halaman tidak ditemukan' 
            : 'Page not found'}
        </h2>
        
        <p className="text-gray-600 mb-8">
          {language === 'id' 
            ? 'Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.' 
            : 'Sorry, the page you are looking for doesn\'t exist or has been moved.'}
        </p>
        
        <div className="space-y-4">
          <Link to="/">
            <Button className="bg-athfal-pink hover:bg-athfal-pink/80 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
          <path 
            fill="#fac3bf" 
            fillOpacity="0.2" 
            d="M0,224L40,208C80,192,160,160,240,160C320,160,400,192,480,197.3C560,203,640,181,720,186.7C800,192,880,224,960,218.7C1040,213,1120,171,1200,149.3C1280,128,1360,128,1400,128L1440,128L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"
          ></path>
        </svg>
      </div>
    </div>
  );
};

export default NotFound;
