
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  description: string;
}

export interface GalleryContent {
  heroTitle: { id: string; en: string };
  heroSubtitle: { id: string; en: string };
  heroImage: string;
  items: GalleryItem[];
}

const DEFAULT_GALLERY_CONTENT: GalleryContent = {
  heroTitle: {
    id: "Galeri Athfal Playhouse",
    en: "Athfal Playhouse Gallery",
  },
  heroSubtitle: {
    id: "Lihat momen-momen berharga dan kegiatan seru di Athfal Playhouse",
    en: "See precious moments and fun activities at Athfal Playhouse",
  },
  heroImage: "https://images.unsplash.com/photo-1544925808-1b704a4ab262?w=800&h=600&fit=crop&auto=format",
  items: []
};

function mergeGalleryContent(stored: any): GalleryContent {
  if (!stored) return DEFAULT_GALLERY_CONTENT;
  return {
    heroTitle: stored.heroTitle || DEFAULT_GALLERY_CONTENT.heroTitle,
    heroSubtitle: stored.heroSubtitle || DEFAULT_GALLERY_CONTENT.heroSubtitle,
    heroImage: stored.heroImage || DEFAULT_GALLERY_CONTENT.heroImage,
    items: Array.isArray(stored.items) ? stored.items : [],
  };
}

export const useGalleryContent = () => {
  const [content, setContent] = useState<GalleryContent>(DEFAULT_GALLERY_CONTENT);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('website_copy')
        .select('content')
        .eq('id', 'gallery')
        .maybeSingle();

      if (error) {
        console.error('Error fetching gallery content:', error);
        return;
      }

      if (data?.content && typeof data.content === 'object') {
        setContent(mergeGalleryContent(data.content));
      }
    } catch (err) {
      console.error('Error fetching gallery content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();

    const channel = supabase
      .channel('gallery_content_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'website_copy',
        filter: 'id=eq.gallery'
      }, () => {
        fetchContent();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchContent]);

  const saveContent = async (newContent: GalleryContent) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('website_copy')
        .upsert({ id: 'gallery', content: newContent as any, updated_at: new Date().toISOString() });

      if (error) throw error;

      setContent(newContent);
      toast({
        title: "Success",
        description: "Gallery content saved successfully"
      });
    } catch (error) {
      console.error('Error saving gallery content:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save gallery content"
      });
    } finally {
      setLoading(false);
    }
  };

  const addGalleryItem = (item: Omit<GalleryItem, 'id'>) => {
    const newItem: GalleryItem = {
      ...item,
      id: Date.now().toString()
    };
    const updatedContent = {
      ...content,
      items: [...content.items, newItem]
    };
    saveContent(updatedContent);
  };

  const updateGalleryItem = (id: string, updatedItem: Partial<GalleryItem>) => {
    const updatedContent = {
      ...content,
      items: content.items.map(item =>
        item.id === id ? { ...item, ...updatedItem } : item
      )
    };
    saveContent(updatedContent);
  };

  const deleteGalleryItem = (id: string) => {
    const updatedContent = {
      ...content,
      items: content.items.filter(item => item.id !== id)
    };
    saveContent(updatedContent);
  };

  return {
    content,
    loading,
    saveContent,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem
  };
};
