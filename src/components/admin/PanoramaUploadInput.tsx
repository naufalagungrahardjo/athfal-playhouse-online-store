import { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Compass, Trash2, Loader2, Plus } from 'lucide-react';

interface PanoramaUploadInputProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  hint?: string;
}

export const PanoramaUploadInput = ({
  value,
  onChange,
  label = 'Panoramic Images',
  hint = 'Upload your original wide / 360° panoramic photos — they are shown as a draggable view with correct proportions (no cropping or stretching).',
}: PanoramaUploadInputProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const panoramas = Array.isArray(value) ? value : [];

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    const newUrls: string[] = [];
    try {
      for (const original of Array.from(files)) {
        if (!original.type.startsWith('image/')) continue;
        if (original.size > 15 * 1024 * 1024) {
          toast({ variant: 'destructive', title: 'File too large', description: `${original.name} exceeds 15MB` });
          continue;
        }
        // Upload the original photo untouched. Partial / wide panoramas are
        // rendered correctly by the viewer via panoData (no lossy padding).
        const prepared = original;
        const fileExt = prepared.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `panoramas/${fileName}`;
        const { error } = await supabase.storage.from('images').upload(filePath, prepared, {
          cacheControl: '3600',
          upsert: false,
        });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        newUrls.push(publicUrl);
      }
      if (newUrls.length) {
        onChange([...panoramas, ...newUrls]);
        toast({ title: 'Success', description: `${newUrls.length} panorama(s) uploaded` });
      }
    } catch (error: any) {
      console.error('Panorama upload error:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message || 'Try again.' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addUrl = () => {
    const url = urlRef.current?.value.trim();
    if (!url) return;
    onChange([...panoramas, url]);
    if (urlRef.current) urlRef.current.value = '';
  };

  const removeAt = (idx: number) => {
    onChange(panoramas.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Compass className="h-4 w-4" />
        {label}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {panoramas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {panoramas.map((url, i) => (
            <div key={i} className="relative aspect-video rounded-lg overflow-hidden border bg-gray-100 group">
              <img src={url} alt={`Panorama ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-90 hover:opacity-100"
                aria-label="Remove panorama"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        disabled={uploading}
        onChange={(e) => e.target.files && e.target.files.length > 0 && handleFiles(e.target.files)}
        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
      />
      {uploading && (
        <p className="text-xs text-blue-500 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Uploading panoramas...
        </p>
      )}

      <div className="flex gap-2">
        <Input ref={urlRef} placeholder="...or paste an equirectangular image URL" />
        <Button type="button" variant="outline" onClick={addUrl}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PanoramaUploadInput;