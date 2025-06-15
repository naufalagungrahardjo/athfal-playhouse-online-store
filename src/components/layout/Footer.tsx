import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

function getGoogleMapsEmbedUrl(rawUrl?: string) {
  // If no URL, fallback to a default location embed
  if (!rawUrl) {
    return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.566656536656!2d106.8199630758761!3d-6.186486960569591!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ec3aeb818273%3A0x8b6adf1b88bf2b14!2sApartemen%20Park%20View%20Depok%20Town%20Square%2C%20Jl.%20Margonda%20Daya%2C%20Depok%2C%2016424!5e0!3m2!1sen!2sid!4v1682329286740!5m2!1sen!2sid";
  }
  // Convert Google short link to embed (or fallback if not possible)
  // If admin provides a direct embed link, use it
  if (rawUrl.includes('google.com/maps/embed')) {
    return rawUrl;
  }
  // If admin provides a place/maps url (not embed), attempt to convert it
  if (rawUrl.startsWith('https://goo.gl') || rawUrl.startsWith('https://g.co') || rawUrl.startsWith('http://g.co')) {
    // The g.co/kgs... short links cannot be directly embedded.
    // Recommend admin to input EMBED link, but for now, default to fallback embed
    return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.566656536656!2d106.8199630758761!3d-6.186486960569591!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ec3aeb818273%3A0x8b6adf1b88bf2b14!2sApartemen%20Park%20View%20Depok%20Town%20Square%2C%20Jl.%20Margonda%20Daya%2C%20Depok%2C%2016424!5e0!3m2!1sen!2sid!4v1682329286740!5m2!1sen!2sid";
  }
  if (rawUrl.startsWith("https://www.google.com/maps/place/")) {
    // Convert place URL to embed by replacing /place/ with /embed?pb=
    // But best is for admin to copy the iframe src from Google Maps > Share > Embed a map
    // For now, fallback
    return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.566656536656!2d106.8199630758761!3d-6.186486960569591!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ec3aeb818273%3A0x8b6adf1b88bf2b14!2sApartemen%20Park%20View%20Depok%20Town%20Square%2C%20Jl.%20Margonda%20Daya%2C%20Depok%2C%2016424!5e0!3m2!1sen!2sid!4v1682329286740!5m2!1sen!2sid";
  }
  // Otherwise, fallback
  return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.566656536656!2d106.8199630758761!3d-6.186486960569591!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ec3aeb818273%3A0x8b6adf1b88bf2b14!2sApartemen%20Park%20View%20Depok%20Town%20Square%2C%20Jl.%20Margonda%20Daya%2C%20Depok%2C%2016424!5e0!3m2!1sen!2sid!4v1682329286740!5m2!1sen!2sid";
}

const Footer = () => {
  const { t, language } = useLanguage();
  const { contact } = useSettings();
  const googleMapsUrl = contact?.googleMapsUrl;
  const googleMapsEmbedUrl = getGoogleMapsEmbedUrl(googleMapsUrl);

  return (
    <footer className="bg-athfal-peach/30 pt-12 pb-6">
      <div className="athfal-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Info */}
          <div className="col-span-1">
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

          {/* Contact Info & Map */}
          <div className="col-span-1 flex flex-col h-full">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-athfal-pink flex items-center">
                <span>{t('contactUs')}</span>
              </h3>
            </div>
            <ul className="space-y-3 mb-2">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-athfal-pink mr-2 mt-0.5" />
                <span className="text-gray-700">
                  {contact?.address || "Apartemen Park View Depok Town Square Lt. 1, Jl. Margonda Daya, Depok, 16424"}
                </span>
              </li>
              <li>
                <a 
                  href={`mailto:${contact?.email || "athfalplayhouse@gmail.com"}`} 
                  className="flex items-center text-gray-700 hover:text-athfal-pink"
                >
                  <Mail className="w-5 h-5 text-athfal-pink mr-2" />
                  {contact?.email || "athfalplayhouse@gmail.com"}
                </a>
              </li>
              <li>
                <a 
                  href={`https://wa.me/${(contact?.whatsapp ?? "082120614748").replace(/[^0-9]/g, '')}`} 
                  className="flex items-center text-gray-700 hover:text-athfal-pink"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Phone className="w-5 h-5 text-athfal-pink mr-2" />
                  {contact?.whatsapp || "082120614748"}
                </a>
              </li>
              <li className="pt-2">
                <div className="flex space-x-3">
                  <a
                    href={contact?.instagram || "https://instagram.com/athfalplayhouse/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-2 rounded-full text-athfal-pink hover:bg-athfal-pink hover:text-white transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href={contact?.youtube || "https://www.youtube.com/@AthfalPlayhouse"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-2 rounded-full text-athfal-pink hover:bg-athfal-pink hover:text-white transition-colors"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                </div>
              </li>
            </ul>
            {/* Embedded Google Map */}
            <div className="w-full mt-5 border rounded-lg overflow-hidden shadow-xl bg-white">
              <iframe
                src={googleMapsEmbedUrl}
                title="Google Map Location"
                width="100%"
                height="200"
                loading="lazy"
                style={{ border: 0 }}
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {language === "id"
                ? "Lokasi di Google Maps sesuai pengaturan admin."
                : "Location as set in admin settings."}
            </p>
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
