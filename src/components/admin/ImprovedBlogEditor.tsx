import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, FileEdit, Eye, Save } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Blog } from "@/hooks/useBlogs";
import { ImageUpload } from "@/components/ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "./RichTextEditor";

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

export const ImprovedBlogEditor = ({ editingBlog, onSave, onCancel, onPublishToggle }: ImprovedBlogEditorProps) => {
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

  const renderPreview = () => (
    <div className="prose prose-lg max-w-none">
      <img src={blog.image} alt={blog.title} className="w-full h-64 object-cover rounded-lg mb-6" />
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
              {blog.published ? 'Published' : 'Draft'}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        {previewMode ? (
          renderPreview()
        ) : (
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="blog-title">Title</Label>
                <Input
                  id="blog-title"
                  value={blog.title}
                  onChange={(e) => setBlog({...blog, title: e.target.value})}
                  className="text-xl font-medium"
                  placeholder="Enter blog title..."
                />
              </div>
              
              <RichTextEditor
                value={blog.content}
                onChange={(content) => setBlog({...blog, content})}
                label="Blog Content"
              />
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4 mt-4">
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
                label="Featured Image"
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
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
          <Button onClick={handleSave} className="bg-athfal-pink hover:bg-athfal-pink/90">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
