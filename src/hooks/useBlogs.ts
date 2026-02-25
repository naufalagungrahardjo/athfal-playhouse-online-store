
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Blog {
  id: string;
  title: string;
  slug?: string | null;
  content: string;
  image: string;
  author: string;
  date: string;
  category: string;
  published: boolean;
  expiry_date?: string | null;
  meta_description?: string | null;
}

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const useBlogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      console.log('Fetching blogs from database...');
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching blogs:', error);
        throw error;
      }

      // Only include blogs that have no expiry, or expiry_date in the future
      const now = new Date();
      const filteredBlogs = (data || []).filter((blog: any) => {
        if (!blog.expiry_date) return true;
        return new Date(blog.expiry_date) > now;
      });

      console.log('Blogs fetched successfully:', filteredBlogs);

      const formattedBlogs: Blog[] = filteredBlogs.map((blog: any) => ({
        id: blog.id,
        title: blog.title || '',
        content: blog.content || '',
        image: blog.image || 'https://images.unsplash.com/photo-1516733968668-dbdce39c4651',
        author: blog.author || 'Admin',
        date: blog.date || new Date().toISOString().split('T')[0],
        category: blog.category || 'General',
        published: blog.published || false,
        expiry_date: blog.expiry_date,
        meta_description: blog.meta_description || null,
        slug: blog.slug || null
      }));

      setBlogs(formattedBlogs);
      console.log('Formatted blogs:', formattedBlogs);
    } catch (error: any) {
      console.error('Error fetching blogs:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch blogs. Please try again later."
      });
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const saveBlog = async (blog: Blog) => {
    try {
      console.log('Saving blog:', blog);
      // Validate required fields
      if (!blog.title || !blog.content || !blog.author) {
        throw new Error('Title, content, and author are required fields');
      }
      const blogData = {
        id: blog.id,
        title: blog.title,
        content: blog.content,
        image: blog.image || 'https://images.unsplash.com/photo-1516733968668-dbdce39c4651',
        author: blog.author,
        date: blog.date,
        category: blog.category,
        published: blog.published,
        updated_at: new Date().toISOString(),
        expiry_date: blog.expiry_date ?? null,
        meta_description: blog.meta_description ?? null,
        slug: blog.slug || generateSlug(blog.title)
      };

      const { error } = await supabase
        .from('blogs')
        .upsert(blogData);

      if (error) {
        console.error('Save blog error:', error);
        throw error;
      }

      console.log('Blog saved successfully');
      toast({
        title: "Success",
        description: "Blog saved successfully"
      });

      await fetchBlogs();
    } catch (error: any) {
      console.error('Error saving blog:', error);
      toast({
        variant: "destructive",
        title: "Error", 
        description: "Failed to save blog: " + (error.message || 'Unknown error')
      });
    }
  };

  const deleteBlog = async (id: string) => {
    try {
      console.log('Deleting blog:', id);
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete blog error:', error);
        throw error;
      }

      console.log('Blog deleted successfully');
      toast({
        title: "Success",
        description: "Blog deleted successfully"
      });

      await fetchBlogs();
    } catch (error: any) {
      console.error('Error deleting blog:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete blog: " + (error.message || 'Unknown error')
      });
    }
  };

  useEffect(() => {
    fetchBlogs();
    // Set up real-time subscription for blogs
    const channel = supabase
      .channel('blogs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blogs'
        },
        () => {
          console.log('Blogs table changed, refetching...');
          fetchBlogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    blogs,
    loading,
    fetchBlogs,
    saveBlog,
    deleteBlog
  };
};
