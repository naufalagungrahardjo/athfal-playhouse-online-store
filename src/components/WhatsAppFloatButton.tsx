
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

interface ContactDetails {
  whatsapp: string;
}

export const WhatsAppFloatButton = () => {
  const { language } = useLanguage();
  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    whatsapp: '082120614748', // Default value
  });

  // In a real implementation, this would fetch from the database/API
  useEffect(() => {
    // This is where we would fetch the contact details from the API
    // For now, we'll use the default value
  }, []);

  const handleWhatsAppClick = () => {
    const message = language === 'id'
      ? 'Halo Athfal Playhouse, saya ingin bertanya tentang layanan Anda.'
      : 'Hello Athfal Playhouse, I would like to inquire about your services.';
      
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${contactDetails.whatsapp.replace(/^0/, '62')}?text=${encodedMessage}`;
    
    window.open(url, '_blank');
  };

  return (
    <button 
      className="whatsapp-float"
      onClick={handleWhatsAppClick}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
};
