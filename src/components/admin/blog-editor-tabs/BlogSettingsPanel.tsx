
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BLOG_CATEGORIES } from "../BlogEditorTabs";
import { Blog, generateSlug } from "@/hooks/useBlogs";

interface BlogSettingsPanelProps {
  blog: Blog;
  setBlog: (blog: Blog) => void;
}
export const BlogSettingsPanel = ({ blog, setBlog }: BlogSettingsPanelProps) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="blog-slug">Slug / Permalink</Label>
      <div className="flex gap-2 items-center">
        <span className="text-sm text-muted-foreground whitespace-nowrap">/blog/</span>
        <Input
          id="blog-slug"
          value={blog.slug || generateSlug(blog.title)}
          onChange={e => setBlog({ ...blog, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-') })}
          placeholder="auto-generated-from-title"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Leave empty to auto-generate from title. Only lowercase letters, numbers, and hyphens.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="blog-author">Author</Label>
        <Input
          id="blog-author"
          value={blog.author}
          onChange={e => setBlog({ ...blog, author: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="blog-category">Category</Label>
        <Select
          value={blog.category}
          onValueChange={value => setBlog({ ...blog, category: value })}
        >
          <SelectTrigger id="blog-category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {BLOG_CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    <div>
      <Label htmlFor="blog-meta-description">Meta Description (SEO)</Label>
      <Textarea
        id="blog-meta-description"
        value={blog.meta_description || ""}
        onChange={e => setBlog({ ...blog, meta_description: e.target.value })}
        placeholder="Deskripsi singkat untuk Google (maks 160 karakter)"
        maxLength={160}
        className="h-20"
      />
      <p className="text-xs text-muted-foreground mt-1">
        {(blog.meta_description || "").length}/160 karakter
      </p>
    </div>
  </div>
);
