
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
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="website-copy">Website Copy</TabsTrigger>
          <TabsTrigger value="about-us">About Us</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="categories">Product Categories</TabsTrigger>
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
            onChange={handleAboutChange}
          />
        </TabsContent>
        
        {/* About Us Section (Content Management - About) */}
        <TabsContent value="about-us" className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                About Us Hero Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Title (Indonesian)</Label>
                  <Input
                    value={aboutContent.heroTitle.id}
                    onChange={(e) => handleAboutContentChange('heroTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Title (English)</Label>
                  <Input
                    value={aboutContent.heroTitle.en}
                    onChange={(e) => handleAboutContentChange('heroTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Subtitle (Indonesian)</Label>
                  <Textarea
                    rows={3}
                    value={aboutContent.heroSubtitle.id}
                    onChange={(e) => handleAboutContentChange('heroSubtitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Subtitle (English)</Label>
                  <Textarea
                    rows={3}
                    value={aboutContent.heroSubtitle.en}
                    onChange={(e) => handleAboutContentChange('heroSubtitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              <ImageUpload
                value={aboutContent.heroImage}
                onChange={(url) => handleAboutImageChange('heroImage', url)}
                label="Hero Image"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Mission Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mission Title (Indonesian)</Label>
                  <Input
                    value={aboutContent.missionTitle.id}
                    onChange={(e) => handleAboutContentChange('missionTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mission Title (English)</Label>
                  <Input
                    value={aboutContent.missionTitle.en}
                    onChange={(e) => handleAboutContentChange('missionTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mission Description (Indonesian)</Label>
                  <Textarea
                    rows={4}
                    value={aboutContent.missionDescription.id}
                    onChange={(e) => handleAboutContentChange('missionDescription', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mission Description (English)</Label>
                  <Textarea
                    rows={4}
                    value={aboutContent.missionDescription.en}
                    onChange={(e) => handleAboutContentChange('missionDescription', 'en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vision Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vision Title (Indonesian)</Label>
                  <Input
                    value={aboutContent.visionTitle.id}
                    onChange={(e) => handleAboutContentChange('visionTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vision Title (English)</Label>
                  <Input
                    value={aboutContent.visionTitle.en}
                    onChange={(e) => handleAboutContentChange('visionTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vision Description (Indonesian)</Label>
                  <Textarea
                    rows={4}
                    value={aboutContent.visionDescription.id}
                    onChange={(e) => handleAboutContentChange('visionDescription', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vision Description (English)</Label>
                  <Textarea
                    rows={4}
                    value={aboutContent.visionDescription.en}
                    onChange={(e) => handleAboutContentChange('visionDescription', 'en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Values Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Values Title (Indonesian)</Label>
                  <Input
                    value={aboutContent.valuesTitle.id}
                    onChange={(e) => handleAboutContentChange('valuesTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Values Title (English)</Label>
                  <Input
                    value={aboutContent.valuesTitle.en}
                    onChange={(e) => handleAboutContentChange('valuesTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Values Description (Indonesian)</Label>
                  <Textarea
                    rows={4}
                    value={aboutContent.valuesDescription.id}
                    onChange={(e) => handleAboutContentChange('valuesDescription', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Values Description (English)</Label>
                  <Textarea
                    rows={4}
                    value={aboutContent.valuesDescription.en}
                    onChange={(e) => handleAboutContentChange('valuesDescription', 'en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Team Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Team Management
                <Button onClick={() => setShowAddTeamForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showAddTeamForm && (
                <div className="border rounded-lg p-4 mb-4 bg-blue-50">
                  <h4 className="font-medium mb-3">Add New Team Member</h4>
                  <TeamMemberForm
                    onSave={(member) => {
                      addTeamMember(member);
                      setShowAddTeamForm(false);
                    }}
                    onCancel={() => setShowAddTeamForm(false)}
                  />
                </div>
              )}
              <div className="grid gap-4">
                {aboutContent.teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <img src={member.image} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
                    <div className="flex-1">
                      <h4 className="font-medium">{member.name}</h4>
                      <p className="text-sm text-gray-500">{member.title}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTeamMember(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTeamMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {editingTeamMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h4 className="font-medium mb-3">Edit Team Member</h4>
                    <TeamMemberForm
                      initialData={editingTeamMember}
                      onSave={(member) => {
                        updateTeamMember(editingTeamMember.id, member);
                        setEditingTeamMember(null);
                      }}
                      onCancel={() => setEditingTeamMember(null)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Section (Content Management - Gallery) */}
        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Gallery Hero Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Title (Indonesian)</Label>
                  <Input
                    value={galleryContent.heroTitle.id}
                    onChange={(e) => handleGalleryContentChange('heroTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Title (English)</Label>
                  <Input
                    value={galleryContent.heroTitle.en}
                    onChange={(e) => handleGalleryContentChange('heroTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Subtitle (Indonesian)</Label>
                  <Textarea
                    rows={3}
                    value={galleryContent.heroSubtitle.id}
                    onChange={(e) => handleGalleryContentChange('heroSubtitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Subtitle (English)</Label>
                  <Textarea
                    rows={3}
                    value={galleryContent.heroSubtitle.en}
                    onChange={(e) => handleGalleryContentChange('heroSubtitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              <ImageUpload
                value={galleryContent.heroImage}
                onChange={(url) => handleGalleryImageChange('heroImage', url)}
                label="Hero Image"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Gallery Items
                <Button onClick={() => setShowAddGalleryForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gallery Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showAddGalleryForm && (
                <div className="border rounded-lg p-4 mb-4 bg-blue-50">
                  <h4 className="font-medium mb-3">Add New Gallery Item</h4>
                  <GalleryItemForm
                    onSave={(item) => {
                      addGalleryItem(item);
                      setShowAddGalleryForm(false);
                    }}
                    onCancel={() => setShowAddGalleryForm(false)}
                  />
                </div>
              )}
              <div className="grid gap-4">
                {galleryContent.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      {item.type === 'image' ? <Image className="h-6 w-6" /> : <span>🎥</span>}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.type} - {item.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingGalleryItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteGalleryItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {editingGalleryItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h4 className="font-medium mb-3">Edit Gallery Item</h4>
                    <GalleryItemForm
                      initialData={editingGalleryItem}
                      onSave={(item) => {
                        updateGalleryItem(editingGalleryItem.id, item);
                        setEditingGalleryItem(null);
                      }}
                      onCancel={() => setEditingGalleryItem(null)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
      </Tabs>
    </div>
  );
};

// --- Forms reused from Content Management ---
const TeamMemberForm = ({ initialData, onSave, onCancel }: {
  initialData?: TeamMember;
  onSave: (member: Omit<TeamMember, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [member, setMember] = useState({
    name: initialData?.name || '',
    title: initialData?.title || '',
    image: initialData?.image || '',
    linkedin: initialData?.linkedin || ''
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          value={member.name}
          onChange={(e) => setMember({...member, name: e.target.value})}
        />
      </div>
      <div>
        <Label>Title</Label>
        <Input
          value={member.title}
          onChange={(e) => setMember({...member, title: e.target.value})}
        />
      </div>
      <div>
        <Label>LinkedIn URL</Label>
        <Input
          value={member.linkedin}
          onChange={(e) => setMember({...member, linkedin: e.target.value})}
        />
      </div>
      <ImageUpload
        value={member.image}
        onChange={(url) => setMember({...member, image: url})}
        label="Profile Image"
      />
      <div className="flex gap-2">
        <Button onClick={() => onSave(member)}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
};

const GalleryItemForm = ({ initialData, onSave, onCancel }: {
  initialData?: GalleryItem;
  onSave: (item: Omit<GalleryItem, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [item, setItem] = useState({
    type: initialData?.type || 'image' as 'image' | 'video',
    url: initialData?.url || '',
    title: initialData?.title || '',
    description: initialData?.description || ''
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Type</Label>
        <Select value={item.type} onValueChange={(value: 'image' | 'video') => setItem({...item, type: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Title</Label>
        <Input
          value={item.title}
          onChange={(e) => setItem({...item, title: e.target.value})}
        />
      </div>
      <div>
        <Label>Description</Label>
        <Input
          value={item.description}
          onChange={(e) => setItem({...item, description: e.target.value})}
        />
      </div>
      <div>
        {item.type === 'video' ? (
          <VideoUrlInput
            value={item.url}
            onChange={(url) => setItem({...item, url})}
            label="YouTube Video URL"
          />
        ) : (
          <ImageUpload
            value={item.url}
            onChange={(url) => setItem({...item, url})}
            label="Gallery Image"
          />
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(item)}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
};

export default AdminWebsiteCopy;
