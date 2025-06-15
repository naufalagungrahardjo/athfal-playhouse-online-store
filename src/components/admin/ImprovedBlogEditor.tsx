import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { FileEdit, Eye, Save } from "lucide-react";
import { Blog } from "@/hooks/useBlogs";
import { BlogEditorPreview } from "./BlogEditorPreview";
import { BlogEditorTabs } from "./BlogEditorTabs";

// Blog category options
const BLOG_CATEGORIES = [
  "Perkembangan Anak",
  "Tips & Trik", 
  "Metode Pembelajaran",
  "Pendidikan Islam",
  "Psikologi Anak",
  "Kegiatan & Acara",
  "Review Produk"
];

interface ImprovedBlogEditorProps {
  editingBlog: Blog | null;
  onSave: (blog: Blog) => void;
  onCancel: () => void;
  onPublishToggle: (blog: Blog) => void;
}

export const ImprovedBlogEditor = ({
  editingBlog,
  onSave,
  onCancel,
  onPublishToggle,
}: any) => {
  const [blog, setBlog] = useState<Blog | null>(editingBlog);
  const [date, setDate] = useState<Date | undefined>(
    editingBlog ? new Date(editingBlog.date) : new Date()
  );
  const [previewMode, setPreviewMode] = useState(false);

  // Update local state when editingBlog changes
  useEffect(() => {
    setBlog(editingBlog);
    setDate(editingBlog ? new Date(editingBlog.date) : new Date());
  }, [editingBlog]);

  if (!blog) {
    return (
      <div className="h-full flex items-center justify-center p-12 border rounded-lg border-dashed text-gray-500">
        <div className="text-center">
          <FileEdit className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="font-medium mb-1">No blog selected</h3>
          <p className="text-sm">Select a blog post to edit or create a new one</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (!blog.title.trim()) {
      alert("Blog title is required");
      return;
    }
    if (!blog.content.trim()) {
      alert("Blog content is required");
      return;
    }
    if (!blog.author.trim()) {
      alert("Blog author is required");
      return;
    }
    onSave(blog);
  };

  const handlePublishToggle = async () => {
    const updatedBlog = { ...blog, published: !blog.published };
    await onSave(updatedBlog);
    onCancel();
  };

  return (
    <Card className="h-full">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <FileEdit className="h-5 w-5 text-athfal-pink mr-2" />
            <h3 className="font-semibold text-lg">Rich Blog Editor</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">
              {blog.published ? "Published" : "Draft"}
            </div>
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="h-4 w-4 mr-1" />
              {previewMode ? "Edit" : "Preview"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {previewMode ? (
          <BlogEditorPreview blog={blog} />
        ) : (
          <BlogEditorTabs blog={blog} setBlog={setBlog} date={date} setDate={setDate} />
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePublishToggle}>
            {blog.published ? "Unpublish" : "Publish"}
          </Button>
          <Button onClick={handleSave} className="bg-athfal-pink hover:bg-athfal-pink/90">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
