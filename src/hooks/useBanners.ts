
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBanners = async () => {
    try {
      setLoading(true);
      console.log('Fetching banners from database...');
      
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase banners error:', error);
        throw error;
      }
      
      console.log('Banners fetched:', data);
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch banners"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBanner = async (banner: Banner) => {
    try {
      console.log('Saving banner:', banner);
      const { error } = await supabase
        .from('banners')
        .upsert({
          id: banner.id,
          title: banner.title,
          subtitle: banner.subtitle,
          image: banner.image,
          active: banner.active,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Save banner error:', error);
        throw error;
      }

      console.log('Banner saved successfully');
      toast({
        title: "Success",
        description: "Banner saved successfully"
      });

      await fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast({
        variant: "destructive",
        title: "Error", 
        description: "Failed to save banner"
      });
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      console.log('Deleting banner:', id);
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete banner error:', error);
        throw error;
      }

      console.log('Banner deleted successfully');
      toast({
        title: "Success",
        description: "Banner deleted successfully"
      });

      await fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete banner"
      });
    }
  };

  const getActiveBanner = () => {
    return banners.find(banner => banner.active);
  };

  // Add real-time subscription for banners
  useEffect(() => {
    fetchBanners();

    // Set up real-time subscription
    const channel = supabase
      .channel('banners-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'banners'
        },
        () => {
          console.log('Banners table changed, refetching...');
          fetchBanners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    banners,
    loading,
    fetchBanners,
    saveBanner,
    deleteBanner,
    getActiveBanner
  };
};
