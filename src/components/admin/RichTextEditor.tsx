
import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RichTextToolbar } from "./richtext/RichTextToolbar";
import { ImageDialog } from "./richtext/ImageDialog";
import { LinkDialog } from "./richtext/LinkDialog";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Insert HTML/text at cursor position (replacement of selection)
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

    setTimeout(() => {
      textarea.focus();
      const pos = before.length + insertValue.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  // Insert HTML tags at cursor
  const insertHtml = (htmlTag: string, content?: string) => {
    let text = "";
    if (content) {
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

      <RichTextToolbar
        onInsertHtml={insertHtml}
        onShowImageDialog={() => setShowImageDialog(true)}
        onShowLinkDialog={() => setShowLinkDialog(true)}
      />

      {showImageDialog && (
        <ImageDialog
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          onInsertImage={insertImage}
          onCancel={() => {
            setImageUrl("");
            setShowImageDialog(false);
          }}
        />
      )}

      {showLinkDialog && (
        <LinkDialog
          linkText={linkText}
          setLinkText={setLinkText}
          linkUrl={linkUrl}
          setLinkUrl={setLinkUrl}
          onInsertLink={insertLink}
          onCancel={() => {
            setLinkText("");
            setLinkUrl("");
            setShowLinkDialog(false);
          }}
        />
      )}

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
