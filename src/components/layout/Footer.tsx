
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const { t, language } = useLanguage();

  return (
    <footer className="bg-athfal-peach/30 pt-12 pb-6">
      <div className="athfal-container">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Logo and Info */}
          <div className="col-span-1 md:col-span-1 lg:col-span-1">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/bcf7e399-f8e5-4001-8bfe-dd335c021c8e.png" 
                alt="Athfal Playhouse Logo" 
                className="h-12"
              />
            </Link>
            <p className="mt-4 text-gray-700">
              {language === 'id' 
                ? 'Tempat bermain dan belajar untuk anak-anak yang menyenangkan dan edukatif.' 
                : 'A fun and educational play and learning space for children.'}
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-athfal-pink mb-4">
              {language === 'id' ? 'Halaman' : 'Pages'}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-700 hover:text-athfal-pink">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link to="/products/pop-up-class" className="text-gray-700 hover:text-athfal-pink">
                  {t('products')}
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-gray-700 hover:text-athfal-pink">
                  {t('gallery')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-700 hover:text-athfal-pink">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-700 hover:text-athfal-pink">
                  {t('blog')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-700 hover:text-athfal-pink">
                  {t('faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Products */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-athfal-pink mb-4">
              {language === 'id' ? 'Kategori Produk' : 'Product Categories'}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products/pop-up-class" className="text-gray-700 hover:text-athfal-pink">
                  Pop Up Class
                </Link>
              </li>
              <li>
                <Link to="/products/bumi-class" className="text-gray-700 hover:text-athfal-pink">
                  Bumi Class
                </Link>
              </li>
              <li>
                <Link to="/products/tahsin-class" className="text-gray-700 hover:text-athfal-pink">
                  Tahsin Class
                </Link>
              </li>
              <li>
                <Link to="/products/play-kit" className="text-gray-700 hover:text-athfal-pink">
                  Play Kit
                </Link>
              </li>
              <li>
                <Link to="/products/consultation" className="text-gray-700 hover:text-athfal-pink">
                  Psychological Consultation
                </Link>
              </li>
              <li>
                <Link to="/products/merchandise" className="text-gray-700 hover:text-athfal-pink">
                  Merchandise & Others
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-athfal-pink mb-4">
              {t('contactUs')}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-athfal-pink mr-2 mt-0.5" />
                <span className="text-gray-700">
                  Apartemen Park View Depok Town Square Lt. 1, Jl. Margonda Daya, Depok, 16424
                </span>
              </li>
              <li>
                <a 
                  href="mailto:athfalplayhouse@gmail.com" 
                  className="flex items-center text-gray-700 hover:text-athfal-pink"
                >
                  <Mail className="w-5 h-5 text-athfal-pink mr-2" />
                  athfalplayhouse@gmail.com
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/082120614748" 
                  className="flex items-center text-gray-700 hover:text-athfal-pink"
                >
                  <Phone className="w-5 h-5 text-athfal-pink mr-2" />
                  082120614748
                </a>
              </li>
              <li className="pt-2">
                <div className="flex space-x-3">
                  <a
                    href="https://instagram.com/athfalplayhouse/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-2 rounded-full text-athfal-pink hover:bg-athfal-pink hover:text-white transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.youtube.com/@AthfalPlayhouse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-2 rounded-full text-athfal-pink hover:bg-athfal-pink hover:text-white transition-colors"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-athfal-pink/20 mt-8 pt-6 text-center">
          <p className="text-gray-700">
            &copy; {new Date().getFullYear()} Athfal Playhouse. {language === 'id' ? 'Hak Cipta Dilindungi.' : 'All Rights Reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
