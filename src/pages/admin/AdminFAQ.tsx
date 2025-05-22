
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { GripVertical, Plus, Save, Trash2 } from "lucide-react";

// FAQ type
interface FAQ {
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

// Mock FAQ data
const MOCK_FAQ: FAQ[] = [
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

// FAQ categories
const FAQ_CATEGORIES = [
  "general",
  "classes",
  "registration",
  "payment",
];

const AdminFAQ = () => {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>(MOCK_FAQ);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredFaqs = activeCategory === "all" 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);
  
  const sortedFaqs = [...filteredFaqs].sort((a, b) => a.order - b.order);

  const handleAddFaq = () => {
    const newFaq: FAQ = {
      id: `faq${faqs.length + 1}`,
      question: {
        id: "",
        en: "",
      },
      answer: {
        id: "",
        en: "",
      },
      category: "general",
      order: faqs.length + 1,
    };
    
    setFaqs([...faqs, newFaq]);
    
    toast({
      title: "FAQ added",
      description: "A new FAQ has been added. Fill in the details and save your changes.",
    });
  };

  const handleUpdateFaq = (id: string, field: keyof FAQ, language: string | null, value: string) => {
    setFaqs(prev => 
      prev.map(faq => {
        if (faq.id !== id) return faq;
        
        if (field === "category") {
          return { ...faq, category: value };
        }
        
        if (language && (field === "question" || field === "answer")) {
          const updatedFaq = { ...faq };
          const fieldObj = updatedFaq[field];
          
          if (fieldObj && typeof fieldObj === 'object' && 'id' in fieldObj && 'en' in fieldObj) {
            (fieldObj as Record<string, string>)[language] = value;
          }
          
          return updatedFaq;
        }
        
        return faq;
      })
    );
  };

  const handleDeleteFaq = (id: string) => {
    setFaqs(prev => prev.filter(faq => faq.id !== id));
    
    toast({
      title: "FAQ deleted",
      description: "The FAQ has been removed.",
      variant: "destructive",
    });
  };

  const handleSaveFaqs = () => {
    // In a real app, this would save to a database/API
    toast({
      title: "FAQs saved",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">FAQ Management</h2>
        <div className="flex gap-2">
          <Button onClick={handleAddFaq}>
            <Plus className="mr-2 h-4 w-4" /> Add New FAQ
          </Button>
          <Button onClick={handleSaveFaqs} variant="secondary">
            <Save className="mr-2 h-4 w-4" /> Save All
          </Button>
        </div>
      </div>
      
      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory("all")}
        >
          All
        </Button>
        {FAQ_CATEGORIES.map(category => (
          <Button
            key={category}
            variant={activeCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>
      
      {/* FAQ list */}
      <div className="space-y-4">
        {sortedFaqs.map(faq => (
          <Card key={faq.id} className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move opacity-50 hover:opacity-100">
              <GripVertical className="h-6 w-6" />
            </div>
            <CardHeader className="px-12">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">FAQ #{faq.order}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500"
                  onClick={() => handleDeleteFaq(faq.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-12 pb-6 space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={faq.category}
                  onValueChange={(value) => handleUpdateFaq(faq.id, "category", null, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {FAQ_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`question-id-${faq.id}`}>Question (Indonesian)</Label>
                  <Input
                    id={`question-id-${faq.id}`}
                    value={faq.question.id}
                    onChange={(e) => handleUpdateFaq(faq.id, "question", "id", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`question-en-${faq.id}`}>Question (English)</Label>
                  <Input
                    id={`question-en-${faq.id}`}
                    value={faq.question.en}
                    onChange={(e) => handleUpdateFaq(faq.id, "question", "en", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`answer-id-${faq.id}`}>Answer (Indonesian)</Label>
                  <Textarea
                    id={`answer-id-${faq.id}`}
                    value={faq.answer.id}
                    onChange={(e) => handleUpdateFaq(faq.id, "answer", "id", e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`answer-en-${faq.id}`}>Answer (English)</Label>
                  <Textarea
                    id={`answer-en-${faq.id}`}
                    value={faq.answer.en}
                    onChange={(e) => handleUpdateFaq(faq.id, "answer", "en", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {sortedFaqs.length === 0 && (
          <div className="text-center py-8 border rounded-lg border-dashed">
            <p className="text-gray-500">No FAQs found in this category.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddFaq}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" /> Add FAQ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFAQ;
