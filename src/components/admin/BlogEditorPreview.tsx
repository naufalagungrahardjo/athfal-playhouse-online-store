
import { format } from "date-fns";
import { Blog } from "@/hooks/useBlogs";
import DOMPurify from "dompurify";

interface BlogEditorPreviewProps {
  blog: Blog;
}

export const BlogEditorPreview = ({ blog }: BlogEditorPreviewProps) => (
  <div className="prose prose-lg max-w-none">
    <div className="bg-accent rounded-lg mb-6 flex items-center justify-center w-full" style={{ aspectRatio: '16/9' }}>
      <img
        src={blog.image}
        alt={blog.title}
        className="object-contain max-w-full max-h-full rounded-lg"
      />
    </div>
    <div className="flex items-center text-sm text-gray-500 mb-4">
      <span>{format(new Date(blog.date), "MMMM d, yyyy")}</span>
      <span className="mx-2">•</span>
      <span>{blog.category}</span>
      <span className="mx-2">•</span>
      <span>By {blog.author}</span>
    </div>
    <h1 className="text-3xl font-bold mb-6">{blog.title}</h1>
    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allowfullscreen', 'frameborder', 'allow'], ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'a', 'div', 'span', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'sub', 'sup', 'iframe'], ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel', 'width', 'height', 'frameborder', 'allowfullscreen', 'allow'] }) }} />
  </div>
);
