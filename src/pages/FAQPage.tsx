
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
import { useDatabase } from "@/hooks/useDatabase";

const FAQPage = () => {
  const { language } = useLanguage();
  const { faqs, loading } = useDatabase();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Filter FAQs based on search term and category
  const filteredFAQs = faqs.filter((faq) => {
    const question = language === "id" ? faq.question_id : faq.question_en;
    const answer = language === "id" ? faq.answer_id : faq.answer_en;
    
    const matchesSearch =
      question.toLowerCase().includes(search.toLowerCase()) ||
      answer.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(faqs.map((faq) => faq.category)))];

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-athfal-pink mx-auto mb-4"></div>
          <p>{language === "id" ? "Memuat FAQ..." : "Loading FAQs..."}</p>
        </div>
      </div>
    );
  }

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
                    {language === "id" ? faq.question_id : faq.question_en}
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 text-gray-700">
                    {language === "id" ? faq.answer_id : faq.answer_en}
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
