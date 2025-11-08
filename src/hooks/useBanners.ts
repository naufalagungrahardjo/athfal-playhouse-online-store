
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
  expiry_date?: string | null;
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
      // Admin view: show ALL banners including expired ones
      setBanners(data || []);
      console.log('Banners fetched:', data);
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

      // Validate required fields
      if (!banner.title?.trim()) {
        throw new Error('Banner title is required');
      }
      if (!banner.image?.trim()) {
        throw new Error('Banner image is required');
      }

      const bannerData = {
        title: banner.title.trim(),
        subtitle: banner.subtitle?.trim() || '',
        image: banner.image.trim(),
        active: banner.active,
        updated_at: new Date().toISOString(),
        expiry_date: banner.expiry_date ?? null,
      };

      let result;
      if (banner.id && banner.id !== '' && !banner.id.startsWith('banner_')) {
        // Update existing banner
        result = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', banner.id);
      } else {
        // Insert new banner
        result = await supabase
          .from('banners')
          .insert([bannerData]);
      }

      if (result.error) {
        console.error('Save banner error:', result.error);
        throw result.error;
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
        description: error instanceof Error ? error.message : "Failed to save banner"
      });
      throw error;
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
    // For public display: filter out expired banners
    const now = new Date();
    const validBanners = banners.filter((b) => {
      if (!b.expiry_date) return true;
      return new Date(b.expiry_date) > now;
    });
    return validBanners.find(banner => banner.active);
  };

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
