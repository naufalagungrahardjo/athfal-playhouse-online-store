
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ImageUpload";
import { VideoUrlInput } from "@/components/admin/VideoUrlInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GalleryItem } from "@/hooks/useGalleryContent";

interface Props {
  initialData?: GalleryItem;
  onSave: (item: Omit<GalleryItem, "id">) => void;
  onCancel: () => void;
}

export default function GalleryItemForm({ initialData, onSave, onCancel }: Props) {
  const [item, setItem] = useState({
    type: initialData?.type || "image" as "image" | "video",
    url: initialData?.url || "",
    title: initialData?.title || "",
    description: initialData?.description || ""
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Type</Label>
        <Select value={item.type} onValueChange={(value: "image" | "video") => setItem({ ...item, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Title</Label>
        <Input
          value={item.title}
          onChange={e => setItem({ ...item, title: e.target.value })}
        />
      </div>
      <div>
        <Label>Description</Label>
        <Input
          value={item.description}
          onChange={e => setItem({ ...item, description: e.target.value })}
        />
      </div>
      <div>
        {item.type === "video" ? (
          <VideoUrlInput
            value={item.url}
            onChange={url => setItem({ ...item, url })}
            label="YouTube Video URL"
          />
        ) : (
          <ImageUpload
            value={item.url}
            onChange={url => setItem({ ...item, url })}
            label="Gallery Image"
          />
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(item)}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
