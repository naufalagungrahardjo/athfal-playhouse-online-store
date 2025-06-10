
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

export const VideoUrlInput = ({ value, onChange, label = "Video URL" }: VideoUrlInputProps) => {
  const [urlInput, setUrlInput] = useState(value);
  const { toast } = useToast();

  const convertToEmbedUrl = (url: string) => {
    // Handle various YouTube URL formats
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    
    if (match) {
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // If already an embed URL, return as is
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    return url;
  };

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

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
        <Button type="button" onClick={handleSubmit}>
          Update
        </Button>
      </div>
      {value && (
        <div className="mt-2">
          <p className="text-xs text-gray-500">Current embed URL: {value}</p>
        </div>
      )}
    </div>
  );
};
