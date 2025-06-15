
import { format } from "date-fns";
import { Blog } from "@/hooks/useBlogs";

interface BlogEditorPreviewProps {
  blog: Blog;
}

export const BlogEditorPreview = ({ blog }: BlogEditorPreviewProps) => (
  <div className="prose prose-lg max-w-none">
    <img
      src={blog.image}
      alt={blog.title}
      className="w-full h-64 object-cover rounded-lg mb-6"
    />
    <div className="flex items-center text-sm text-gray-500 mb-4">
      <span>{format(new Date(blog.date), "MMMM d, yyyy")}</span>
      <span className="mx-2">•</span>
      <span>{blog.category}</span>
      <span className="mx-2">•</span>
      <span>By {blog.author}</span>
    </div>
    <h1 className="text-3xl font-bold mb-6">{blog.title}</h1>
    <div dangerouslySetInnerHTML={{ __html: blog.content }} />
  </div>
);
