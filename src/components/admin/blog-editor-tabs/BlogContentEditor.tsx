
import { RichTextEditor } from "../RichTextEditor";

interface BlogContentEditorProps {
  value: string;
  onChange: (content: string) => void;
}
export const BlogContentEditor = ({
  value,
  onChange,
}: BlogContentEditorProps) => (
  <RichTextEditor value={value} onChange={onChange} label="Blog Content" />
);
