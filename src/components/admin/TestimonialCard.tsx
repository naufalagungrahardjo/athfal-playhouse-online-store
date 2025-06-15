
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Star } from "lucide-react";
import { Testimonial } from "@/hooks/useTestimonials";

interface TestimonialCardProps {
  testimonial: Testimonial;
  onEdit: (testimonial: Testimonial) => void;
  onDelete: (id: string) => void;
  onToggleActive: (testimonial: Testimonial) => void;
}

export const TestimonialCard = ({
  testimonial,
  onEdit,
  onDelete,
  onToggleActive,
}: TestimonialCardProps) => {
  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
      />
    ));

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={testimonial.avatar || "https://randomuser.me/api/portraits/women/44.jpg"}
              alt={testimonial.name}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://randomuser.me/api/portraits/women/44.jpg";
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
              onCheckedChange={() => onToggleActive(testimonial)}
            />
            <span className="text-xs text-gray-500">
              {testimonial.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-3 italic">
          "{testimonial.text}"
        </p>
        <div className="mt-2 text-xs text-gray-400">
          Order: {testimonial.order_num}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => onEdit(testimonial)}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(testimonial.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};
