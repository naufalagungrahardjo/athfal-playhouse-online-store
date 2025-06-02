
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import { format } from "date-fns";
import { useBlogs, Blog } from "@/hooks/useBlogs";
import { BlogList } from "@/components/admin/BlogList";
import { BlogEditor } from "@/components/admin/BlogEditor";

const AdminBlogs = () => {
  const { blogs, loading, saveBlog, deleteBlog } = useBlogs();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

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
  };

  const handleSaveBlog = async (blog: Blog) => {
    console.log('Saving blog with data:', blog);
    await saveBlog(blog);
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
        <div className="md:col-span-1">
          <BlogList
            blogs={blogs}
            search={search}
            onSearchChange={setSearch}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            editingBlog={editingBlog}
            onEditBlog={handleEditBlog}
            onTogglePublish={handleTogglePublish}
            onDeleteBlog={handleDeleteBlog}
          />
        </div>
        
        {/* Blog editor */}
        <div className="md:col-span-2">
          <BlogEditor
            editingBlog={editingBlog}
            onSave={handleSaveBlog}
            onCancel={() => setEditingBlog(null)}
            onPublishToggle={handleTogglePublish}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminBlogs;
