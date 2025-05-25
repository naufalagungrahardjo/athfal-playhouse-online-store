
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Blog {
  id: string;
  title: string;
  content: string;
  image: string;
  author: string;
  date: string;
  category: string;
  published: boolean;
}

export const useBlogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedBlogs: Blog[] = (data || []).map((blog: any) => ({
        id: blog.id,
        title: blog.title,
        content: blog.content,
        image: blog.image,
        author: blog.author,
        date: blog.date,
        category: blog.category,
        published: blog.published
      }));

      setBlogs(formattedBlogs);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch blogs"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBlog = async (blog: Blog) => {
    try {
      const { error } = await supabase
        .from('blogs')
        .upsert({
          id: blog.id,
          title: blog.title,
          content: blog.content,
          image: blog.image,
          author: blog.author,
          date: blog.date,
          category: blog.category,
          published: blog.published,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog saved successfully"
      });

      fetchBlogs();
    } catch (error) {
      console.error('Error saving blog:', error);
      toast({
        variant: "destructive",
        title: "Error", 
        description: "Failed to save blog"
      });
    }
  };

  const deleteBlog = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog deleted successfully"
      });

      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete blog"
      });
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return {
    blogs,
    loading,
    fetchBlogs,
    saveBlog,
    deleteBlog
  };
};
