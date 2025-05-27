
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export const ImageUpload = ({ value, onChange, label = "Image", className = "" }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload image"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image smaller than 5MB"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file"
        });
        return;
      }

      uploadImage(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
      toast({
        title: "Success",
        description: "Image URL updated"
      });
    }
  };

  const removeImage = () => {
    onChange('');
  };

  return (
    <div className={className}>
      <Label>{label}</Label>
      
      {value ? (
        <div className="mt-2">
          <div className="relative inline-block">
            <img
              src={value}
              alt="Preview"
              className="w-32 h-32 object-cover rounded border"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=400&fit=crop';
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Current image</p>
        </div>
      ) : (
        <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">Upload an image or add URL</p>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-athfal-pink file:text-white hover:file:bg-athfal-pink/80"
          />
          {uploading && (
            <p className="text-xs text-gray-500 mt-1">Uploading...</p>
          )}
        </div>

        <div className="text-center">
          <span className="text-xs text-gray-500">or</span>
        </div>

        {showUrlInput ? (
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Enter image URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <Button type="button" size="sm" onClick={handleUrlSubmit}>
              Add
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowUrlInput(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowUrlInput(true)}
            className="w-full"
          >
            <Link className="h-4 w-4 mr-2" />
            Add Image URL
          </Button>
        )}
      </div>
    </div>
  );
};
