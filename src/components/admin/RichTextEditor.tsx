
import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RichTextToolbar } from "./richtext/RichTextToolbar";
import { ImageDialog } from "./richtext/ImageDialog";
import { LinkDialog } from "./richtext/LinkDialog";
import { VideoDialog } from "./richtext/VideoDialog";
import { InstagramDialog } from "./richtext/InstagramDialog";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const convertToEmbed = (url: string): string => {
  // YouTube: various formats
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  // Instagram Reel
  const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([\w-]+)/);
  if (igMatch) {
    return `https://www.instagram.com/reel/${igMatch[1]}/embed`;
  }
  return url;
};

export const RichTextEditor = ({
  value,
  onChange,
  label,
}: RichTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showInstagramDialog, setShowInstagramDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

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

  const insertImage = () => {
    if (imageUrl) {
      const imgTag = `<img src="${imageUrl}" alt="Blog image" class="w-full rounded-lg my-4" />`;
      insertAtCursor(imgTag);
      setImageUrl("");
      setShowImageDialog(false);
    }
  };

  const insertLink = () => {
    if (linkText && linkUrl) {
      const linkTag = `<a href="${linkUrl}" class="text-athfal-pink hover:underline">${linkText}</a>`;
      insertAtCursor(linkTag);
      setLinkText("");
      setLinkUrl("");
      setShowLinkDialog(false);
    }
  };

  const insertVideo = () => {
    if (videoUrl) {
      const embedSrc = convertToEmbed(videoUrl.trim());
      const iframeTag = `<div class="my-4"><iframe width="100%" height="400" src="${embedSrc}" frameborder="0" allowfullscreen style="border-radius:8px;"></iframe></div>`;
      insertAtCursor(iframeTag);
      setVideoUrl("");
      setShowVideoDialog(false);
    }
  };

  const insertInstagram = () => {
    if (instagramUrl) {
      const match = instagramUrl.match(/instagram\.com\/(?:p|reel|tv)\/([\w-]+)/);
      if (match) {
        const postId = match[1];
        const embedHtml = `<div class="instagram-embed my-4" data-instagram-id="${postId}"><blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/${postId}/" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:calc(100% - 2px);"><a href="https://www.instagram.com/p/${postId}/">View on Instagram</a></blockquote></div>`;
        insertAtCursor(embedHtml);
      } else {
        // Fallback: try to use the URL directly as an embed
        const cleanUrl = instagramUrl.trim().replace(/\/$/, '');
        const embedHtml = `<div class="instagram-embed my-4"><blockquote class="instagram-media" data-instgrm-permalink="${cleanUrl}/" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:calc(100% - 2px);"><a href="${cleanUrl}/">View on Instagram</a></blockquote></div>`;
        insertAtCursor(embedHtml);
      }
      setInstagramUrl("");
      setShowInstagramDialog(false);
    }
  };

  return (
    <div className="space-y-4">
      {label && <Label>{label}</Label>}

      <RichTextToolbar
        onInsertHtml={insertHtml}
        onShowImageDialog={() => setShowImageDialog(true)}
        onShowLinkDialog={() => setShowLinkDialog(true)}
        onShowVideoDialog={() => setShowVideoDialog(true)}
        onShowInstagramDialog={() => setShowInstagramDialog(true)}
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

      {showVideoDialog && (
        <VideoDialog
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          onInsertVideo={insertVideo}
          onCancel={() => {
            setVideoUrl("");
            setShowVideoDialog(false);
          }}
        />
      )}

      {showInstagramDialog && (
        <InstagramDialog
          instagramUrl={instagramUrl}
          setInstagramUrl={setInstagramUrl}
          onInsertInstagram={insertInstagram}
          onCancel={() => {
            setInstagramUrl("");
            setShowInstagramDialog(false);
          }}
        />
      )}

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={20}
        className="min-h-[500px] font-mono text-sm"
        placeholder="Start writing your blog content here... You can use the toolbar above to add formatting, images, links, and videos."
      />

      <p className="text-xs text-gray-500">
        This editor supports HTML formatting. Use the toolbar buttons to add
        headers, paragraphs, bold text, lists, images, links, and videos.
      </p>
    </div>
  );
};
