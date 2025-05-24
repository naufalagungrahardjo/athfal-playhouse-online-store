import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, FileEdit, FilePlus, Search, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useBlogs, Blog } from "@/hooks/useBlogs";

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

const AdminBlogs = () => {
  const { blogs, loading, saveBlog, deleteBlog } = useBlogs();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [date, setDate] = useState<Date | undefined>(
    editingBlog ? new Date(editingBlog.date) : new Date()
  );

  // Filter blogs based on search and tab
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = 
      blog.title.toLowerCase().includes(search.toLowerCase()) ||
      blog.content.toLowerCase().includes(search.toLowerCase()) ||
      blog.author.toLowerCase().includes(search.toLowerCase()) ||
      blog.category.toLowerCase().includes(search.toLowerCase());
      
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "published") return matchesSearch && blog.published;
    if (activeTab === "drafts") return matchesSearch && !blog.published;
    
    return false;
  });

  const handleCreateNewBlog = () => {
    const newBlog: Blog = {
      id: `blog_${Date.now()}`,
      title: "New Blog Post",
      content: "Start writing your content here...",
      image: "https://images.unsplash.com/photo-1516733968668-dbdce39c4651",
      author: "Admin",
      date: format(new Date(), "yyyy-MM-dd"),
      category: "Tips & Trik",
      published: false
    };
    
    setEditingBlog(newBlog);
  };

  const handleEditBlog = (blog: Blog) => {
    setEditingBlog(blog);
    setDate(new Date(blog.date));
  };

  const handleSaveBlog = async () => {
    if (!editingBlog) return;
    
    console.log('Saving blog with published status:', editingBlog.published);
    await saveBlog(editingBlog);
    setEditingBlog(null);
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;
    
    await deleteBlog(id);
    
    if (editingBlog && editingBlog.id === id) {
      setEditingBlog(null);
    }
  };

  const handleTogglePublish = async (blog: Blog) => {
    const updatedBlog = { ...blog, published: !blog.published };
    console.log('Toggling publish status from', blog.published, 'to', updatedBlog.published);
    await saveBlog(updatedBlog);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Blog Management</h2>
        <Button onClick={handleCreateNewBlog}>
          <FilePlus className="mr-2 h-4 w-4" /> New Blog Post
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Blog list */}
        <div className="md:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search blogs..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {filteredBlogs.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No blogs found</p>
            ) : (
              filteredBlogs.map(blog => (
                <Card 
                  key={blog.id} 
                  className={`cursor-pointer hover:bg-gray-50 ${
                    editingBlog?.id === blog.id ? 'ring-2 ring-athfal-pink' : ''
                  }`}
                  onClick={() => handleEditBlog(blog)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-medium line-clamp-1 ${blog.published ? '' : 'text-gray-500'}`}>
                          {blog.title}
                        </h3>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span>{format(new Date(blog.date), "MMM d, yyyy")}</span>
                          <span className="mx-1">•</span>
                          <span>{blog.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePublish(blog);
                          }}
                          title={blog.published ? 'Published' : 'Draft'}
                        >
                          <span className={`h-2 w-2 rounded-full ${
                            blog.published ? 'bg-green-500' : 'bg-gray-300'
                          }`}></span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBlog(blog.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        
        {/* Blog editor */}
        <div className="md:col-span-2">
          {editingBlog ? (
            <Card>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <FileEdit className="h-5 w-5 text-athfal-pink mr-2" />
                    <h3 className="font-semibold text-lg">Edit Blog Post</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {editingBlog.published ? 'Published' : 'Draft'}
                    </div>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Input
                    value={editingBlog.title}
                    onChange={(e) => setEditingBlog({...editingBlog, title: e.target.value})}
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
                      value={editingBlog.author}
                      onChange={(e) => setEditingBlog({...editingBlog, author: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="blog-category">Category</Label>
                    <Select 
                      value={editingBlog.category} 
                      onValueChange={(value) => setEditingBlog({...editingBlog, category: value})}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              setEditingBlog({
                                ...editingBlog, 
                                date: format(newDate, "yyyy-MM-dd")
                              });
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="blog-image">Image URL</Label>
                    <Input
                      id="blog-image"
                      value={editingBlog.image}
                      onChange={(e) => setEditingBlog({...editingBlog, image: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="blog-content">Content</Label>
                  <Textarea
                    id="blog-content"
                    value={editingBlog.content}
                    onChange={(e) => setEditingBlog({...editingBlog, content: e.target.value})}
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
                  onClick={() => setEditingBlog(null)}
                >
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary"
                    onClick={async () => {
                      const updatedBlog = {...editingBlog, published: !editingBlog.published};
                      console.log('Publishing/Unpublishing blog:', updatedBlog.published);
                      await saveBlog(updatedBlog);
                      setEditingBlog(null);
                    }}
                  >
                    {editingBlog.published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button onClick={handleSaveBlog}>
                    Save Changes
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-12 border rounded-lg border-dashed text-gray-500">
              <div className="text-center">
                <FileEdit className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <h3 className="font-medium mb-1">No blog selected</h3>
                <p className="text-sm">Select a blog post to edit or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBlogs;
