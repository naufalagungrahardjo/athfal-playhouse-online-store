
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BLOG_CATEGORIES } from "../BlogEditorTabs";
import { Blog } from "@/hooks/useBlogs";

interface BlogSettingsPanelProps {
  blog: Blog;
  setBlog: (blog: Blog) => void;
}
export const BlogSettingsPanel = ({ blog, setBlog }: BlogSettingsPanelProps) => (
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
);
