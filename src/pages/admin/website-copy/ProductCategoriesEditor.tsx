
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Category {
  title: { id: string; en: string };
  description: { id: string; en: string };
}

interface Props {
  productCategories: Record<string, Category>;
  onChange: (path: string, lang: "id" | "en", value: string) => void;
}

export default function ProductCategoriesEditor({ productCategories, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Categories</CardTitle>
        <CardDescription>
          Titles and descriptions for product category pages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(productCategories).map(([key, category]) => (
          <div key={key} className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title (Indonesian)</Label>
                <Input
                  value={category.title.id}
                  onChange={e => onChange(`${key}.title`, "id", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Title (English)</Label>
                <Input
                  value={category.title.en}
                  onChange={e => onChange(`${key}.title`, "en", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description (Indonesian)</Label>
                <Textarea
                  rows={3}
                  value={category.description.id}
                  onChange={e => onChange(`${key}.description`, "id", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (English)</Label>
                <Textarea
                  rows={3}
                  value={category.description.en}
                  onChange={e => onChange(`${key}.description`, "en", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
