
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';

interface ImagePreviewProps {
  imageUrl: string;
  onRemove: () => void;
}

export const ImagePreview = ({ imageUrl, onRemove }: ImagePreviewProps) => {
  const [failed, setFailed] = useState(false);

  return (
    <div className="mt-2">
      <div className="relative inline-block align-top">
        {failed ? (
          <div className="flex h-32 w-32 items-center justify-center rounded border border-destructive/40 bg-destructive/10 p-2 text-center text-xs text-destructive">
            Image could not load. Please upload again.
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Preview"
            className="h-32 w-32 rounded border object-cover"
            onError={() => setFailed(true)}
          />
        )}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-1">Current image</p>
    </div>
  );
};
