
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  items: [
    {
      id: "1",
      type: "video",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      title: "Latest Video",
      description: "Our latest activities and events"
    },
    {
      id: "2",
      type: "image",
      url: "https://picsum.photos/500/500?random=1",
      title: "Activity Photo 1",
      description: "Children enjoying our educational activities"
    },
    {
      id: "3",
      type: "image",
      url: "https://picsum.photos/500/500?random=2",
      title: "Activity Photo 2",
      description: "Learning through play"
    }
  ]
};

export const useGalleryContent = () => {
  const [content, setContent] = useState<GalleryContent>(DEFAULT_GALLERY_CONTENT);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const saveContent = async (newContent: GalleryContent) => {
    try {
      setLoading(true);
      localStorage.setItem('galleryContent', JSON.stringify(newContent));
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

  useEffect(() => {
    try {
      const savedContent = localStorage.getItem('galleryContent');
      if (savedContent) {
        setContent(JSON.parse(savedContent));
      }
    } catch (error) {
      console.error('Error loading gallery content:', error);
    }
  }, []);

  return {
    content,
    loading,
    saveContent,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem
  };
};
