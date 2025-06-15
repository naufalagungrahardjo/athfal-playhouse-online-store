
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Edit2, ArrowUp, ArrowDown } from "lucide-react";

interface Category {
  id: string;
  title: string;
  slug: string;
  image: string;
  bg_color: string;
  order_num: number;
}

interface CategoryListProps {
  categories: Category[];
  loading: boolean;
  onEdit: (cat: Category) => void;
  onDelete: (categoryId: string, categorySlug: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
}

export function CategoryList({ categories, loading, onEdit, onDelete, onMove }: CategoryListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {loading && <div>Loading...</div>}
      {categories.map((cat, idx) => (
        <Card key={cat.id} className="flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center gap-3">
            <div
              className="rounded-full w-12 h-12 flex items-center justify-center"
              style={{
                background: cat.bg_color,
                opacity: 0.2,
              }}
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="rounded-full w-10 h-10 object-cover bg-gray-100"
                style={{ background: "#fff" }}
              />
            </div>
            <div>
              <CardTitle className="text-lg">{cat.title}</CardTitle>
              <div className="text-xs text-gray-500">{cat.slug}</div>
              <div className="text-xs font-mono">Order: {cat.order_num}</div>
              <div className="flex gap-2 mt-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  disabled={idx === 0}
                  onClick={() => onMove(cat.id, "up")}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  disabled={idx === categories.length - 1}
                  onClick={() => onMove(cat.id, "down")}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex gap-2 items-center pb-4">
            <Button size="sm" variant="outline" onClick={() => onEdit(cat)}>
              <Edit2 className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(cat.id, cat.slug)}>
              <X className="w-4 h-4 mr-1" /> Delete
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
