
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Blog } from "@/hooks/useBlogs";

interface BlogTitleInputProps {
  title: string;
  setTitle: (title: string) => void;
}
export const BlogTitleInput = ({ title, setTitle }: BlogTitleInputProps) => (
  <div>
    <Label htmlFor="blog-title">Title</Label>
    <Input
      id="blog-title"
      value={title}
      onChange={e => setTitle(e.target.value)}
      className="text-xl font-medium"
      placeholder="Enter blog title..."
    />
  </div>
);
