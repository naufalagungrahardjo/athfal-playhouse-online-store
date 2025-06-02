
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Blog } from "@/hooks/useBlogs";

interface BlogListItemProps {
  blog: Blog;
  isSelected: boolean;
  onSelect: (blog: Blog) => void;
  onTogglePublish: (blog: Blog) => void;
  onDelete: (id: string) => void;
}

export const BlogListItem = ({ 
  blog, 
  isSelected, 
  onSelect, 
  onTogglePublish, 
  onDelete 
}: BlogListItemProps) => {
  return (
    <Card 
      className={`cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'ring-2 ring-athfal-pink' : ''
      }`}
      onClick={() => onSelect(blog)}
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
                onTogglePublish(blog);
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
                onDelete(blog.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
