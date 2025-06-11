
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatar?: string;
  active: boolean;
  order_num: number;
  created_at?: string;
  updated_at?: string;
}

export const useTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      console.log('Fetching testimonials from database...');
      
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('order_num', { ascending: true });

      if (error) {
        console.error('Supabase testimonials error:', error);
        throw error;
      }
      
      console.log('Testimonials fetched:', data);
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch testimonials"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTestimonial = async (testimonial: Testimonial) => {
    try {
      console.log('Saving testimonial:', testimonial);
      
      // Validate required fields
      if (!testimonial.name?.trim()) {
        throw new Error('Testimonial name is required');
      }
      if (!testimonial.text?.trim()) {
        throw new Error('Testimonial text is required');
      }

      const testimonialData = {
        name: testimonial.name.trim(),
        text: testimonial.text.trim(),
        rating: testimonial.rating || 5,
        avatar: testimonial.avatar?.trim() || '',
        active: testimonial.active,
        order_num: testimonial.order_num || 1,
        updated_at: new Date().toISOString()
      };

      console.log('Testimonial data to save:', testimonialData);

      let result;
      if (testimonial.id && testimonial.id !== '' && !testimonial.id.startsWith('testimonial_')) {
        // Update existing testimonial
        result = await supabase
          .from('testimonials')
          .update(testimonialData)
          .eq('id', testimonial.id);
      } else {
        // Insert new testimonial
        result = await supabase
          .from('testimonials')
          .insert([testimonialData]);
      }

      if (result.error) {
        console.error('Save testimonial error:', result.error);
        throw result.error;
      }

      console.log('Testimonial saved successfully');
      toast({
        title: "Success",
        description: "Testimonial saved successfully"
      });

      await fetchTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast({
        variant: "destructive",
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to save testimonial"
      });
      throw error;
    }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      console.log('Deleting testimonial:', id);
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete testimonial error:', error);
        throw error;
      }

      console.log('Testimonial deleted successfully');
      toast({
        title: "Success",
        description: "Testimonial deleted successfully"
      });

      await fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete testimonial"
      });
    }
  };

  const getActiveTestimonials = () => {
    return testimonials.filter(testimonial => testimonial.active);
  };

  // Add real-time subscription for testimonials
  useEffect(() => {
    fetchTestimonials();

    // Set up real-time subscription
    const channel = supabase
      .channel('testimonials-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'testimonials'
        },
        () => {
          console.log('Testimonials table changed, refetching...');
          fetchTestimonials();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    testimonials,
    loading,
    fetchTestimonials,
    saveTestimonial,
    deleteTestimonial,
    getActiveTestimonials
  };
};
