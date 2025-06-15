
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LinkDialogProps {
  linkText: string;
  setLinkText: (v: string) => void;
  linkUrl: string;
  setLinkUrl: (v: string) => void;
  onInsertLink: () => void;
  onCancel: () => void;
}

export const LinkDialog = ({
  linkText,
  setLinkText,
  linkUrl,
  setLinkUrl,
  onInsertLink,
  onCancel,
}: LinkDialogProps) => (
  <div className="border rounded-lg p-4 bg-blue-50 space-y-2">
    <div>
      <Label htmlFor="link-text">Link Text</Label>
      <Input
        id="link-text"
        value={linkText}
        onChange={(e) => setLinkText(e.target.value)}
        placeholder="Click here"
      />
    </div>
    <div>
      <Label htmlFor="link-url">Link URL</Label>
      <Input
        id="link-url"
        value={linkUrl}
        onChange={(e) => setLinkUrl(e.target.value)}
        placeholder="https://example.com"
      />
    </div>
    <div className="flex gap-2">
      <Button onClick={onInsertLink} size="sm">
        Insert
      </Button>
      <Button onClick={onCancel} variant="outline" size="sm">
        Cancel
      </Button>
    </div>
  </div>
);
