
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface URLInputProps {
  onSubmit: (url: string) => void;
}

export const URLInput = ({ onSubmit }: URLInputProps) => {
  const [showInput, setShowInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (urlValue.trim()) {
      onSubmit(urlValue.trim());
      setUrlValue('');
      setShowInput(false);
      toast({
        title: "Success",
        description: "Image URL updated"
      });
    }
  };

  const handleCancel = () => {
    setUrlValue('');
    setShowInput(false);
  };

  if (showInput) {
    return (
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Enter image URL"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
        />
        <Button type="button" size="sm" onClick={handleSubmit}>
          Add
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setShowInput(true)}
      className="w-full"
    >
      <Link className="h-4 w-4 mr-2" />
      Add Image URL
    </Button>
  );
};
