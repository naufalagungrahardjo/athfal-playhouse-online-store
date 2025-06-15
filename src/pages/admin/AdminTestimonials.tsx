import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import { useTestimonials, Testimonial } from "@/hooks/useTestimonials";
import { useToast } from "@/hooks/use-toast";
import { TestimonialDialog } from "@/components/admin/TestimonialDialog";
import { TestimonialCard } from "@/components/admin/TestimonialCard";

const AdminTestimonials = () => {
  const { testimonials, loading, saveTestimonial, deleteTestimonial } = useTestimonials();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreateNew = () => {
    setEditingTestimonial(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setIsDialogOpen(true);
  };

  const handleSave = async (formData: Testimonial) => {
    try {
      await saveTestimonial({
        ...formData,
        order_num: formData.order_num || testimonials.length + 1,
      });
      setIsDialogOpen(false);
      setEditingTestimonial(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    await deleteTestimonial(id);
  };

  const handleToggleActive = async (testimonial: Testimonial) => {
    try {
      await saveTestimonial({ ...testimonial, active: !testimonial.active });
    } catch (error) {
      // Error handled by hook
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Testimonial Management
        </h2>
        <Button onClick={handleCreateNew}>
          <FilePlus className="mr-2 h-4 w-4" /> New Testimonial
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">
              No testimonials found. Create your first testimonial to get started.
            </p>
          </div>
        ) : (
          testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))
        )}
      </div>

      <TestimonialDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialTestimonial={
          editingTestimonial
            ? editingTestimonial
            : {
                id: "",
                name: "",
                text: "",
                rating: 5,
                avatar: "",
                active: true,
                order_num: testimonials.length + 1,
              }
        }
        onSave={handleSave}
        saving={saving}
        setSaving={setSaving}
      />
    </div>
  );
};

export default AdminTestimonials;
