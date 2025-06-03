import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, FileEdit } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Blog } from "@/hooks/useBlogs";
import { ImageUpload } from "@/components/ImageUpload";

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

interface BlogEditorProps {
  editingBlog: Blog | null;
  onSave: (blog: Blog) => void;
  onCancel: () => void;
  onPublishToggle: (blog: Blog) => void;
}

export const BlogEditor = ({ editingBlog, onSave, onCancel, onPublishToggle }: BlogEditorProps) => {
  const [blog, setBlog] = useState<Blog | null>(editingBlog);
  const [date, setDate] = useState<Date | undefined>(
    editingBlog ? new Date(editingBlog.date) : new Date()
  );

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
    // Validate required fields
    if (!blog.title.trim()) {
      alert('Blog title is required');
      return;
    }
    
    if (!blog.content.trim()) {
      alert('Blog content is required');
      return;
    }
    
    if (!blog.author.trim()) {
      alert('Blog author is required');
      return;
    }
    
    onSave(blog);
  };

  const handlePublishToggle = async () => {
    const updatedBlog = {...blog, published: !blog.published};
    console.log('Publishing/Unpublishing blog:', updatedBlog.published);
    await onSave(updatedBlog);
    onCancel();
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <FileEdit className="h-5 w-5 text-athfal-pink mr-2" />
            <h3 className="font-semibold text-lg">Edit Blog Post</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">
              {blog.published ? 'Published' : 'Draft'}
            </div>
          </div>
        </div>
        <div className="border-b pb-2">
          <Input
            value={blog.title}
            onChange={(e) => setBlog({...blog, title: e.target.value})}
            className="text-xl font-medium border-none p-0 focus-visible:ring-0"
            placeholder="Blog Title"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="blog-author">Author</Label>
            <Input
              id="blog-author"
              value={blog.author}
              onChange={(e) => setBlog({...blog, author: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="blog-category">Category</Label>
            <Select 
              value={blog.category} 
              onValueChange={(value) => setBlog({...blog, category: value})}
            >
              <SelectTrigger id="blog-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {BLOG_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="blog-date">Publish Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  if (newDate) {
                    setBlog({
                      ...blog, 
                      date: format(newDate, "yyyy-MM-dd")
                    });
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <ImageUpload
          value={blog.image}
          onChange={(url) => setBlog({...blog, image: url})}
          label="Blog Image"
        />
        
        <div>
          <Label htmlFor="blog-content">Content</Label>
          <Textarea
            id="blog-content"
            value={blog.content}
            onChange={(e) => setBlog({...blog, content: e.target.value})}
            rows={12}
            className="min-h-[200px]"
          />
          <p className="text-xs text-gray-500 mt-1">
            HTML formatting is supported for rich content.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="secondary"
            onClick={handlePublishToggle}
          >
            {blog.published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
