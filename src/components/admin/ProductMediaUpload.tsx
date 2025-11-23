import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Plus, Image as ImageIcon, Video } from 'lucide-react';
import { FileUploadInput } from '@/components/FileUploadInput';
import { VideoUrlInput } from '@/components/admin/VideoUrlInput';

export interface ProductMedia {
  url: string;
  type: 'image' | 'video';
}

interface ProductMediaUploadProps {
  value: ProductMedia[];
  onChange: (media: ProductMedia[]) => void;
}

export const ProductMediaUpload = ({ value, onChange }: ProductMediaUploadProps) => {
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);

  const handleAddImage = (url: string) => {
    onChange([...value, { url, type: 'image' }]);
    setShowImageUpload(false);
  };

  const handleAddVideo = (url: string) => {
    onChange([...value, { url, type: 'video' }]);
    setShowVideoUpload(false);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Label>Product Images & Videos</Label>
      
      {/* Display existing media */}
      <div className="grid grid-cols-3 gap-4">
        {value.map((media, index) => (
          <div key={index} className="relative group">
            {media.type === 'image' ? (
              <img
                src={media.url}
                alt={`Product media ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
