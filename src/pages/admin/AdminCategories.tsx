
import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Edit2, PlusCircle } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const emptyForm = { title: "", slug: "", image: "", bg_color: "#e9c873" };

export default function AdminCategories() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Color picker change
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, bg_color: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await updateCategory(editId, form);
      setEditId(null);
    } else {
      await addCategory(form);
    }
    setForm(emptyForm);
  };

  const handleEdit = (cat: typeof form & { id: string }) => {
    setEditId(cat.id);
    setForm({
      title: cat.title,
      slug: cat.slug,
      image: cat.image,
      bg_color: cat.bg_color,
    });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setForm(emptyForm);
  };

  // NEW: When deleting a category, first update all products using this category to "merchandise"
  const handleDelete = async (categoryId: string, categorySlug: string) => {
    if (!window.confirm("Are you sure you want to delete this category? Products in this category will be moved to 'Merchandise & Others'.")) {
      return;
    }
    try {
      // Step 1: Update products that reference this category (via slug) to "merchandise"
      // The 'category' field in products contains the slug used for category routing
      await supabase
        .from("products")
        .update({ category: "merchandise" })
        .eq("category", categorySlug);

      // Step 2: Delete the category as usual
      await deleteCategory(categoryId);

      toast({
        title: "Category deleted",
        description:
          "Products in this category have been moved to 'Merchandise & Others'.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete Error",
        description: "Failed to delete category and update products.",
      });
      console.error(err);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <PlusCircle className="w-6 h-6" /> Categories Management
      </h1>
      {/* Form */}
      <Card className="max-w-lg mb-8">
        <CardHeader>
          <CardTitle>{editId ? "Edit Category" : "Add New Category"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="title"
              placeholder="Category Title"
              value={form.title}
              onChange={handleChange}
              required
            />
            <Input
              name="slug"
              placeholder="Unique Slug (e.g. play-kit)"
              value={form.slug}
              onChange={handleChange}
              required
            />
            <ImageUpload
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              label="Category Image"
            />
            <div>
              <label className="block text-sm font-medium mb-1">
                Background Color
              </label>
              <input
                type="color"
                name="bg_color"
                value={form.bg_color}
                onChange={handleColorChange}
                className="w-12 h-10 p-0 border-0 cursor-pointer"
                style={{ background: "none" }}
                title="Pick background color"
              />
              <span className="ml-3 text-xs">{form.bg_color}</span>
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editId ? "Update" : "Add"} Category</Button>
              {editId && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Categories list/table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <div>Loading...</div>}
        {categories.map((cat) => (
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
                <div className="text-xs font-mono">{cat.bg_color}</div>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2 items-center pb-4">
              <Button size="sm" variant="outline" onClick={() => handleEdit(cat)}>
                <Edit2 className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(cat.id, cat.slug)}>
                <X className="w-4 h-4 mr-1" /> Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-xs text-athfal-pink mt-4">
        <strong>Note:</strong>
        Categories created before June 2025 may still have the old <code>bg_color</code> value (like <code>bg-athfal-yellow/20</code>). Please edit them and pick a color to make the background visible.
      </div>
    </div>
  );
}

