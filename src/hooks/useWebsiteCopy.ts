import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  gallery: CopyField;
};

type ProductCategoryCopy = {
  [key: string]: {
    title: CopyField;
    description: CopyField;
  }
};

type PaymentConfirmationCopy = {
  title: CopyField;
  description: CopyField;
};

export type WebsiteCopy = {
  homePage: HomePageCopy;
  navigation: NavigationCopy;
  productCategories: ProductCategoryCopy;
  paymentConfirmation: PaymentConfirmationCopy;
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
    gallery: { id: "Galeri", en: "Gallery" },
  },
  productCategories: {},
  paymentConfirmation: {
    title: { id: "Konfirmasi Pembayaran", en: "Payment Confirmation" },
    description: { id: "Setelah melakukan pembayaran, mohon kirimkan bukti pembayaran Anda ke WhatsApp admin kami dengan menekan tombol di bawah ini.", en: "After making the payment, please send your payment proof to our admin via WhatsApp by clicking the button below." },
  },
};

function mergeCopy(stored: any): WebsiteCopy {
  if (!stored) return DEFAULT_COPY;
  return {
    homePage: { ...DEFAULT_COPY.homePage, ...stored.homePage },
    navigation: { ...DEFAULT_COPY.navigation, ...stored.navigation },
    productCategories: { ...DEFAULT_COPY.productCategories, ...stored.productCategories },
    paymentConfirmation: { ...DEFAULT_COPY.paymentConfirmation, ...stored.paymentConfirmation },
  };
}

export function useWebsiteCopy() {
  const [copy, setCopy] = useState<WebsiteCopy>(DEFAULT_COPY);
  const [loading, setLoading] = useState(true);

  const fetchCopy = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('website_copy')
        .select('content')
        .eq('id', 'main')
        .maybeSingle();

      if (error) {
        console.error('Error fetching website copy:', error);
        return;
      }

      if (data?.content && typeof data.content === 'object' && Object.keys(data.content as object).length > 0) {
        setCopy(mergeCopy(data.content));
      }
    } catch (err) {
      console.error('Error fetching website copy:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCopy();

    // Listen for real-time updates
    const channel = supabase
      .channel('website_copy_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'website_copy',
        filter: 'id=eq.main'
      }, () => {
        fetchCopy();
      })
      .subscribe();

    // Also listen for in-app event (for same-tab updates)
    const handleUpdate = () => fetchCopy();
    window.addEventListener("websiteCopyUpdated", handleUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("websiteCopyUpdated", handleUpdate);
    };
  }, [fetchCopy]);

  return { copy, loading };
}

export { DEFAULT_COPY };
