
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Type,
  AlignLeft,
} from "lucide-react";

interface RichTextToolbarProps {
  onInsertHtml: (html: string, content?: string) => void;
  onShowImageDialog: () => void;
  onShowLinkDialog: () => void;
}

export const RichTextToolbar = ({
  onInsertHtml,
  onShowImageDialog,
  onShowLinkDialog,
}: RichTextToolbarProps) => (
  <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50">
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onInsertHtml("<h1>", "Heading 1")}
      title="Heading 1"
    >
      <Type className="h-4 w-4" />
      H1
    </Button>

    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onInsertHtml("<h2>", "Heading 2")}
      title="Heading 2"
    >
      <Type className="h-4 w-4" />
      H2
    </Button>

    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onInsertHtml("<h3>", "Heading 3")}
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
      onClick={() => onInsertHtml("<p>", "Your paragraph here")}
      title="Paragraph"
    >
      <AlignLeft className="h-4 w-4" />
    </Button>

    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onInsertHtml("<strong>", "Bold text")}
      title="Bold"
    >
      <Bold className="h-4 w-4" />
    </Button>

    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onInsertHtml("<em>", "Italic text")}
      title="Italic"
    >
      <Italic className="h-4 w-4" />
    </Button>

    <div className="border-l mx-2" />

    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onInsertHtml("<ul><li>", "List item</li></ul>")}
      title="Bullet List"
    >
      <List className="h-4 w-4" />
    </Button>

    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onInsertHtml("<ol><li>", "List item</li></ol>")}
      title="Numbered List"
    >
      <ListOrdered className="h-4 w-4" />
    </Button>

    <div className="border-l mx-2" />

    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onShowImageDialog}
      title="Insert Image"
    >
      <ImageIcon className="h-4 w-4" />
    </Button>

    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onShowLinkDialog}
      title="Insert Link"
    >
      <LinkIcon className="h-4 w-4" />
    </Button>
  </div>
);
