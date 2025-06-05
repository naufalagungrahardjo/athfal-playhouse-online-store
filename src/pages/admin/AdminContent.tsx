
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save, FileText, Image, Info } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

// Content data structure for About Us and Gallery
const CONTENT_DATA = {
  aboutUs: {
    heroTitle: {
      id: "Tentang Athfal Playhouse",
      en: "About Athfal Playhouse",
    },
    heroSubtitle: {
      id: "Mengenal lebih dekat visi, misi, dan nilai-nilai kami",
      en: "Get to know our vision, mission, and values",
    },
    missionTitle: {
      id: "Misi Kami",
      en: "Our Mission",
    },
    missionDescription: {
      id: "Menyediakan lingkungan belajar yang aman, menyenangkan, dan inspiratif untuk anak-anak Muslim dengan menggabungkan metode bermain sambil belajar dengan nilai-nilai Islam.",
      en: "Providing a safe, fun, and inspiring learning environment for Muslim children by combining play-based learning methods with Islamic values.",
    },
    visionTitle: {
      id: "Visi Kami",
      en: "Our Vision",
    },
    visionDescription: {
      id: "Menjadi pusat edukasi anak terdepan yang mengembangkan generasi Muslim yang cerdas, kreatif, dan berakhlak mulia.",
      en: "To become a leading children's education center that develops intelligent, creative, and noble Muslim generations.",
    },
    valuesTitle: {
      id: "Nilai-Nilai Kami",
      en: "Our Values",
    },
    valuesDescription: {
      id: "Pendidikan Islami, Kreativitas, Keamanan, dan Kesenangan dalam belajar.",
      en: "Islamic Education, Creativity, Safety, and Fun in learning.",
    },
    teamTitle: {
      id: "Tim Kami",
      en: "Our Team",
    },
    teamDescription: {
      id: "Tim profesional yang berpengalaman dan berdedikasi dalam pendidikan anak.",
      en: "Professional team experienced and dedicated in children's education.",
    },
    heroImage: "https://images.unsplash.com/photo-1635107510862-53886e926b74?w=800&h=600&fit=crop&auto=format",
  },
  gallery: {
    heroTitle: {
      id: "Galeri Athfal Playhouse",
      en: "Athfal Playhouse Gallery",
    },
    heroSubtitle: {
      id: "Lihat momen-momen berharga dan kegiatan seru di Athfal Playhouse",
      en: "See precious moments and fun activities at Athfal Playhouse",
    },
    activitiesTitle: {
      id: "Kegiatan Kami",
      en: "Our Activities",
    },
    activitiesDescription: {
      id: "Berbagai kegiatan edukatif dan menyenangkan yang dilakukan anak-anak di Athfal Playhouse.",
      en: "Various educational and fun activities carried out by children at Athfal Playhouse.",
    },
    facilitiesTitle: {
      id: "Fasilitas",
      en: "Facilities",
    },
    facilitiesDescription: {
      id: "Ruang bermain yang aman dan nyaman dengan fasilitas lengkap untuk mendukung proses belajar.",
      en: "Safe and comfortable play areas with complete facilities to support the learning process.",
    },
    eventsTitle: {
      id: "Acara Spesial",
      en: "Special Events",
    },
    eventsDescription: {
      id: "Dokumentasi acara-acara spesial dan perayaan yang diadakan di Athfal Playhouse.",
      en: "Documentation of special events and celebrations held at Athfal Playhouse.",
    },
    heroImage: "https://images.unsplash.com/photo-1544925808-1b704a4ab262?w=800&h=600&fit=crop&auto=format",
  }
};

const AdminContent = () => {
  const { toast } = useToast();
  const [content, setContent] = useState(CONTENT_DATA);
  const [activeTab, setActiveTab] = useState("about");

  const handleSave = () => {
    // In a real implementation, this would save to database
    toast({
      title: "Content updated",
      description: "Your changes have been saved successfully.",
    });
  };

  const updateText = (section: string, field: string, language: string, value: string) => {
    setContent(prev => ({
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

  const updateImage = (section: string, imageField: string, value: string) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [imageField]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-athfal-pink" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
            <p className="text-gray-600">Manage About Us and Gallery page content</p>
          </div>
        </div>
        <Button onClick={handleSave} className="bg-athfal-pink hover:bg-athfal-pink/90">
          <Save className="mr-2 h-4 w-4" /> Save All Changes
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="about">About Us Page</TabsTrigger>
          <TabsTrigger value="gallery">Gallery Page</TabsTrigger>
        </TabsList>
        
        {/* About Us Content */}
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Hero Section
              </CardTitle>
              <CardDescription>
                Main banner content for the About Us page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Title (Indonesian)</Label>
                  <Input
                    value={content.aboutUs.heroTitle.id}
                    onChange={(e) => updateText('aboutUs', 'heroTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Title (English)</Label>
                  <Input
                    value={content.aboutUs.heroTitle.en}
                    onChange={(e) => updateText('aboutUs', 'heroTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Subtitle (Indonesian)</Label>
                  <Textarea
                    rows={3}
                    value={content.aboutUs.heroSubtitle.id}
                    onChange={(e) => updateText('aboutUs', 'heroSubtitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Subtitle (English)</Label>
                  <Textarea
                    rows={3}
                    value={content.aboutUs.heroSubtitle.en}
                    onChange={(e) => updateText('aboutUs', 'heroSubtitle', 'en', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hero Image</Label>
                <ImageUpload
                  value={content.aboutUs.heroImage}
                  onChange={(url) => updateImage('aboutUs', 'heroImage', url)}
                />
              </div>
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
                    value={content.aboutUs.missionTitle.id}
                    onChange={(e) => updateText('aboutUs', 'missionTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mission Title (English)</Label>
                  <Input
                    value={content.aboutUs.missionTitle.en}
                    onChange={(e) => updateText('aboutUs', 'missionTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mission Description (Indonesian)</Label>
                  <Textarea
                    rows={4}
                    value={content.aboutUs.missionDescription.id}
                    onChange={(e) => updateText('aboutUs', 'missionDescription', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mission Description (English)</Label>
                  <Textarea
                    rows={4}
                    value={content.aboutUs.missionDescription.en}
                    onChange={(e) => updateText('aboutUs', 'missionDescription', 'en', e.target.value)}
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
                    value={content.aboutUs.visionTitle.id}
                    onChange={(e) => updateText('aboutUs', 'visionTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vision Title (English)</Label>
                  <Input
                    value={content.aboutUs.visionTitle.en}
                    onChange={(e) => updateText('aboutUs', 'visionTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vision Description (Indonesian)</Label>
                  <Textarea
                    rows={4}
                    value={content.aboutUs.visionDescription.id}
                    onChange={(e) => updateText('aboutUs', 'visionDescription', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vision Description (English)</Label>
                  <Textarea
                    rows={4}
                    value={content.aboutUs.visionDescription.en}
                    onChange={(e) => updateText('aboutUs', 'visionDescription', 'en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Gallery Content */}
        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Gallery Hero Section
              </CardTitle>
              <CardDescription>
                Main banner content for the Gallery page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Title (Indonesian)</Label>
                  <Input
                    value={content.gallery.heroTitle.id}
                    onChange={(e) => updateText('gallery', 'heroTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Title (English)</Label>
                  <Input
                    value={content.gallery.heroTitle.en}
                    onChange={(e) => updateText('gallery', 'heroTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Subtitle (Indonesian)</Label>
                  <Textarea
                    rows={3}
                    value={content.gallery.heroSubtitle.id}
                    onChange={(e) => updateText('gallery', 'heroSubtitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Subtitle (English)</Label>
                  <Textarea
                    rows={3}
                    value={content.gallery.heroSubtitle.en}
                    onChange={(e) => updateText('gallery', 'heroSubtitle', 'en', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hero Image</Label>
                <ImageUpload
                  value={content.gallery.heroImage}
                  onChange={(url) => updateImage('gallery', 'heroImage', url)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activities Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Activities Title (Indonesian)</Label>
                  <Input
                    value={content.gallery.activitiesTitle.id}
                    onChange={(e) => updateText('gallery', 'activitiesTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Activities Title (English)</Label>
                  <Input
                    value={content.gallery.activitiesTitle.en}
                    onChange={(e) => updateText('gallery', 'activitiesTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Activities Description (Indonesian)</Label>
                  <Textarea
                    rows={3}
                    value={content.gallery.activitiesDescription.id}
                    onChange={(e) => updateText('gallery', 'activitiesDescription', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Activities Description (English)</Label>
                  <Textarea
                    rows={3}
                    value={content.gallery.activitiesDescription.en}
                    onChange={(e) => updateText('gallery', 'activitiesDescription', 'en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Facilities Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Facilities Title (Indonesian)</Label>
                  <Input
                    value={content.gallery.facilitiesTitle.id}
                    onChange={(e) => updateText('gallery', 'facilitiesTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Facilities Title (English)</Label>
                  <Input
                    value={content.gallery.facilitiesTitle.en}
                    onChange={(e) => updateText('gallery', 'facilitiesTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Facilities Description (Indonesian)</Label>
                  <Textarea
                    rows={3}
                    value={content.gallery.facilitiesDescription.id}
                    onChange={(e) => updateText('gallery', 'facilitiesDescription', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Facilities Description (English)</Label>
                  <Textarea
                    rows={3}
                    value={content.gallery.facilitiesDescription.en}
                    onChange={(e) => updateText('gallery', 'facilitiesDescription', 'en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminContent;
