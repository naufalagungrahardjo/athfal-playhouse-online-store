
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save, Globe, FileText } from "lucide-react";

// Website copy data structure
const WEBSITE_COPY = {
  homePage: {
    heroTitle: {
      id: "Belajar Sambil Bermain dengan Athfal Playhouse",
      en: "Learn Through Play with Athfal Playhouse",
    },
    heroSubtitle: {
      id: "Mengembangkan potensi anak melalui pendekatan Islami yang menyenangkan",
      en: "Developing your child's potential through a fun Islamic approach",
    },
    ctaButton: {
      id: "Jelajahi Kelas Kami",
      en: "Explore Our Classes",
    },
    aboutTitle: {
      id: "Tentang Athfal Playhouse",
      en: "About Athfal Playhouse",
    },
    aboutDescription: {
      id: "Athfal Playhouse adalah pusat edukasi anak yang menggabungkan metode bermain sambil belajar dengan nilai-nilai Islam.",
      en: "Athfal Playhouse is a children's education center that combines play-based learning methods with Islamic values.",
    }
  },
  navigation: {
    home: { id: "Beranda", en: "Home" },
    about: { id: "Tentang Kami", en: "About Us" },
    products: { id: "Produk", en: "Products" },
    blog: { id: "Blog", en: "Blog" },
    contact: { id: "Kontak", en: "Contact" },
    faq: { id: "FAQ", en: "FAQ" }
  },
  productCategories: {
    popUpClass: {
      title: { id: "Pop Up Class", en: "Pop Up Class" },
      description: {
        id: "Kelas one-time untuk anak-anak dengan tema yang menarik dan aktivitas yang menyenangkan.",
        en: "One-time classes for children with exciting themes and fun activities.",
      }
    },
    bumiClass: {
      title: { id: "Bumi Class", en: "Bumi Class" },
      description: {
        id: "Program reguler yang berfokus pada pembelajaran tentang alam dan lingkungan.",
        en: "Regular program focused on learning about nature and the environment.",
      }
    },
    tahsinClass: {
      title: { id: "Tahsin Class", en: "Tahsin Class" },
      description: {
        id: "Program pembelajaran Al-Quran dengan metode yang menyenangkan.",
        en: "Quran learning program with fun methods.",
      }
    }
  }
};

const AdminWebsiteCopy = () => {
  const { toast } = useToast();
  const [copy, setCopy] = useState(WEBSITE_COPY);
  const [activeTab, setActiveTab] = useState("home");

  const handleSave = () => {
    // In a real implementation, this would save to database
    toast({
      title: "Website copy updated",
      description: "Your changes have been saved successfully.",
    });
  };

  const updateText = (section: string, field: string, language: string, value: string) => {
    setCopy(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: {
          ...(prev[section as keyof typeof prev][field as keyof typeof prev[keyof typeof prev]] as any),
          [language]: value
        }
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-8 w-8 text-athfal-pink" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Website Copywriting</h2>
            <p className="text-gray-600">Manage all website text content in multiple languages</p>
          </div>
        </div>
        <Button onClick={handleSave} className="bg-athfal-pink hover:bg-athfal-pink/90">
          <Save className="mr-2 h-4 w-4" /> Save All Changes
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="home">Home Page</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="categories">Product Categories</TabsTrigger>
        </TabsList>
        
        {/* Home Page Content */}
        <TabsContent value="home" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Hero Section
              </CardTitle>
              <CardDescription>
                Main banner text and call-to-action on the homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Title (Indonesian)</Label>
                  <Input
                    value={copy.homePage.heroTitle.id}
                    onChange={(e) => updateText('homePage', 'heroTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Title (English)</Label>
                  <Input
                    value={copy.homePage.heroTitle.en}
                    onChange={(e) => updateText('homePage', 'heroTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Subtitle (Indonesian)</Label>
                  <Textarea
                    rows={3}
                    value={copy.homePage.heroSubtitle.id}
                    onChange={(e) => updateText('homePage', 'heroSubtitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Subtitle (English)</Label>
                  <Textarea
                    rows={3}
                    value={copy.homePage.heroSubtitle.en}
                    onChange={(e) => updateText('homePage', 'heroSubtitle', 'en', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Call-to-Action Button (Indonesian)</Label>
                  <Input
                    value={copy.homePage.ctaButton.id}
                    onChange={(e) => updateText('homePage', 'ctaButton', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Call-to-Action Button (English)</Label>
                  <Input
                    value={copy.homePage.ctaButton.en}
                    onChange={(e) => updateText('homePage', 'ctaButton', 'en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Section</CardTitle>
              <CardDescription>
                About us content on the homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>About Title (Indonesian)</Label>
                  <Input
                    value={copy.homePage.aboutTitle.id}
                    onChange={(e) => updateText('homePage', 'aboutTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>About Title (English)</Label>
                  <Input
                    value={copy.homePage.aboutTitle.en}
                    onChange={(e) => updateText('homePage', 'aboutTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>About Description (Indonesian)</Label>
                  <Textarea
                    rows={4}
                    value={copy.homePage.aboutDescription.id}
                    onChange={(e) => updateText('homePage', 'aboutDescription', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>About Description (English)</Label>
                  <Textarea
                    rows={4}
                    value={copy.homePage.aboutDescription.en}
                    onChange={(e) => updateText('homePage', 'aboutDescription', 'en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Navigation Content */}
        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Menu</CardTitle>
              <CardDescription>
                Text for main navigation menu items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(copy.navigation).map(([key, value]) => (
                <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label className="capitalize">{key} (Indonesian)</Label>
                    <Input
                      value={value.id}
                      onChange={(e) => updateText('navigation', key, 'id', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="capitalize">{key} (English)</Label>
                    <Input
                      value={value.en}
                      onChange={(e) => updateText('navigation', key, 'en', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Product Categories Content */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>
                Titles and descriptions for product category pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(copy.productCategories).map(([key, category]) => (
                <div key={key} className="border rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title (Indonesian)</Label>
                      <Input
                        value={category.title.id}
                        onChange={(e) => updateText('productCategories', `${key}.title`, 'id', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title (English)</Label>
                      <Input
                        value={category.title.en}
                        onChange={(e) => updateText('productCategories', `${key}.title`, 'en', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Description (Indonesian)</Label>
                      <Textarea
                        rows={3}
                        value={category.description.id}
                        onChange={(e) => updateText('productCategories', `${key}.description`, 'id', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (English)</Label>
                      <Textarea
                        rows={3}
                        value={category.description.en}
                        onChange={(e) => updateText('productCategories', `${key}.description`, 'en', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminWebsiteCopy;
