import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilePlus, Edit, Trash2, Star } from "lucide-react";
import { useTestimonials, Testimonial } from "@/hooks/useTestimonials";
import { ImageUpload } from "@/components/ImageUpload";
import { useToast } from "@/hooks/use-toast";

const AdminTestimonials = () => {
  const { testimonials, loading, saveTestimonial, deleteTestimonial } = useTestimonials();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Testimonial>({
    id: '',
    name: '',
    text: '',
    rating: 5,
    avatar: '',
    active: true,
    order_num: 1
  });

  const handleCreateNew = () => {
    setEditingTestimonial(null);
    setFormData({
      id: '',
      name: '',
      text: '',
      rating: 5,
      avatar: '',
      active: true,
      order_num: (testimonials.length + 1)
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({ ...testimonial });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate form data
      if (!formData.name?.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Customer name is required"
        });
        return;
      }

      if (!formData.text?.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error", 
          description: "Testimonial text is required"
        });
        return;
      }

      await saveTestimonial(formData);
      setIsDialogOpen(false);
      setEditingTestimonial(null);
    } catch (error) {
      // Error is already handled in the hook
      console.error('Failed to save testimonial:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    await deleteTestimonial(id);
  };

  const handleToggleActive = async (testimonial: Testimonial) => {
    try {
      await saveTestimonial({ ...testimonial, active: !testimonial.active });
    } catch (error) {
      console.error('Failed to toggle testimonial status:', error);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Testimonial Management</h2>
        <Button onClick={handleCreateNew}>
          <FilePlus className="mr-2 h-4 w-4" /> New Testimonial
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No testimonials found. Create your first testimonial to get started.</p>
          </div>
        ) : (
          testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.avatar || 'https://randomuser.me/api/portraits/women/44.jpg'}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://randomuser.me/api/portraits/women/44.jpg';
                      }}
                    />
                    <div>
                      <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        {renderStars(testimonial.rating)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={testimonial.active}
                      onCheckedChange={() => handleToggleActive(testimonial)}
                    />
                    <span className="text-xs text-gray-500">
                      {testimonial.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3 italic">"{testimonial.text}"</p>
                <div className="mt-2 text-xs text-gray-400">
                  Order: {testimonial.order_num}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => handleEdit(testimonial)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(testimonial.id)}
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
        <DialogContent 
          className="w-full max-w-md sm:max-w-lg p-4 sm:p-6 overflow-y-auto max-h-[90vh]"
        >
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial ? 'Edit Testimonial' : 'Create New Testimonial'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <Label htmlFor="text">Testimonial Text *</Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({...formData, text: e.target.value})}
                placeholder="Enter testimonial text"
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="rating">Rating (1-5 stars)</Label>
              <div className="flex items-center gap-2 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 cursor-pointer transition-colors ${
                      i < formData.rating 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                    onClick={() => setFormData({...formData, rating: i + 1})}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">({formData.rating} stars)</span>
              </div>
            </div>

            <ImageUpload
              value={formData.avatar || ''}
              onChange={(url) => setFormData({...formData, avatar: url})}
              label="Customer Avatar (Optional)"
            />

            <div>
              <Label htmlFor="order_num">Display Order</Label>
              <Input
                id="order_num"
                type="number"
                min="1"
                value={formData.order_num}
                onChange={(e) => setFormData({...formData, order_num: parseInt(e.target.value) || 1})}
                placeholder="Display order"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({...formData, active: checked})}
              />
              <Label htmlFor="active">Active testimonial</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingTestimonial ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTestimonials;
