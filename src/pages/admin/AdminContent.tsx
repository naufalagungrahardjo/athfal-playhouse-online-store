import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

// Mock content data
const MOCK_CONTENT = {
  homeBanner: {
    title: {
      id: "Belajar Sambil Bermain dengan Athfal Playhouse",
      en: "Learn Through Play with Athfal Playhouse",
    },
    subtitle: {
      id: "Mengembangkan potensi anak melalui pendekatan Islami yang menyenangkan",
      en: "Developing your child's potential through a fun Islamic approach",
    },
    buttonText: {
      id: "Jelajahi Kelas Kami",
      en: "Explore Our Classes",
    },
    buttonLink: "/products/pop-up-class"
  },
  about: {
    title: {
      id: "Tentang Athfal Playhouse",
      en: "About Athfal Playhouse",
    },
    content: {
      id: "Athfal Playhouse adalah pusat edukasi anak yang menggabungkan metode bermain sambil belajar dengan nilai-nilai Islam. Kami menawarkan kelas pop-up, program reguler, dan konsultasi psikologi untuk anak-anak usia 2-7 tahun.",
      en: "Athfal Playhouse is a children's education center that combines play-based learning methods with Islamic values. We offer pop-up classes, regular programs, and psychological consultations for children aged 2-7 years.",
    },
  },
  mission: {
    title: {
      id: "Misi Kami",
      en: "Our Mission",
    },
    content: {
      id: "Menyediakan lingkungan belajar yang menyenangkan dan inklusif di mana anak-anak dapat mengembangkan potensi penuh mereka melalui bermain, eksplorasi, dan penemuan yang dibimbing.",
      en: "To provide a fun and inclusive learning environment where children can develop their full potential through play, exploration, and guided discovery.",
    },
  },
  vision: {
    title: {
      id: "Visi Kami",
      en: "Our Vision",
    },
    content: {
      id: "Menjadi pusat edukasi anak terkemuka yang menginspirasi kreativitas, kecintaan pada Islam, dan pembelajaran seumur hidup.",
      en: "To be a leading children's education center that inspires creativity, love for Islam, and lifelong learning.",
    },
  },
  categories: {
    popUpClass: {
      title: {
        id: "Pop Up Class",
        en: "Pop Up Class",
      },
      description: {
        id: "Kelas one-time untuk anak-anak dengan tema yang menarik dan aktivitas yang menyenangkan.",
        en: "One-time classes for children with exciting themes and fun activities.",
      },
    },
    bumiClass: {
      title: {
        id: "Bumi Class",
        en: "Bumi Class",
      },
      description: {
        id: "Program reguler yang berfokus pada pembelajaran tentang alam dan lingkungan.",
        en: "Regular program focused on learning about nature and the environment.",
      },
    },
    tahsinClass: {
      title: {
        id: "Tahsin Class",
        en: "Tahsin Class",
      },
      description: {
        id: "Program pembelajaran Al-Quran dengan metode yang menyenangkan.",
        en: "Quran learning program with fun methods.",
      },
    },
    playKit: {
      title: {
        id: "Play Kit",
        en: "Play Kit",
      },
      description: {
        id: "Kit bermain edukatif untuk aktivitas di rumah.",
        en: "Educational play kits for at-home activities.",
      },
    },
    consultation: {
      title: {
        id: "Konsultasi Psikologi",
        en: "Psychological Consultation",
      },
      description: {
        id: "Layanan konsultasi psikologi anak dengan psikolog profesional.",
        en: "Child psychology consultation services with professional psychologists.",
      },
    },
    merchandise: {
      title: {
        id: "Merchandise & Lainnya",
        en: "Merchandise & Others",
      },
      description: {
        id: "Berbagai merchandise dan produk lainnya dari Athfal Playhouse.",
        en: "Various merchandise and other products from Athfal Playhouse.",
      },
    },
  },
};

const AdminContent = () => {
  const { toast } = useToast();
  const [content, setContent] = useState(MOCK_CONTENT);

  const handleChange = (section: string, field: string, language: string, value: string) => {
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

  const handleCategoryChange = (category: string, field: string, language: string, value: string) => {
    setContent(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category as keyof typeof prev.categories],
          [field]: {
            ...(prev.categories[category as keyof typeof prev.categories][field as keyof typeof prev.categories[keyof typeof prev.categories]] as any),
            [language]: value
          }
        }
      }
    }));
  };

  const handleHomeBannerChange = (field: string, language: string, value: string) => {
    if (field === 'buttonLink') {
      setContent(prev => ({
        ...prev,
        homeBanner: {
          ...prev.homeBanner,
          buttonLink: value
        }
      }));
    } else {
      setContent(prev => ({
        ...prev,
        homeBanner: {
          ...prev.homeBanner,
          [field]: {
            ...(prev.homeBanner[field as keyof typeof prev.homeBanner] as any),
            [language]: value
          }
        }
      }));
    }
  };

  const handleSave = () => {
    // In a real app, this would save to a database/API
    toast({
      title: "Content updated",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Website Content</h2>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" /> Save All Changes
        </Button>
      </div>
      
      <Tabs defaultValue="home" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="home">Home Page</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="categories">Product Categories</TabsTrigger>
          <TabsTrigger value="misc">Miscellaneous</TabsTrigger>
        </TabsList>
        
        {/* Home Page Content */}
        <TabsContent value="home" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Home Banner</CardTitle>
              <CardDescription>
                Edit the content displayed on the home page banner.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banner-title-id">Title (Indonesian)</Label>
                  <Input
                    id="banner-title-id"
                    value={content.homeBanner.title.id}
                    onChange={(e) => handleHomeBannerChange('title', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-title-en">Title (English)</Label>
                  <Input
                    id="banner-title-en"
                    value={content.homeBanner.title.en}
                    onChange={(e) => handleHomeBannerChange('title', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banner-subtitle-id">Subtitle (Indonesian)</Label>
                  <Input
                    id="banner-subtitle-id"
                    value={content.homeBanner.subtitle.id}
                    onChange={(e) => handleHomeBannerChange('subtitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-subtitle-en">Subtitle (English)</Label>
                  <Input
                    id="banner-subtitle-en"
                    value={content.homeBanner.subtitle.en}
                    onChange={(e) => handleHomeBannerChange('subtitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banner-button-id">Button Text (Indonesian)</Label>
                  <Input
                    id="banner-button-id"
                    value={content.homeBanner.buttonText.id}
                    onChange={(e) => handleHomeBannerChange('buttonText', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-button-en">Button Text (English)</Label>
                  <Input
                    id="banner-button-en"
                    value={content.homeBanner.buttonText.en}
                    onChange={(e) => handleHomeBannerChange('buttonText', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="banner-link">Button Link</Label>
                <Input
                  id="banner-link"
                  value={content.homeBanner.buttonLink}
                  onChange={(e) => handleHomeBannerChange('buttonLink', '', e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>Save Banner Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* About Content */}
        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About Athfal Playhouse</CardTitle>
              <CardDescription>
                Edit the content displayed on the about page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="about-title-id">Title (Indonesian)</Label>
                  <Input
                    id="about-title-id"
                    value={content.about.title.id}
                    onChange={(e) => handleChange('about', 'title', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about-title-en">Title (English)</Label>
                  <Input
                    id="about-title-en"
                    value={content.about.title.en}
                    onChange={(e) => handleChange('about', 'title', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="about-content-id">Content (Indonesian)</Label>
                  <Textarea
                    id="about-content-id"
                    rows={4}
                    value={content.about.content.id}
                    onChange={(e) => handleChange('about', 'content', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about-content-en">Content (English)</Label>
                  <Textarea
                    id="about-content-en"
                    rows={4}
                    value={content.about.content.en}
                    onChange={(e) => handleChange('about', 'content', 'en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>Save About Changes</Button>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vision */}
            <Card>
              <CardHeader>
                <CardTitle>Vision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vision-title-id">Title (Indonesian)</Label>
                  <Input
                    id="vision-title-id"
                    value={content.vision.title.id}
                    onChange={(e) => handleChange('vision', 'title', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vision-title-en">Title (English)</Label>
                  <Input
                    id="vision-title-en"
                    value={content.vision.title.en}
                    onChange={(e) => handleChange('vision', 'title', 'en', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vision-content-id">Content (Indonesian)</Label>
                  <Textarea
                    id="vision-content-id"
                    rows={4}
                    value={content.vision.content.id}
                    onChange={(e) => handleChange('vision', 'content', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vision-content-en">Content (English)</Label>
                  <Textarea
                    id="vision-content-en"
                    rows={4}
                    value={content.vision.content.en}
                    onChange={(e) => handleChange('vision', 'content', 'en', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Mission */}
            <Card>
              <CardHeader>
                <CardTitle>Mission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mission-title-id">Title (Indonesian)</Label>
                  <Input
                    id="mission-title-id"
                    value={content.mission.title.id}
                    onChange={(e) => handleChange('mission', 'title', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mission-title-en">Title (English)</Label>
                  <Input
                    id="mission-title-en"
                    value={content.mission.title.en}
                    onChange={(e) => handleChange('mission', 'title', 'en', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mission-content-id">Content (Indonesian)</Label>
                  <Textarea
                    id="mission-content-id"
                    rows={4}
                    value={content.mission.content.id}
                    onChange={(e) => handleChange('mission', 'content', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mission-content-en">Content (English)</Label>
                  <Textarea
                    id="mission-content-en"
                    rows={4}
                    value={content.mission.content.en}
                    onChange={(e) => handleChange('mission', 'content', 'en', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Product Categories Content */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>
                Edit the descriptions for each product category page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pop Up Class */}
              <div>
                <h3 className="text-lg font-medium mb-4">Pop Up Class</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pop-title-id">Title (Indonesian)</Label>
                    <Input
                      id="pop-title-id"
                      value={content.categories.popUpClass.title.id}
                      onChange={(e) => handleCategoryChange('popUpClass', 'title', 'id', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pop-title-en">Title (English)</Label>
                    <Input
                      id="pop-title-en"
                      value={content.categories.popUpClass.title.en}
                      onChange={(e) => handleCategoryChange('popUpClass', 'title', 'en', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pop-desc-id">Description (Indonesian)</Label>
                    <Textarea
                      id="pop-desc-id"
                      value={content.categories.popUpClass.description.id}
                      onChange={(e) => handleCategoryChange('popUpClass', 'description', 'id', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pop-desc-en">Description (English)</Label>
                    <Textarea
                      id="pop-desc-en"
                      value={content.categories.popUpClass.description.en}
                      onChange={(e) => handleCategoryChange('popUpClass', 'description', 'en', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Bumi Class */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Bumi Class</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bumi-title-id">Title (Indonesian)</Label>
                    <Input
                      id="bumi-title-id"
                      value={content.categories.bumiClass.title.id}
                      onChange={(e) => handleCategoryChange('bumiClass', 'title', 'id', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bumi-title-en">Title (English)</Label>
                    <Input
                      id="bumi-title-en"
                      value={content.categories.bumiClass.title.en}
                      onChange={(e) => handleCategoryChange('bumiClass', 'title', 'en', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bumi-desc-id">Description (Indonesian)</Label>
                    <Textarea
                      id="bumi-desc-id"
                      value={content.categories.bumiClass.description.id}
                      onChange={(e) => handleCategoryChange('bumiClass', 'description', 'id', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bumi-desc-en">Description (English)</Label>
                    <Textarea
                      id="bumi-desc-en"
                      value={content.categories.bumiClass.description.en}
                      onChange={(e) => handleCategoryChange('bumiClass', 'description', 'en', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Other categories would follow the same pattern */}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>Save Category Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Miscellaneous Content */}
        <TabsContent value="misc">
          <Card>
            <CardHeader>
              <CardTitle>Miscellaneous Content</CardTitle>
              <CardDescription>
                Edit other miscellaneous content elements across the website.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This section will include other content that doesn't fit in the categories above,
                such as footer text, policy pages, etc.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminContent;
