
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilePlus, Edit, Trash2, CalendarIcon } from "lucide-react";
import { useBanners, Banner } from "@/hooks/useBanners";
import { ImageUpload } from "@/components/ImageUpload";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const AdminBanners = () => {
  const { banners, loading, saveBanner, deleteBanner } = useBanners();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Banner>({
    id: '',
    title: '',
    subtitle: '',
    image: '',
    active: false,
    expiry_date: null
  });
  const [expiryPopoverOpen, setExpiryPopoverOpen] = useState(false);

  const handleCreateNew = () => {
    setEditingBanner(null);
    setFormData({
      id: '',
      title: '',
      subtitle: '',
      image: '',
      active: false,
      expiry_date: null
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({ ...banner });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate form data
      if (!formData.title?.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Banner title is required"
        });
        return;
      }

      if (!formData.image?.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error", 
          description: "Banner image is required"
        });
        return;
      }

      await saveBanner(formData);
      setIsDialogOpen(false);
      setEditingBanner(null);
    } catch (error) {
      // Error is already handled in the hook
      console.error('Failed to save banner:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    await deleteBanner(id);
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await saveBanner({ ...banner, active: !banner.active });
    } catch (error) {
      console.error('Failed to toggle banner status:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // get expiry date object
  const expiryDateValue = formData.expiry_date ? new Date(formData.expiry_date) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Banner Management</h2>
        <Button onClick={handleCreateNew}>
          <FilePlus className="mr-2 h-4 w-4" /> New Banner
        </Button>
      </div>

      <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">📐 Recommended Banner Size</p>
        <p>For best display without cropping, use images with:</p>
        <ul className="list-disc list-inside mt-1 space-y-0.5">
          <li><strong>Width:</strong> 1920px (minimum 1200px)</li>
          <li><strong>Height:</strong> 600px - 800px</li>
          <li><strong>Aspect Ratio:</strong> 2.4:1 to 3:1 (landscape/wide)</li>
        </ul>
        <p className="mt-2 text-xs">Images will be scaled to fit the banner area. Using the recommended size ensures your banner displays fully on all devices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No banners found. Create your first banner to get started.</p>
          </div>
        ) : (
          banners.map((banner) => (
            <Card key={banner.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg line-clamp-1">{banner.title}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={banner.active}
                      onCheckedChange={() => handleToggleActive(banner)}
                    />
                    <span className="text-xs text-gray-500">
                      {banner.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg overflow-hidden mb-3">
                  <img
                    src={banner.image || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=400&fit=crop'}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=400&fit=crop';
                    }}
                  />
                </div>
                {banner.subtitle && (
                  <p className="text-sm text-gray-600 line-clamp-2">{banner.subtitle}</p>
                )}
                {banner.expiry_date && (
                  <div className="text-xs mt-2 text-gray-500 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Expires: {format(new Date(banner.expiry_date), "PPP")}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(banner.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? 'Edit Banner' : 'Create New Banner'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pb-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter banner title"
                required
              />
            </div>

            <div>
              <Label htmlFor="subtitle">Subtitle (Optional)</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                placeholder="Enter banner subtitle"
                rows={3}
              />
            </div>

            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData({...formData, image: url})}
              label="Banner Image *"
              hint="Recommended: 1920×600–800px (2.4:1 to 3:1 landscape). Min width 1200px."
            />

            <div>
              <Label htmlFor="banner-expiry-date">Expiry Date</Label>
              <div className="flex items-center gap-3">
                <Popover open={expiryPopoverOpen} onOpenChange={setExpiryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm font-normal text-left transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium",
                        !expiryDateValue ? "text-muted-foreground" : "",
                        "relative"
                      )}
                      style={{ cursor: "pointer", width: "200px" }}
                      aria-label="Select expiry date"
                    >
                      {expiryDateValue
                        ? format(expiryDateValue, "PPP")
                        : "Forever (no expiry)"}
                      <CalendarIcon className="absolute right-4 top-2 h-4 w-4 pointer-events-none opacity-60" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expiryDateValue}
                      onSelect={(newDate) => {
                        setExpiryPopoverOpen(false);
                        setFormData({
                          ...formData,
                          expiry_date: newDate ? newDate.toISOString() : null,
                        });
                      }}
                      initialFocus
                    />
                    <button
                      className="mt-2 block text-xs text-athfal-pink/80 hover:underline"
                      onClick={() => {
                        setFormData({ ...formData, expiry_date: null });
                        setExpiryPopoverOpen(false);
                      }}
                      type="button"
                    >
                      No expiry (up forever)
                    </button>
                  </PopoverContent>
                </Popover>
                {expiryDateValue && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, expiry_date: null })}
                    className="text-xs text-athfal-pink/80 hover:underline"
                  >
                    Remove Expiry
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave as "Forever" to keep this banner active indefinitely.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({...formData, active: checked})}
              />
              <Label htmlFor="active">Set as active banner</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingBanner ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners;
