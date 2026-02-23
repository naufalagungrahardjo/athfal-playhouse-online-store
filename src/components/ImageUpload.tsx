
import { Label } from '@/components/ui/label';
import { ImagePreview } from '@/components/ImagePreview';
import { FileUploadInput } from '@/components/FileUploadInput';
import { URLInput } from '@/components/URLInput';
import { ImagePlaceholder } from '@/components/ImagePlaceholder';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  hint?: string;
}

export const ImageUpload = ({ value, onChange, label = "Image", className = "", hint }: ImageUploadProps) => {
  const handleRemoveImage = () => {
    onChange('');
  };

  const handleFileUpload = (url: string) => {
    onChange(url);
  };

  const handleUrlSubmit = (url: string) => {
    onChange(url);
  };

  return (
    <div className={className}>
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {value ? (
        <ImagePreview imageUrl={value} onRemove={handleRemoveImage} />
      ) : (
        <ImagePlaceholder />
      )}

      <div className="mt-4 space-y-2">
        <FileUploadInput onUpload={handleFileUpload} />

        <div className="text-center">
          <span className="text-xs text-gray-500">or</span>
        </div>

        <URLInput onSubmit={handleUrlSubmit} />
      </div>
    </div>
  );
};
