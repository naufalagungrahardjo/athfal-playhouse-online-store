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
    },
    aboutExtraParagraph: {
      id: "Dengan metode pembelajaran yang interaktif dan menyenangkan, kami membantu anak-anak untuk mengembangkan kreativitas dan kemampuan berpikir kritis mereka sejak dini.",
      en: "With interactive and fun learning methods, we help children develop their creativity and critical thinking skills from an early age.",
    },
    ctaSectionTitle: {
      id: "Bergabung Sekarang",
      en: "Join Now",
    },
    ctaSectionSubtitle: {
      id: "Temukan berbagai kegiatan menyenangkan dan edukatif untuk anak-anak Anda di Athfal Playhouse!",
      en: "Discover various fun and educational activities for your children at Athfal Playhouse!",
    },
    homeSlogan: {
      id: "Tempat bermain dan belajar yang menyenangkan untuk anak-anak.",
      en: "A fun and educational play and learning space for children.",
    },
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

// Import subcomponents
import HeroSectionEditor from "./website-copy/HeroSectionEditor";
import CTASectionEditor from "./website-copy/CTASectionEditor";
import SloganSectionEditor from "./website-copy/SloganSectionEditor";
import AboutSectionEditor from "./website-copy/AboutSectionEditor";
import NavigationEditor from "./website-copy/NavigationEditor";
import ProductCategoriesEditor from "./website-copy/ProductCategoriesEditor";

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

  const handleHomePageChange = (field: string, lang: "id" | "en", value: string) => {
    setCopy(prev => ({
      ...prev,
      homePage: {
        ...prev.homePage,
        [field]: {
          ...(prev.homePage as any)[field],
          [lang]: value,
        }
      }
    }));
  };

  const handleAboutChange = (field: string, lang: "id" | "en", value: string) => {
    handleHomePageChange(field, lang, value);
  };

  const handleNavigationChange = (key: string, lang: "id" | "en", value: string) => {
    setCopy(prev => ({
      ...prev,
      navigation: {
        ...prev.navigation,
        [key]: {
          ...prev.navigation[key],
          [lang]: value
        }
      }
    }));
  };

  const handleProductCategoriesChange = (path: string, lang: "id" | "en", value: string) => {
    // path format: `${key}.title` or `${key}.description`
    const [key, sub] = path.split(".");
    setCopy(prev => ({
      ...prev,
      productCategories: {
        ...prev.productCategories,
        [key]: {
          ...prev.productCategories[key],
          [sub]: {
            ...prev.productCategories[key][sub],
            [lang]: value
          }
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
          <HeroSectionEditor
            heroTitle={copy.homePage.heroTitle}
            heroSubtitle={copy.homePage.heroSubtitle}
            ctaButton={copy.homePage.ctaButton}
            onChange={handleHomePageChange}
          />
          <CTASectionEditor
            ctaSectionTitle={copy.homePage.ctaSectionTitle}
            ctaSectionSubtitle={copy.homePage.ctaSectionSubtitle}
            onChange={handleHomePageChange}
          />
          <SloganSectionEditor
            homeSlogan={copy.homePage.homeSlogan}
            onChange={handleHomePageChange}
          />
          <AboutSectionEditor
            aboutTitle={copy.homePage.aboutTitle}
            aboutDescription={copy.homePage.aboutDescription}
            aboutExtraParagraph={copy.homePage.aboutExtraParagraph}
            onChange={handleAboutChange}
          />
        </TabsContent>
        
        {/* Navigation Content */}
        <TabsContent value="navigation" className="space-y-4">
          <NavigationEditor
            navigation={copy.navigation}
            onChange={handleNavigationChange}
          />
        </TabsContent>
        
        {/* Product Categories Content */}
        <TabsContent value="categories" className="space-y-4">
          <ProductCategoriesEditor
            productCategories={copy.productCategories}
            onChange={handleProductCategoriesChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminWebsiteCopy;
