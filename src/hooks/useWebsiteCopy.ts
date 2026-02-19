import { useState, useEffect } from "react";

type CopyField = { id: string; en: string };
type HomePageCopy = {
  heroTitle: CopyField;
  heroSubtitle: CopyField;
  ctaButton: CopyField;
  aboutTitle: CopyField;
  aboutDescription: CopyField;
  aboutExtraParagraph: CopyField;
  aboutDecorativeImage?: string;
  ctaSectionTitle: CopyField;
  ctaSectionSubtitle: CopyField;
  homeSlogan: CopyField;
};

type NavigationCopy = {
  home: CopyField;
  about: CopyField;
  products: CopyField;
  blog: CopyField;
  contact: CopyField;
  faq: CopyField;
  gallery: CopyField; // <--- Added gallery field!
};

type ProductCategoryCopy = {
  [key: string]: {
    title: CopyField;
    description: CopyField;
  }
};

type WebsiteCopy = {
  homePage: HomePageCopy;
  navigation: NavigationCopy;
  productCategories: ProductCategoryCopy;
};

const DEFAULT_COPY: WebsiteCopy = {
  homePage: {
    heroTitle: { id: "Belajar Sambil Bermain dengan Athfal Playhouse", en: "Learn Through Play with Athfal Playhouse" },
    heroSubtitle: { id: "Mengembangkan potensi anak melalui pendekatan Islami yang menyenangkan", en: "Developing your child's potential through a fun Islamic approach" },
    ctaButton: { id: "Jelajahi Kelas Kami", en: "Explore Our Classes" },
    aboutTitle: { id: "Tentang Athfal Playhouse", en: "About Athfal Playhouse" },
    aboutDescription: { id: "Athfal Playhouse adalah pusat edukasi anak yang menggabungkan metode bermain sambil belajar dengan nilai-nilai Islam.", en: "Athfal Playhouse is a children's education center that combines play-based learning methods with Islamic values." },
    aboutExtraParagraph: { id: "Dengan metode pembelajaran yang interaktif dan menyenangkan, kami membantu anak-anak untuk mengembangkan kreativitas dan kemampuan berpikir kritis mereka sejak dini.", en: "With interactive and fun learning methods, we help children develop their creativity and critical thinking skills from an early age." },
    aboutDecorativeImage: "/lovable-uploads/4e490da3-e092-4eec-b20b-d66ed04832e7.png",
    ctaSectionTitle: { id: "Bergabung Sekarang", en: "Join Now" },
    ctaSectionSubtitle: { id: "Temukan berbagai kegiatan menyenangkan dan edukatif untuk anak-anak Anda di Athfal Playhouse!", en: "Discover various fun and educational activities for your children at Athfal Playhouse!" },
    homeSlogan: { id: "Tempat bermain dan belajar yang menyenangkan untuk anak-anak.", en: "A fun and educational play and learning space for children." }
  },
  navigation: {
    home: { id: "Beranda", en: "Home" },
    about: { id: "Tentang Kami", en: "About Us" },
    products: { id: "Produk", en: "Products" },
    blog: { id: "Blog", en: "Blog" },
    contact: { id: "Kontak", en: "Contact" },
    faq: { id: "FAQ", en: "FAQ" },
    gallery: { id: "Galeri", en: "Gallery" }, // <--- Added gallery field!
  },
  productCategories: {}
};

export function useWebsiteCopy() {
  const [copy, setCopy] = useState<WebsiteCopy>(DEFAULT_COPY);

  const loadFromStorage = () => {
    const stored = localStorage.getItem("websiteCopy");
    if (stored) {
      try {
        setCopy(JSON.parse(stored));
      } catch {
        setCopy(DEFAULT_COPY);
      }
    }
  };

  useEffect(() => {
    loadFromStorage();

    // Listen for changes from the CMS admin
    const handleUpdate = () => loadFromStorage();
    window.addEventListener("websiteCopyUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("websiteCopyUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return { copy };
}
