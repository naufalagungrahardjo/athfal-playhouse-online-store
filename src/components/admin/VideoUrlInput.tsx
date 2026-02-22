
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface VideoUrlInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export const convertToEmbedUrl = (url: string): string => {
  // Handle YouTube URLs
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = url.match(youtubeRegex);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  // Handle Instagram Reels/Posts/Videos
  const instaReelRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/;
  const igMatch = url.match(instaReelRegex);
  if (igMatch) {
    return `https://www.instagram.com/reel/${igMatch[1]}/embed/`;
  }
  if (url.includes('instagram.com/') && url.includes('/embed')) {
    return url;
  }

  return url;
};

export const getVideoSource = (url: string): 'youtube' | 'instagram' | 'unknown' => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  return 'unknown';
};

export const VideoUrlInput = ({ value, onChange, label = "Video URL" }: VideoUrlInputProps) => {
  const [urlInput, setUrlInput] = useState(value);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (urlInput.trim()) {
      const embedUrl = convertToEmbedUrl(urlInput.trim());
      onChange(embedUrl);
      toast({
        title: "Success",
        description: "Video URL updated"
      });
    }
  };

  const source = value ? getVideoSource(value) : null;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="YouTube or Instagram Reel URL"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
        <Button type="button" onClick={handleSubmit}>
          Update
        </Button>
      </div>
      {value && (
        <div className="mt-2">
          <p className="text-xs text-gray-500">
            Current embed URL ({source === 'instagram' ? 'Instagram' : source === 'youtube' ? 'YouTube' : 'Other'}): {value}
          </p>
        </div>
      )}
    </div>
  );
};
