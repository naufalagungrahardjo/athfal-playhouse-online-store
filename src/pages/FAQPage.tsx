
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Mock FAQ data
const MOCK_FAQ = [
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
  },
  {
    id: "faq4",
    question: {
      id: "Apakah orang tua diharapkan hadir selama kelas?",
      en: "Are parents expected to be present during classes?",
    },
    answer: {
      id: "Untuk anak-anak di bawah usia 4 tahun, kami mengharapkan kehadiran orang tua atau pengasuh selama sesi kelas. Untuk anak-anak yang lebih tua, kehadiran orang tua bersifat opsional, tetapi kami menyambut partisipasi orang tua yang ingin bergabung.",
      en: "For children under the age of 4, we expect parents or caregivers to be present during class sessions. For older children, parent attendance is optional, but we welcome the participation of parents who wish to join.",
    },
    category: "classes",
  },
  {
    id: "faq5",
    question: {
      id: "Bagaimana kebijakan pembatalan dan pengembalian dana?",
      en: "What is the cancellation and refund policy?",
    },
    answer: {
      id: "Pembatalan yang dilakukan 7 hari atau lebih sebelum tanggal kelas akan menerima pengembalian dana penuh. Pembatalan kurang dari 7 hari sebelum kelas akan dikenakan biaya administrasi 20%. Tidak ada pengembalian dana untuk pembatalan pada hari kelas atau ketidakhadiran.",
      en: "Cancellations made 7 days or more before the class date will receive a full refund. Cancellations less than 7 days before class will be charged a 20% administration fee. No refunds for cancellations on the day of class or for no-shows.",
    },
    category: "payment",
  },
  {
    id: "faq6",
    question: {
      id: "Apakah ada diskon untuk pendaftaran beberapa kelas?",
      en: "Are there discounts for multiple class registrations?",
    },
    answer: {
      id: "Ya, kami menawarkan diskon 10% untuk pendaftaran dua kelas dan 15% untuk tiga kelas atau lebih. Diskon ini akan otomatis diterapkan saat checkout.",
      en: "Yes, we offer a 10% discount for two class registrations and 15% for three or more classes. These discounts will be automatically applied at checkout.",
    },
    category: "payment",
  },
  {
    id: "faq7",
    question: {
      id: "Apa yang perlu dibawa anak saya ke kelas?",
      en: "What does my child need to bring to class?",
    },
    answer: {
      id: "Anak Anda hanya perlu membawa pakaian yang nyaman dan botol air. Semua material dan peralatan untuk aktivitas kelas akan disediakan oleh Athfal Playhouse.",
      en: "Your child only needs to bring comfortable clothing and a water bottle. All materials and equipment for class activities will be provided by Athfal Playhouse.",
    },
    category: "classes",
  },
  {
    id: "faq8",
    question: {
      id: "Bagaimana jika anak saya melewatkan sesi kelas?",
      en: "What if my child misses a class session?",
    },
    answer: {
      id: "Jika anak Anda melewatkan sesi kelas karena sakit (dengan bukti medis) atau alasan penting lainnya, kami akan berusaha untuk menawarkan sesi pengganti atau memberikan kredit untuk kelas di masa mendatang. Harap beri tahu kami sesegera mungkin jika anak Anda tidak dapat menghadiri kelas.",
      en: "If your child misses a class session due to illness (with medical proof) or other important reasons, we will try to offer a replacement session or provide credit for future classes. Please let us know as soon as possible if your child is unable to attend class.",
    },
    category: "classes",
  },
];

const FAQPage = () => {
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Filter FAQs based on search term and category
  const filteredFAQs = MOCK_FAQ.filter((faq) => {
    const matchesSearch =
      faq.question[language === "id" ? "id" : "en"]
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      faq.answer[language === "id" ? "id" : "en"]
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(MOCK_FAQ.map((faq) => faq.category)))];

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <h1 className="text-3xl font-bold text-athfal-pink mb-8">
          {language === "id" ? "Pertanyaan yang Sering Diajukan" : "Frequently Asked Questions"}
        </h1>

        {/* Search bar */}
        <div className="mb-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder={
              language === "id" ? "Cari pertanyaan..." : "Search questions..."
            }
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full text-sm ${
                activeCategory === category
                  ? "bg-athfal-pink text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category === "all"
                ? language === "id"
                  ? "Semua"
                  : "All"
                : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* FAQ accordion */}
        <div className="bg-white rounded-xl p-6">
          {filteredFAQs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFAQs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
                    {faq.question[language === "id" ? "id" : "en"]}
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 text-gray-700">
                    {faq.answer[language === "id" ? "id" : "en"]}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {language === "id"
                ? "Tidak ada pertanyaan yang cocok dengan pencarian Anda."
                : "No questions match your search."}
            </div>
          )}
        </div>

        {/* Contact section */}
        <div className="mt-12 bg-athfal-peach/10 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-athfal-green mb-2">
            {language === "id"
              ? "Masih punya pertanyaan?"
              : "Still have questions?"}
          </h2>
          <p className="text-gray-700 mb-4">
            {language === "id"
              ? "Jangan ragu untuk menghubungi kami melalui WhatsApp atau email."
              : "Feel free to contact us via WhatsApp or email."}
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="https://wa.me/6282120614748"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-athfal-pink hover:bg-athfal-pink/80 text-white px-4 py-2 rounded-lg inline-flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                  clipRule="evenodd"
                />
              </svg>
              WhatsApp
            </a>
            <a
              href="mailto:athfalplayhouse@gmail.com"
              className="bg-white border border-athfal-green hover:bg-gray-50 text-athfal-green px-4 py-2 rounded-lg inline-flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
              </svg>
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
