
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, Trash2 } from "lucide-react";
import { useBanners, Banner } from "@/hooks/useBanners";

const AdminBanners = () => {
  const { toast } = useToast();
  const { banners, loading, saveBanner, deleteBanner } = useBanners();
  const [editingBanners, setEditingBanners] = useState<Banner[]>([]);

  // Initialize editing banners when banners load
  useEffect(() => {
    if (banners.length > 0) {
      setEditingBanners([...banners]);
    }
  }, [banners]);

  const handleAddBanner = () => {
    const newBanner: Banner = {
      id: `temp-${Date.now()}`,
      title: "",
      subtitle: "",
      image: "",
      active: false,
    };
    
    setEditingBanners([...editingBanners, newBanner]);
    
    toast({
      title: "Banner added",
      description: "A new banner has been added. Fill in the details and save your changes.",
    });
  };

  const handleUpdateBanner = (id: string, field: keyof Banner, value: string | boolean) => {
    setEditingBanners(prev => 
      prev.map(banner => {
        if (banner.id !== id) return banner;
        return { ...banner, [field]: value };
      })
    );
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    try {
      if (id.startsWith('temp-')) {
        // Remove from local state only
        setEditingBanners(prev => prev.filter(banner => banner.id !== id));
      } else {
        // Delete from database
        await deleteBanner(id);
        setEditingBanners(prev => prev.filter(banner => banner.id !== id));
      }
      
      toast({
        title: "Banner deleted",
        description: "The banner has been removed.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const handleSaveBanner = async (banner: Banner) => {
    try {
      // Generate a proper ID for new banners
      const bannerToSave = banner.id.startsWith('temp-') 
        ? { ...banner, id: crypto.randomUUID() }
        : banner;

      await saveBanner(bannerToSave);
      
      // Update local state
      setEditingBanners(prev => 
        prev.map(b => b.id === banner.id ? bannerToSave : b)
      );
    } catch (error) {
      console.error('Error saving banner:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Homepage Banners</h2>
        </div>
        <div className="text-center py-12">
          <div>Loading banners...</div>
        </div>
      </div>
    );
  }

  const bannersToShow = editingBanners.length > 0 ? editingBanners : banners;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Homepage Banners</h2>
        <Button onClick={handleAddBanner}>
          <Plus className="mr-2 h-4 w-4" /> Add Banner
        </Button>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        Manage homepage banners. Only one banner should be active at a time.
      </div>
      
      <div className="space-y-6">
        {bannersToShow.map((banner) => (
          <Card key={banner.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Banner</CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`active-${banner.id}`}
                      checked={banner.active}
                      onCheckedChange={(value) => 
                        handleUpdateBanner(banner.id, "active", value)
                      }
                    />
                    <Label htmlFor={`active-${banner.id}`}>
                      {banner.active ? "Active" : "Inactive"}
                    </Label>
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
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`title-${banner.id}`}>Banner Title</Label>
                <Input
                  id={`title-${banner.id}`}
                  value={banner.title}
                  onChange={(e) => handleUpdateBanner(banner.id, "title", e.target.value)}
                  placeholder="Enter banner title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`subtitle-${banner.id}`}>Banner Subtitle</Label>
                <Textarea
                  id={`subtitle-${banner.id}`}
                  rows={2}
                  value={banner.subtitle}
                  onChange={(e) => handleUpdateBanner(banner.id, "subtitle", e.target.value)}
                  placeholder="Enter banner subtitle"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`image-${banner.id}`}>Image URL</Label>
                <Input
                  id={`image-${banner.id}`}
                  value={banner.image}
                  onChange={(e) => handleUpdateBanner(banner.id, "image", e.target.value)}
                  placeholder="Enter image URL (use direct image links)"
                />
                <p className="text-xs text-gray-500">
                  Note: Google Drive links won't work. Use direct image URLs.
                </p>
                {banner.image && (
                  <div className="border rounded-md p-1 mt-2">
                    <img
                      src={banner.image}
                      alt="Banner preview"
                      className="w-full h-auto max-h-32 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                onClick={() => handleSaveBanner(banner)}
                disabled={!banner.title || !banner.image}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Banner
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {bannersToShow.length === 0 && (
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
