
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ImageDialogProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  onInsertImage: () => void;
  onCancel: () => void;
}

export const ImageDialog = ({
  imageUrl,
  setImageUrl,
  onInsertImage,
  onCancel,
}: ImageDialogProps) => (
  <div className="border rounded-lg p-4 bg-blue-50">
    <Label htmlFor="image-url">Image URL</Label>
    <div className="flex gap-2 mt-2">
      <Input
        id="image-url"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="https://example.com/image.jpg"
      />
      <Button onClick={onInsertImage} size="sm">
        Insert
      </Button>
      <Button
        onClick={onCancel}
        variant="outline"
        size="sm"
      >
        Cancel
      </Button>
    </div>
  </div>
);
