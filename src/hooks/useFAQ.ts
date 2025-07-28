
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FAQ {
  id: string;
  question: {
    id: string;
    en: string;
  };
  answer: {
    id: string;
    en: string;
  };
  category: string;
  order: number;
}

// Default FAQ data that will be used if database is empty
const DEFAULT_FAQ: FAQ[] = [
  {
    id: "faq1",
    question: {
      id: "Apa itu Athfal Playhouse?",
      en: "What is Athfal Playhouse?",
    },
    answer: {
      id: "Athfal Playhouse adalah pusat edukasi anak yang menggabungkan metode bermain sambil belajar dengan nilai-nilai Islam. Kami menawarkan kelas pop-up, program reguler, dan konsultasi psikologi untuk anak-anak usia 2-7 tahun.",
      en: "Athfal Playhouse is a children's education center that combines play-based learning methods with Islamic values. We offer pop-up classes, regular programs, and psychological consultations for children aged 2-7 years.",
    },
    category: "general",
    order: 1,
  },
  {
    id: "faq2",
    question: {
      id: "Berapa usia minimum untuk anak-anak berpartisipasi?",
      en: "What is the minimum age for children to participate?",
    },
    answer: {
      id: "Program kami dirancang untuk anak-anak mulai dari usia 2 tahun. Beberapa kelas memiliki persyaratan usia spesifik yang dapat Anda lihat di halaman deskripsi kelas.",
      en: "Our programs are designed for children starting from the age of 2 years. Some classes have specific age requirements which you can see on the class description page.",
    },
    category: "classes",
    order: 2,
  },
  {
    id: "faq3",
    question: {
      id: "Bagaimana cara mendaftar untuk kelas?",
      en: "How do I register for classes?",
    },
    answer: {
      id: "Anda dapat mendaftar untuk kelas melalui situs web kami dengan memilih kelas yang diinginkan, menambahkannya ke keranjang, dan menyelesaikan proses checkout. Setelah pembayaran dikonfirmasi, Anda akan menerima email berisi detail kelas dan informasi lainnya.",
      en: "You can register for classes through our website by selecting the desired class, adding it to your cart, and completing the checkout process. After payment is confirmed, you will receive an email containing class details and other information.",
    },
    category: "registration",
    order: 3,
  },
];

export const useFAQ = () => {
  const [faqs, setFAQs] = useState<FAQ[]>(DEFAULT_FAQ);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching FAQs from database...');
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_num');

      if (error) {
        console.error('Error fetching FAQs:', error);
        throw error;
      }
      
      console.log('FAQs fetched:', data);
      
      // Transform database format to component format
      const transformedFAQs: FAQ[] = (data || []).map(faq => ({
        id: faq.id,
        question: {
          id: faq.question_id,
          en: faq.question_en
        },
        answer: {
          id: faq.answer_id,
          en: faq.answer_en
        },
        category: faq.category,
        order: faq.order_num
      }));
      
      setFAQs(transformedFAQs.length > 0 ? transformedFAQs : DEFAULT_FAQ);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to fetch FAQs');
      setFAQs(DEFAULT_FAQ); // Fallback to default
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  const getFAQsByCategory = (category: string) => {
    if (category === 'all') return faqs;
    return faqs.filter(faq => faq.category === category);
  };

  return {
    faqs,
    loading,
    error,
    fetchFAQs,
    getFAQsByCategory
  };
};
