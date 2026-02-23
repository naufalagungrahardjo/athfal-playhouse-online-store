
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'id' | 'en';

type Translations = {
  [key: string]: {
    id: string;
    en: string;
  };
};

// Initial translations
const translations: Translations = {
  home: {
    id: 'Beranda',
    en: 'Home',
  },
  products: {
    id: 'Produk',
    en: 'Products',
  },
  gallery: {
    id: 'Galeri',
    en: 'Gallery',
  },
  about: {
    id: 'Tentang Kami',
    en: 'About Us',
  },
  contact: {
    id: 'Kontak',
    en: 'Contact',
  },
  blog: {
    id: 'Blog',
    en: 'Blog',
  },
  login: {
    id: 'Masuk',
    en: 'Login',
  },
  signup: {
    id: 'Daftar',
    en: 'Sign Up',
  },
  profile: {
    id: 'Profil',
    en: 'Profile',
  },
  logout: {
    id: 'Keluar',
    en: 'Logout',
  },
  faq: {
    id: 'FAQ',
    en: 'FAQ',
  },
  cart: {
    id: 'Keranjang',
    en: 'Cart',
  },
  checkout: {
    id: 'Pembayaran',
    en: 'Checkout',
  },
  addToCart: {
    id: 'Tambah ke Keranjang',
    en: 'Add to Cart',
  },
  buyNow: {
    id: 'Beli Sekarang',
    en: 'Buy Now',
  },
  price: {
    id: 'Harga',
    en: 'Price',
  },
  quantity: {
    id: 'Jumlah',
    en: 'Quantity',
  },
  total: {
    id: 'Total',
    en: 'Total',
  },
  tax: {
    id: 'Pajak',
    en: 'Tax',
  },
  subtotal: {
    id: 'Subtotal',
    en: 'Subtotal',
  },
  payment: {
    id: 'Pembayaran',
    en: 'Payment',
  },
  confirmPayment: {
    id: 'Konfirmasi Pembayaran',
    en: 'Confirm Payment',
  },
  contactUs: {
    id: 'Hubungi Kami',
    en: 'Contact Us',
  },
  address: {
    id: 'Alamat',
    en: 'Address',
  },
  email: {
    id: 'Email',
    en: 'Email',
  },
  phone: {
    id: 'Telepon',
    en: 'Phone',
  },
  whatsapp: {
    id: 'WhatsApp',
    en: 'WhatsApp',
  },
  childAge: {
    id: 'Usia Anak',
    en: 'Child Age',
  },
  childBirthdate: {
    id: 'Tanggal Lahir Anak',
    en: 'Child Birthdate',
  },
  childFieldNote: {
    id: 'Wajib diisi jika membeli produk berkategori kelas',
    en: 'Required if purchasing class category products',
  },
};

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  translations: Translations;
  updateTranslations: (newTranslations: Translations) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('id');
  const [allTranslations, setAllTranslations] = useState<Translations>(translations);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem('language') as Language;
    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
  }, []);

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    if (!allTranslations[key]) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    return allTranslations[key][language] || key;
  };

  const updateTranslations = (newTranslations: Translations) => {
    setAllTranslations(prev => ({ ...prev, ...newTranslations }));
  };

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        setLanguage, 
        t,
        translations: allTranslations,
        updateTranslations
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
