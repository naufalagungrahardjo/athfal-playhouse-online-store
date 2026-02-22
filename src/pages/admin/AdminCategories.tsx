import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";
import { CategoryForm } from "./CategoryForm";
import { CategoryList } from "./CategoryList";
import { supabase } from "@/integrations/supabase/client";

const emptyForm = { title: "", slug: "", image: "", bg_color: "#e9c873", description: "" };

export default function AdminCategories() {
  const { categories, loading, addCategory, updateCategory, deleteCategory, moveCategory } = useCategories();
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (fields: typeof emptyForm) => {
    if (editId) {
      await updateCategory(editId, fields);
      setEditId(null);
    } else {
      await addCategory({ ...fields, order_num: undefined });
    }
    setForm(emptyForm);
  };

  const handleEdit = (cat: any) => {
    setEditId(cat.id);
    setForm({
      title: cat.title,
      slug: cat.slug,
      image: cat.image,
      bg_color: cat.bg_color,
      description: cat.description || "",
    });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (categoryId: string, categorySlug: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category? Products in this category will be moved to 'Merchandise & Others'."
      )
    ) {
      return;
    }
    try {
      await supabase
        .from("products")
        .update({ category: "merchandise" })
        .eq("category", categorySlug);

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
      <CategoryForm
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        editId={editId}
        onCancelEdit={handleCancelEdit}
      />
      <CategoryList
        categories={categories}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMove={moveCategory}
      />
      <div className="text-xs text-athfal-pink mt-4">
        <strong>Note:</strong>
        Categories created before June 2025 may still have the old <code>bg_color</code> value (like <code>bg-athfal-yellow/20</code>). Please edit them and pick a color to make the background visible.
      </div>
    </div>
  );
}
