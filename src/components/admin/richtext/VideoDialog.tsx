
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface VideoDialogProps {
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  onInsertVideo: () => void;
  onCancel: () => void;
}

export const VideoDialog = ({
  videoUrl,
  setVideoUrl,
  onInsertVideo,
  onCancel,
}: VideoDialogProps) => (
  <div className="border rounded-lg p-4 bg-purple-50 space-y-2">
    <div>
      <Label htmlFor="video-url">Video URL</Label>
      <Input
        id="video-url"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=..."
      />
      <p className="text-xs text-muted-foreground mt-1">
        <strong>Paste the regular video URL</strong> (e.g. https://www.youtube.com/watch?v=abc123 or https://youtu.be/abc123). 
        It will be automatically converted to an embed. You do <strong>not</strong> need to copy the embed/iframe code.
      </p>
    </div>
    <div className="flex gap-2">
      <Button onClick={onInsertVideo} size="sm">
        Insert
      </Button>
      <Button onClick={onCancel} variant="outline" size="sm">
        Cancel
      </Button>
    </div>
  </div>
);
