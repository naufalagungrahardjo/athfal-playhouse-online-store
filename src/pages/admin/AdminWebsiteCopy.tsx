import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Globe, FileText, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Website copy sections
import HeroSectionEditor from "./website-copy/HeroSectionEditor";
import CTASectionEditor from "./website-copy/CTASectionEditor";
import SloganSectionEditor from "./website-copy/SloganSectionEditor";
import AboutSectionEditor from "./website-copy/AboutSectionEditor";
import NavigationEditor from "./website-copy/NavigationEditor";
import ProductCategoriesEditor from "./website-copy/ProductCategoriesEditor";

// Content Management (import About & Gallery content hooks+forms)
import { useAboutContent, TeamMember } from "@/hooks/useAboutContent";
import { useGalleryContent, GalleryItem } from "@/hooks/useGalleryContent";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { VideoUrlInput } from "@/components/admin/VideoUrlInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TeamMemberForm from "./team/TeamMemberForm";
import GalleryItemForm from "./gallery/GalleryItemForm";

import AboutUsAdminTab from "./website-copy/AboutUsAdminTab";
import GalleryAdminTab from "./website-copy/GalleryAdminTab";

// Add new import:
import CollaboratorsEditor from "./website-copy/CollaboratorsEditor";

// Initial Website Copy State
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
    aboutDecorativeImage: "",
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
  // Website Copy
  const { toast } = useToast();
  const [copy, setCopy] = useState(WEBSITE_COPY);
  const [activeTab, setActiveTab] = useState("website-copy");

  // About & Gallery Content (Content Management)
  const { content: aboutContent, saveContent: saveAboutContent, addTeamMember, updateTeamMember, deleteTeamMember } = useAboutContent();
  const { content: galleryContent, saveContent: saveGalleryContent, addGalleryItem, updateGalleryItem, deleteGalleryItem } = useGalleryContent();
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [showAddGalleryForm, setShowAddGalleryForm] = useState(false);

  // Handlers for Website Copy editors
  const handleSave = () => {
    // Save to localStorage so useWebsiteCopy hook can read it
    localStorage.setItem("websiteCopy", JSON.stringify(copy));
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

  // Handle aboutDecorativeImage as a special case (not translatable)
  const handleAboutDecorativeImageChange = (url: string) => {
    setCopy(prev => ({
      ...prev,
      homePage: {
        ...prev.homePage,
        aboutDecorativeImage: url
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

  // Handlers for Content Management (About, Gallery)
  const handleAboutContentChange = (section: keyof typeof aboutContent, language: 'id' | 'en', value: string) => {
    const currentSection = aboutContent[section];
    if (typeof currentSection === 'object' && currentSection !== null && 'id' in currentSection && 'en' in currentSection) {
      const updatedContent = {
        ...aboutContent,
        [section]: {
          ...currentSection,
          [language]: value
        }
      };
      saveAboutContent(updatedContent);
    }
  };
  const handleAboutImageChange = (field: string, value: string) => {
    const updatedContent = {
      ...aboutContent,
      [field]: value
    };
    saveAboutContent(updatedContent);
  };
  const handleGalleryContentChange = (field: keyof typeof galleryContent, language: 'id' | 'en', value: string) => {
    const currentField = galleryContent[field];
    if (typeof currentField === 'object' && currentField !== null && 'id' in currentField && 'en' in currentField) {
      const updatedContent = {
        ...galleryContent,
        [field]: {
          ...currentField,
          [language]: value
        }
      };
      saveGalleryContent(updatedContent);
    }
  };
  const handleGalleryImageChange = (field: string, value: string) => {
    const updatedContent = {
      ...galleryContent,
      [field]: value
    };
    saveGalleryContent(updatedContent);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-8 w-8 text-athfal-pink" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Website Content</h2>
            <p className="text-gray-600">Manage all text and CMS content in one place</p>
          </div>
        </div>
        <Button onClick={handleSave} className="bg-athfal-pink hover:bg-athfal-pink/90">
          <Save className="mr-2 h-4 w-4" /> Save All Changes
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6 h-auto">
          <TabsTrigger value="website-copy" className="whitespace-nowrap">Website Copy</TabsTrigger>
          <TabsTrigger value="about-us" className="whitespace-nowrap">About Us</TabsTrigger>
          <TabsTrigger value="gallery" className="whitespace-nowrap">Gallery</TabsTrigger>
          <TabsTrigger value="navigation" className="whitespace-nowrap">Navigation</TabsTrigger>
          <TabsTrigger value="categories" className="whitespace-nowrap">Product Categories</TabsTrigger>
          <TabsTrigger value="collaborators" className="whitespace-nowrap">Partners</TabsTrigger>
        </TabsList>

        {/* Website Copy Section (Home page copy, Call to action, Slogan, About block) */}
        <TabsContent value="website-copy" className="space-y-6">
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
            aboutDecorativeImage={copy.homePage.aboutDecorativeImage}
            onChange={handleHomePageChange}
            onDecorativeImageChange={handleAboutDecorativeImageChange}
          />
        </TabsContent>
        
        {/* About Us Section (Content Management - About) */}
        <TabsContent value="about-us" className="space-y-6">
          <AboutUsAdminTab />
        </TabsContent>
        
        {/* Gallery Section (Content Management - Gallery) */}
        <TabsContent value="gallery" className="space-y-6">
          <GalleryAdminTab />
        </TabsContent>
        
        {/* Navigation (Website Copy Section) */}
        <TabsContent value="navigation" className="space-y-4">
          <NavigationEditor
            navigation={copy.navigation}
            onChange={handleNavigationChange}
          />
        </TabsContent>
        
        {/* Product Categories (Website Copy Section) */}
        <TabsContent value="categories" className="space-y-4">
          <ProductCategoriesEditor
            productCategories={copy.productCategories}
            onChange={handleProductCategoriesChange}
          />
        </TabsContent>
        
        {/* Partners/Collaborators Editor */}
        <TabsContent value="collaborators" className="space-y-6">
          <CollaboratorsEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminWebsiteCopy;
