
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";

interface CategoryFormProps {
  onSubmit: (form: { title: string; slug: string; image: string; bg_color: string }) => Promise<void>;
  form: { title: string; slug: string; image: string; bg_color: string };
  setForm: (form: { title: string; slug: string; image: string; bg_color: string }) => void;
  editId: string | null;
  onCancelEdit: () => void;
}

export function CategoryForm({ onSubmit, form, setForm, editId, onCancelEdit }: CategoryFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, bg_color: e.target.value });
  };

  return (
    <Card className="max-w-lg mb-8">
      <CardHeader>
        <CardTitle>{editId ? "Edit Category" : "Add New Category"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
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
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
