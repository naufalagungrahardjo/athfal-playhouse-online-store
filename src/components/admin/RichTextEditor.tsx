import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Type,
  AlignLeft,
  AlignCenter,
  Code,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const RichTextEditor = ({
  value,
  onChange,
  label,
}: RichTextEditorProps) => {
  // Ref for textarea to control cursor and selection
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Helper: Insert HTML/text at cursor position (replacement of selection)
  const insertAtCursor = (insertValue: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange((value || "") + insertValue);
      return;
    }
    const { selectionStart, selectionEnd } = textarea;
    const before = value.substring(0, selectionStart);
    const after = value.substring(selectionEnd);
    const newValue = before + insertValue + after;
    onChange(newValue);

    // Next render, keep focus and move cursor after inserted value
    setTimeout(() => {
      textarea.focus();
      const pos = before.length + insertValue.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  // Update: insert HTML tags at cursor
  const insertHtml = (htmlTag: string, content?: string) => {
    let text = "";
    if (content) {
      // e.g. <strong>BOLD</strong>
      const tagName = htmlTag.split("<")[1].split(">")[0];
      text = `${htmlTag}${content}</${tagName}>`;
    } else {
      text = htmlTag;
    }
    insertAtCursor(text);
  };

  // Insert Image at cursor
  const insertImage = () => {
    if (imageUrl) {
      const imgTag = `<img src="${imageUrl}" alt="Blog image" class="w-full rounded-lg my-4" />`;
      insertAtCursor(imgTag);
      setImageUrl("");
      setShowImageDialog(false);
    }
  };

  // Insert Link at cursor
  const insertLink = () => {
    if (linkText && linkUrl) {
      const linkTag = `<a href="${linkUrl}" class="text-athfal-pink hover:underline">${linkText}</a>`;
      insertAtCursor(linkTag);
      setLinkText("");
      setLinkUrl("");
      setShowLinkDialog(false);
    }
  };

  return (
    <div className="space-y-4">
      {label && <Label>{label}</Label>}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertHtml("<h1>", "Heading 1")}
          title="Heading 1"
        >
          <Type className="h-4 w-4" />
          H1
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertHtml("<h2>", "Heading 2")}
          title="Heading 2"
        >
          <Type className="h-4 w-4" />
          H2
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertHtml("<h3>", "Heading 3")}
          title="Heading 3"
        >
          <Type className="h-4 w-4" />
          H3
        </Button>

        <div className="border-l mx-2" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertHtml("<p>", "Your paragraph here")}
          title="Paragraph"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertHtml("<strong>", "Bold text")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertHtml("<em>", "Italic text")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="border-l mx-2" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertHtml("<ul><li>", "List item</li></ul>")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertHtml("<ol><li>", "List item</li></ol>")}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="border-l mx-2" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowImageDialog(true)}
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowLinkDialog(true)}
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <Label htmlFor="image-url">Image URL</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="image-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <Button onClick={insertImage} size="sm">
              Insert
            </Button>
            <Button
              onClick={() => {
                setImageUrl("");
                setShowImageDialog(false);
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
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
            <Button onClick={insertLink} size="sm">
              Insert
            </Button>
            <Button
              onClick={() => {
                setLinkText("");
                setLinkUrl("");
                setShowLinkDialog(false);
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Text Editor */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={20}
        className="min-h-[500px] font-mono text-sm"
        placeholder="Start writing your blog content here... You can use the toolbar above to add formatting, images, and links."
      />

      <p className="text-xs text-gray-500">
        This editor supports HTML formatting. Use the toolbar buttons to add
        headers, paragraphs, bold text, lists, images, and links.
      </p>
    </div>
  );
};
