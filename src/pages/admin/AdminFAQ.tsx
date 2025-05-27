
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { useDatabase } from "@/hooks/useDatabase";

const FAQ_CATEGORIES = [
  "general",
  "classes", 
  "registration",
  "payment",
];

const AdminFAQ = () => {
  const { faqs, loading, saveFAQ, deleteFAQ } = useDatabase();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [editingFAQs, setEditingFAQs] = useState<{[key: string]: any}>({});

  const filteredFaqs = activeCategory === "all" 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);
  
  const sortedFaqs = [...filteredFaqs].sort((a, b) => a.order_num - b.order_num);

  const handleAddFaq = () => {
    const newFaq = {
      question_id: "",
      question_en: "",
      answer_id: "",
      answer_en: "",
      category: "general",
      order_num: faqs.length + 1,
    };
    
    saveFAQ(newFaq);
  };

  const handleUpdateFaq = (id: string, field: string, value: string) => {
    setEditingFAQs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSaveFaq = (faq: any) => {
    const updatedFaq = {
      ...faq,
      ...editingFAQs[faq.id]
    };
    saveFAQ(updatedFaq);
    setEditingFAQs(prev => {
      const newState = { ...prev };
      delete newState[faq.id];
      return newState;
    });
  };

  const getCurrentFaqData = (faq: any) => {
    return {
      ...faq,
      ...editingFAQs[faq.id]
    };
  };

  if (loading) {
    return <div className="text-center py-8">Loading FAQs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">FAQ Management</h2>
        <Button onClick={handleAddFaq}>
          <Plus className="mr-2 h-4 w-4" /> Add New FAQ
        </Button>
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
        {sortedFaqs.map(faq => {
          const currentData = getCurrentFaqData(faq);
          return (
            <Card key={faq.id} className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move opacity-50 hover:opacity-100">
                <GripVertical className="h-6 w-6" />
              </div>
              <CardHeader className="px-12">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-lg">FAQ #{currentData.order_num}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveFaq(faq)}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => deleteFAQ(faq.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-12 pb-6 space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={currentData.category}
                    onValueChange={(value) => handleUpdateFaq(faq.id, "category", value)}
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
                      value={currentData.question_id}
                      onChange={(e) => handleUpdateFaq(faq.id, "question_id", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`question-en-${faq.id}`}>Question (English)</Label>
                    <Input
                      id={`question-en-${faq.id}`}
                      value={currentData.question_en}
                      onChange={(e) => handleUpdateFaq(faq.id, "question_en", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`answer-id-${faq.id}`}>Answer (Indonesian)</Label>
                    <Textarea
                      id={`answer-id-${faq.id}`}
                      value={currentData.answer_id}
                      onChange={(e) => handleUpdateFaq(faq.id, "answer_id", e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`answer-en-${faq.id}`}>Answer (English)</Label>
                    <Textarea
                      id={`answer-en-${faq.id}`}
                      value={currentData.answer_en}
                      onChange={(e) => handleUpdateFaq(faq.id, "answer_en", e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
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
