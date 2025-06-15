
import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Edit2, PlusCircle } from "lucide-react";

const emptyForm = { title: "", slug: "", image: "", bg_color: "" };

export default function AdminCategories() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Form submission for add or edit
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
            <Input
              name="image"
              placeholder="Image URL"
              value={form.image}
              onChange={handleChange}
              required
            />
            <Input
              name="bg_color"
              placeholder="BG Color class (e.g. bg-athfal-yellow/20)"
              value={form.bg_color}
              onChange={handleChange}
            />
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
              <img
                src={cat.image}
                alt={cat.title}
                className="rounded-full w-12 h-12 object-cover bg-gray-100"
              />
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
              <Button size="sm" variant="destructive" onClick={() => deleteCategory(cat.id)}>
                <X className="w-4 h-4 mr-1" /> Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
