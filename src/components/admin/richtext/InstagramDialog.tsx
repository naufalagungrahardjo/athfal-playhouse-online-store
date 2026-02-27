
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InstagramDialogProps {
  instagramUrl: string;
  setInstagramUrl: (v: string) => void;
  onInsertInstagram: () => void;
  onCancel: () => void;
}

export const InstagramDialog = ({
  instagramUrl,
  setInstagramUrl,
  onInsertInstagram,
  onCancel,
}: InstagramDialogProps) => (
  <div className="border rounded-lg p-4 bg-pink-50 space-y-2">
    <div>
      <Label htmlFor="instagram-url">Instagram Post URL</Label>
      <Input
        id="instagram-url"
        value={instagramUrl}
        onChange={(e) => setInstagramUrl(e.target.value)}
        placeholder="https://www.instagram.com/p/ABC123/ or /reel/ABC123/"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Paste the Instagram post or reel URL. It will be embedded directly in the blog so readers can view it without leaving the page.
      </p>
    </div>
    <div className="flex gap-2">
      <Button onClick={onInsertInstagram} size="sm">
        Insert
      </Button>
      <Button onClick={onCancel} variant="outline" size="sm">
        Cancel
      </Button>
    </div>
  </div>
);
