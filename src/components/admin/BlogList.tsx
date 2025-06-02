
import { Blog } from "@/hooks/useBlogs";
import { BlogSearch } from "./BlogSearch";
import { BlogListItem } from "./BlogListItem";

interface BlogListProps {
  blogs: Blog[];
  search: string;
  onSearchChange: (value: string) => void;
  activeTab: string;
  onTabChange: (value: string) => void;
  editingBlog: Blog | null;
  onEditBlog: (blog: Blog) => void;
  onTogglePublish: (blog: Blog) => void;
  onDeleteBlog: (id: string) => void;
}

export const BlogList = ({
  blogs,
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  editingBlog,
  onEditBlog,
  onTogglePublish,
  onDeleteBlog
}: BlogListProps) => {
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

  return (
    <div className="space-y-4">
      <BlogSearch
        search={search}
        onSearchChange={onSearchChange}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
        {filteredBlogs.length === 0 ? (
          <p className="text-center py-4 text-gray-500">No blogs found</p>
        ) : (
          filteredBlogs.map(blog => (
            <BlogListItem
              key={blog.id}
              blog={blog}
              isSelected={editingBlog?.id === blog.id}
              onSelect={onEditBlog}
              onTogglePublish={onTogglePublish}
              onDelete={onDeleteBlog}
            />
          ))
        )}
      </div>
    </div>
  );
};
