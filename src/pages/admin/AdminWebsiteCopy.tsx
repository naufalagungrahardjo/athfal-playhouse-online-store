import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Globe, FileText, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_COPY } from "@/hooks/useWebsiteCopy";

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

// Use DEFAULT_COPY from shared hook

const AdminWebsiteCopy = () => {
  // Website Copy
  const { toast } = useToast();
  const [copy, setCopy] = useState(DEFAULT_COPY);
  const [activeTab, setActiveTab] = useState("website-copy");
  const [copyLoading, setCopyLoading] = useState(true);

  // Load website copy from Supabase on mount
  useEffect(() => {
    const loadCopy = async () => {
      const { data } = await supabase
        .from('website_copy')
        .select('content')
        .eq('id', 'main')
        .maybeSingle();
      if (data?.content && typeof data.content === 'object' && Object.keys(data.content as object).length > 0) {
        const stored = data.content as any;
        setCopy({
          homePage: { ...DEFAULT_COPY.homePage, ...stored.homePage },
          navigation: { ...DEFAULT_COPY.navigation, ...stored.navigation },
          productCategories: { ...DEFAULT_COPY.productCategories, ...stored.productCategories },
          paymentConfirmation: { ...DEFAULT_COPY.paymentConfirmation, ...stored.paymentConfirmation },
        });
      }
      setCopyLoading(false);
    };
    loadCopy();
  }, []);

  // About & Gallery Content (Content Management)
  const { content: aboutContent, loading: aboutLoading, saveContent: saveAboutContent, addTeamMember, updateTeamMember, deleteTeamMember } = useAboutContent();
  const { content: galleryContent, saveContent: saveGalleryContent, addGalleryItem, updateGalleryItem, deleteGalleryItem } = useGalleryContent();
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [showAddGalleryForm, setShowAddGalleryForm] = useState(false);
  
  // Track unsaved changes for About Us
  const [aboutContentDraft, setAboutContentDraft] = useState(aboutContent);
  const [hasAboutChanges, setHasAboutChanges] = useState(false);
  
  // Update draft when aboutContent loads from DB
  useEffect(() => {
    if (!aboutLoading) {
      setAboutContentDraft(aboutContent);
      setHasAboutChanges(false);
    }
  }, [aboutContent, aboutLoading]);

  // Handlers for Website Copy editors
  const handleSave = async () => {
    try {
      // Save website copy to Supabase
      const { error } = await supabase
        .from('website_copy')
        .update({ content: copy as any, updated_at: new Date().toISOString() })
        .eq('id', 'main');

      if (error) throw error;

      // Notify in-app components to refresh
      window.dispatchEvent(new Event("websiteCopyUpdated"));
      
      // Save About Us changes to Supabase if there are any
      if (hasAboutChanges) {
        await saveAboutContent(aboutContentDraft);
        setHasAboutChanges(false);
      }
      
      toast({
        title: "Website copy updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving changes",
        description: "Some changes could not be saved. Please try again.",
        variant: "destructive",
      });
    }
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
    const currentSection = aboutContentDraft[section];
    if (typeof currentSection === 'object' && currentSection !== null && 'id' in currentSection && 'en' in currentSection) {
      const updatedContent = {
        ...aboutContentDraft,
        [section]: {
          ...currentSection,
          [language]: value
        }
      };
      setAboutContentDraft(updatedContent);
      setHasAboutChanges(true);
    }
  };
  const handleAboutImageChange = (field: string, value: string) => {
    const updatedContent = {
      ...aboutContentDraft,
      [field]: value
    };
    setAboutContentDraft(updatedContent);
    setHasAboutChanges(true);
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
          <AboutUsAdminTab 
            content={aboutContentDraft}
            onContentChange={handleAboutContentChange}
            onImageChange={handleAboutImageChange}
            onAddTeamMember={addTeamMember}
            onUpdateTeamMember={updateTeamMember}
            onDeleteTeamMember={deleteTeamMember}
          />
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
