
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { GripVertical, Image as ImageIcon, Plus, Save, Trash2 } from "lucide-react";

// Banner type
interface Banner {
  id: string;
  title: {
    id: string;
    en: string;
  };
  subtitle: {
    id: string;
    en: string;
  };
  buttonText: {
    id: string;
    en: string;
  };
  buttonLink: string;
  image: string;
  mobileImage: string;
  active: boolean;
  order: number;
}

// Mock banner data
const MOCK_BANNERS: Banner[] = [
  {
    id: "banner1",
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
    buttonLink: "/products/pop-up-class",
    image: "https://images.unsplash.com/photo-1647891938250-954addeb9c51",
    mobileImage: "https://images.unsplash.com/photo-1647891938250-954addeb9c51",
    active: true,
    order: 1,
  },
  {
    id: "banner2",
    title: {
      id: "Pop Up Class - Belajar Sains dengan Eksperimen Seru",
      en: "Pop Up Class - Learn Science with Fun Experiments",
    },
    subtitle: {
      id: "Daftarkan anak Anda sekarang untuk pengalaman belajar yang tak terlupakan",
      en: "Register your child now for an unforgettable learning experience",
    },
    buttonText: {
      id: "Daftar Sekarang",
      en: "Register Now",
    },
    buttonLink: "/products/pop-up-class",
    image: "https://images.unsplash.com/photo-1566140967404-b8b3932483f5",
    mobileImage: "https://images.unsplash.com/photo-1566140967404-b8b3932483f5",
    active: true,
    order: 2,
  },
];

const AdminBanners = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>(MOCK_BANNERS);
  
  const sortedBanners = [...banners].sort((a, b) => a.order - b.order);

  const handleAddBanner = () => {
    const newBanner: Banner = {
      id: `banner${banners.length + 1}`,
      title: {
        id: "",
        en: "",
      },
      subtitle: {
        id: "",
        en: "",
      },
      buttonText: {
        id: "",
        en: "",
      },
      buttonLink: "",
      image: "",
      mobileImage: "",
      active: false,
      order: banners.length + 1,
    };
    
    setBanners([...banners, newBanner]);
    
    toast({
      title: "Banner added",
      description: "A new banner has been added. Fill in the details and save your changes.",
    });
  };

  const handleUpdateBanner = (
    id: string, 
    field: string, 
    subField: string | null, 
    language: string | null, 
    value: string | boolean
  ) => {
    setBanners(prev => 
      prev.map(banner => {
        if (banner.id !== id) return banner;
        
        // For simple fields like buttonLink, active, image, etc.
        if (!subField && !language) {
          return { ...banner, [field]: value };
        }
        
        // For nested fields like title, subtitle, buttonText
        if (subField && language && typeof field === 'string') {
          const updatedBanner = { ...banner };
          const nestedField = updatedBanner[field as keyof Banner] as Record<string, Record<string, string>>;
          
          if (nestedField && typeof nestedField === 'object') {
            nestedField[subField] = {
              ...nestedField[subField],
              [language]: value as string
            };
          }
          
          return updatedBanner;
        }
        
        return banner;
      })
    );
  };

  const handleDeleteBanner = (id: string) => {
    setBanners(prev => prev.filter(banner => banner.id !== id));
    
    toast({
      title: "Banner deleted",
      description: "The banner has been removed.",
      variant: "destructive",
    });
  };

  const handleSaveBanners = () => {
    // In a real app, this would save to a database/API
    toast({
      title: "Banners saved",
      description: "Your changes have been saved successfully.",
    });
  };
  
  // Move banner up or down
  const moveBanner = (id: string, direction: "up" | "down") => {
    const currentIndex = sortedBanners.findIndex(banner => banner.id === id);
    if (
      (direction === "up" && currentIndex === 0) || 
      (direction === "down" && currentIndex === sortedBanners.length - 1)
    ) {
      return; // Can't move further
    }
    
    const newBanners = [...sortedBanners];
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    // Swap orders
    const temp = newBanners[targetIndex].order;
    newBanners[targetIndex].order = newBanners[currentIndex].order;
    newBanners[currentIndex].order = temp;
    
    setBanners(newBanners);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Homepage Banners</h2>
        <div className="flex gap-2">
          <Button onClick={handleAddBanner}>
            <Plus className="mr-2 h-4 w-4" /> Add Banner
          </Button>
          <Button onClick={handleSaveBanners} variant="secondary">
            <Save className="mr-2 h-4 w-4" /> Save All
          </Button>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        Drag to reorder banners. Active banners will be displayed in the homepage carousel in order.
      </div>
      
      {/* Banner list */}
      <div className="space-y-6">
        {sortedBanners.map((banner, index) => (
          <Card key={banner.id} className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move opacity-50 hover:opacity-100 flex flex-col gap-1">
              <GripVertical className="h-6 w-6" />
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveBanner(banner.id, "up")}
                  disabled={index === 0}
                  className="h-6 w-6 p-0"
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveBanner(banner.id, "down")}
                  disabled={index === sortedBanners.length - 1}
                  className="h-6 w-6 p-0"
                >
                  ↓
                </Button>
              </div>
            </div>
            <CardHeader className="px-12">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CardTitle>Banner #{banner.order}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`active-${banner.id}`}
                      checked={banner.active}
                      onCheckedChange={(value) => 
                        handleUpdateBanner(banner.id, "active", null, null, value)
                      }
                    />
                    <Label htmlFor={`active-${banner.id}`}>
                      {banner.active ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500"
                  onClick={() => handleDeleteBanner(banner.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-12 pb-6 space-y-6">
              {/* Banner title */}
              <div>
                <h3 className="text-md font-medium mb-2">Banner Title</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`title-id-${banner.id}`}>Indonesian</Label>
                    <Input
                      id={`title-id-${banner.id}`}
                      value={banner.title.id}
                      onChange={(e) => handleUpdateBanner(banner.id, "title", "id", "id", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`title-en-${banner.id}`}>English</Label>
                    <Input
                      id={`title-en-${banner.id}`}
                      value={banner.title.en}
                      onChange={(e) => handleUpdateBanner(banner.id, "title", "en", "en", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Banner subtitle */}
              <div>
                <h3 className="text-md font-medium mb-2">Banner Subtitle</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`subtitle-id-${banner.id}`}>Indonesian</Label>
                    <Textarea
                      id={`subtitle-id-${banner.id}`}
                      rows={2}
                      value={banner.subtitle.id}
                      onChange={(e) => handleUpdateBanner(banner.id, "subtitle", "id", "id", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`subtitle-en-${banner.id}`}>English</Label>
                    <Textarea
                      id={`subtitle-en-${banner.id}`}
                      rows={2}
                      value={banner.subtitle.en}
                      onChange={(e) => handleUpdateBanner(banner.id, "subtitle", "en", "en", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Banner button */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`button-id-${banner.id}`}>Button Text (ID)</Label>
                  <Input
                    id={`button-id-${banner.id}`}
                    value={banner.buttonText.id}
                    onChange={(e) => handleUpdateBanner(banner.id, "buttonText", "id", "id", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`button-en-${banner.id}`}>Button Text (EN)</Label>
                  <Input
                    id={`button-en-${banner.id}`}
                    value={banner.buttonText.en}
                    onChange={(e) => handleUpdateBanner(banner.id, "buttonText", "en", "en", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`button-link-${banner.id}`}>Button Link</Label>
                  <Input
                    id={`button-link-${banner.id}`}
                    value={banner.buttonLink}
                    onChange={(e) => handleUpdateBanner(banner.id, "buttonLink", null, null, e.target.value)}
                  />
                </div>
              </div>
              
              {/* Banner images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`image-${banner.id}`}>Desktop Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`image-${banner.id}`}
                      value={banner.image}
                      onChange={(e) => handleUpdateBanner(banner.id, "image", null, null, e.target.value)}
                    />
                    <Button variant="outline" size="icon">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {banner.image && (
                    <div className="border rounded-md p-1 mt-2">
                      <img
                        src={banner.image}
                        alt="Banner preview"
                        className="w-full h-auto max-h-24 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`mobile-image-${banner.id}`}>Mobile Image URL (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`mobile-image-${banner.id}`}
                      value={banner.mobileImage}
                      onChange={(e) => handleUpdateBanner(banner.id, "mobileImage", null, null, e.target.value)}
                    />
                    <Button variant="outline" size="icon">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {banner.mobileImage && (
                    <div className="border rounded-md p-1 mt-2">
                      <img
                        src={banner.mobileImage}
                        alt="Mobile banner preview"
                        className="w-full h-auto max-h-24 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-12 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => handleDeleteBanner(banner.id)}>
                Delete
              </Button>
              <Button onClick={handleSaveBanners}>Save Changes</Button>
            </CardFooter>
          </Card>
        ))}
        
        {banners.length === 0 && (
          <div className="text-center py-8 border rounded-lg border-dashed">
            <p className="text-gray-500">No banners found. Add a banner to get started.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddBanner}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Banner
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBanners;
