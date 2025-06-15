
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUploadInput } from "@/components/FileUploadInput";
import { ImagePreview } from "@/components/ImagePreview";

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
}: ImageDialogProps) => {
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = (url: string) => {
    setImageUrl(url);
    setUploaded(true);
  };

  const handleRemove = () => {
    setImageUrl("");
    setUploaded(false);
  };

  return (
    <div className="border rounded-lg p-4 bg-blue-50 space-y-4 w-[350px] max-w-full">
      <Label htmlFor="file-upload" className="block mb-2">Insert Image</Label>
      <div>
        <FileUploadInput onUpload={handleUpload} />
        <div className="text-xs text-gray-500 text-center my-2">or use image URL below</div>
        <Input
          id="image-url"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setUploaded(false);
          }}
          placeholder="https://example.com/image.jpg"
          className="mb-2"
        />
        {imageUrl && (
          <ImagePreview imageUrl={imageUrl} onRemove={handleRemove} />
        )}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onInsertImage}
          size="sm"
          disabled={!imageUrl}
        >
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
};
