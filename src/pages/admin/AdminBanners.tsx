
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilePlus, Edit, Trash2 } from "lucide-react";
import { useBanners, Banner } from "@/hooks/useBanners";
import { ImageUpload } from "@/components/ImageUpload";

const AdminBanners = () => {
  const { banners, loading, saveBanner, deleteBanner } = useBanners();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<Banner>({
    id: '',
    title: '',
    subtitle: '',
    image: '',
    active: false
  });

  const handleCreateNew = () => {
    setEditingBanner(null);
    setFormData({
      id: `banner_${Date.now()}`,
      title: '',
      subtitle: '',
      image: '',
      active: false
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData(banner);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Banner title is required');
      return;
    }

    await saveBanner(formData);
    setIsDialogOpen(false);
    setEditingBanner(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    await deleteBanner(id);
  };

  const handleToggleActive = async (banner: Banner) => {
    await saveBanner({ ...banner, active: !banner.active });
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Banner Management</h2>
        <Button onClick={handleCreateNew}>
          <FilePlus className="mr-2 h-4 w-4" /> New Banner
        </Button>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? 'Edit Banner' : 'Create New Banner'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
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
              label="Banner Image"
            />

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({...formData, active: checked})}
              />
              <Label htmlFor="active">Set as active banner</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingBanner ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners;
