import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Image as ImageIcon, Video, Star } from 'lucide-react';
import { FileUploadInput } from '@/components/FileUploadInput';
import { VideoUrlInput } from '@/components/admin/VideoUrlInput';

export interface ProductMedia {
  url: string;
  type: 'image' | 'video';
}

interface ProductMediaUploadProps {
  value: ProductMedia[];
  onChange: (media: ProductMedia[]) => void;
  coverImage?: string;
  onCoverChange?: (url: string) => void;
}

export const ProductMediaUpload = ({ value, onChange, coverImage, onCoverChange }: ProductMediaUploadProps) => {
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);

  const stripCacheBuster = (url: string) => url?.replace(/[?&]v=\d+$/, '') || '';
  const isCover = (url: string) => {
    if (!coverImage) return false;
    return url === coverImage || stripCacheBuster(url) === stripCacheBuster(coverImage);
  };

  const handleAddImage = (url: string) => {
    const newMedia = [...value, { url, type: 'image' as const }];
    onChange(newMedia);
    // If no cover is set yet, set the first image as cover
    if (!coverImage && onCoverChange) {
      onCoverChange(url);
    }
    setShowImageUpload(false);
  };

  const handleAddVideo = (url: string) => {
    onChange([...value, { url, type: 'video' }]);
    setShowVideoUpload(false);
  };

  const handleRemove = (index: number) => {
    const removed = value[index];
    const newMedia = value.filter((_, i) => i !== index);
    onChange(newMedia);
    
    // If removed item was the cover, set new cover from remaining images
    if (isCover(removed.url) && onCoverChange) {
      const firstImage = newMedia.find(m => m.type === 'image');
      onCoverChange(firstImage?.url || '');
    }
  };

  const handleSetCover = (url: string) => {
    if (onCoverChange) {
      onCoverChange(url);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Product Images & Videos</Label>
      <p className="text-sm text-muted-foreground">Click the star icon to set as cover image for homepage</p>
      <p className="text-xs text-muted-foreground">📐 Recommended image size: 500×500px (1:1 square). Displays at 450×450px on product page.</p>
      
      {/* Display existing media */}
      <div className="grid grid-cols-3 gap-4">
        {value.map((media, index) => (
          <div key={index} className="relative group">
            {media.type === 'image' ? (
              <img
                src={media.url}
                alt={`Product media ${index + 1}`}
                className={`w-full h-32 object-cover rounded-lg border-2 ${isCover(media.url) ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
              />
            ) : (
              <div className="w-full h-32 bg-muted rounded-lg border flex items-center justify-center">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            {/* Cover indicator */}
            {media.type === 'image' && isCover(media.url) && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                Cover
              </div>
            )}
            {/* Set as cover button (only for images) */}
            {media.type === 'image' && !isCover(media.url) && (
              <button
                type="button"
                onClick={() => handleSetCover(media.url)}
                className="absolute top-2 left-2 bg-background/80 text-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Set as cover"
              >
                <Star className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add media buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowImageUpload(true)}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Add Image
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowVideoUpload(true)}
        >
          <Video className="w-4 h-4 mr-2" />
          Add Video
        </Button>
      </div>

      {/* Upload dialogs */}
      {showImageUpload && (
        <div className="border rounded-lg p-4 bg-blue-50 space-y-2">
          <Label>Upload Image</Label>
          <FileUploadInput onUpload={handleAddImage} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowImageUpload(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {showVideoUpload && (
        <div className="border rounded-lg p-4 bg-blue-50 space-y-2">
          <Label>Add Video URL</Label>
          <VideoUrlInput
            value=""
            onChange={handleAddVideo}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowVideoUpload(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
