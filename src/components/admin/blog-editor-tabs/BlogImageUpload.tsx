
import { ImageUpload } from "@/components/ImageUpload";
import { Blog } from "@/hooks/useBlogs";

interface BlogImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}
export const BlogImageUpload = ({ value, onChange }: BlogImageUploadProps) => (
  <ImageUpload value={value} onChange={onChange} label="Featured Image" hint="Recommended: 800×450px (16:9). Used as blog card thumbnail and header." />
);
