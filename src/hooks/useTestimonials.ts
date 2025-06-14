import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type Testimonial = {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatar?: string;
  active?: boolean;
  order_num?: number;
  created_at?: string;
  updated_at?: string;
};

export const useTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('testimonials' as any)
        .select('*')
        .order('order_num', { ascending: true });

      if (error) {
        throw error;
      }

      setTestimonials((data as any[]) || []);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch testimonials');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch testimonials",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTestimonial = async (testimonial: Omit<Testimonial, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('testimonials' as any)
        .insert([{
          ...testimonial,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTestimonials(prev => [...prev, data as any]);
      toast({
        title: "Success",
        description: "Testimonial added successfully",
      });
      return data;
    } catch (err) {
      console.error('Error adding testimonial:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add testimonial",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTestimonial = async (id: string, updates: Partial<Testimonial>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('testimonials' as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTestimonials(prev => prev.map(t => t.id === id ? data as any : t));
      toast({
        title: "Success",
        description: "Testimonial updated successfully",
      });
      return data;
    } catch (err) {
      console.error('Error updating testimonial:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update testimonial",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('testimonials' as any)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setTestimonials(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Success",
        description: "Testimonial deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting testimonial:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete testimonial",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Helper: get only active testimonials (for home page)
  const getActiveTestimonials = () => {
    return testimonials.filter((t) => t.active);
  };

  // saveTestimonial: add or update
  const saveTestimonial = async (testimonial: Testimonial) => {
    if (!testimonial.id) {
      // New, create it. Omit id, created_at, updated_at
      const { id, created_at, updated_at, ...rest } = testimonial;
      return addTestimonial(rest as Omit<Testimonial, 'id' | 'created_at' | 'updated_at'>);
    } else {
      // Existing, update it
      const { id, ...updates } = testimonial;
      return updateTestimonial(id, updates);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  return {
    testimonials,
    loading,
    error,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
    saveTestimonial,
    getActiveTestimonials,
    refetch: fetchTestimonials,
  };
};
