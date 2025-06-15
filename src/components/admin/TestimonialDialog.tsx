import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { Testimonial } from "@/hooks/useTestimonials";
import { ImageUpload } from "@/components/ImageUpload";
import { useToast } from "@/hooks/use-toast";

interface TestimonialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTestimonial: Testimonial | null;
  onSave: (testimonial: Testimonial) => Promise<void>;
  saving: boolean;
  setSaving: (v: boolean) => void;
}

export const TestimonialDialog = ({
  open,
  onOpenChange,
  initialTestimonial,
  onSave,
  saving,
  setSaving,
}: TestimonialDialogProps) => {
  const { toast } = useToast();

  // Set up an initialFormData object to use for resets only.
  const initialFormData: Testimonial = initialTestimonial
    ? { ...initialTestimonial }
    : {
        id: "",
        name: "",
        text: "",
        rating: 5,
        avatar: "",
        active: true,
        order_num: 1,
      };

  const [formData, setFormData] = useState<Testimonial>(initialFormData);

  // Only reset form data when a completely NEW testimonial is being edited OR when dialog is just opened to blank.
  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTestimonial?.id]); // important: only reset on id change or dialog open

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!formData.name?.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Customer name is required",
        });
        return;
      }
      if (!formData.text?.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Testimonial text is required",
        });
        return;
      }
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md sm:max-w-lg p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {initialTestimonial && initialTestimonial.id ? "Edit Testimonial" : "Create New Testimonial"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Customer Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter customer name"
              required
            />
          </div>
          <div>
            <Label htmlFor="text">Testimonial Text *</Label>
            <Textarea
              id="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
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
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300 hover:text-yellow-300"
                  }`}
                  onClick={() => setFormData({ ...formData, rating: i + 1 })}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                ({formData.rating} stars)
              </span>
            </div>
          </div>
          <ImageUpload
            value={formData.avatar || ""}
            onChange={(url) =>
              setFormData((prev) => ({
                ...prev,
                avatar: url,
              }))
            }
            label="Customer Avatar (Optional)"
          />
          <div>
            <Label htmlFor="order_num">Display Order</Label>
            <Input
              id="order_num"
              type="number"
              min="1"
              value={formData.order_num}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order_num: parseInt(e.target.value) || 1,
                })
              }
              placeholder="Display order"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, active: checked })
              }
            />
            <Label htmlFor="active">Active testimonial</Label>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : initialTestimonial && initialTestimonial.id ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
