import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ImageUpload";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Blog } from "@/hooks/useBlogs";
import { RichTextEditor } from "./RichTextEditor";
import { Dispatch, SetStateAction, useState } from "react";

import {
  BlogTitleInput
} from "./blog-editor-tabs/BlogTitleInput";
import {
  BlogContentEditor
} from "./blog-editor-tabs/BlogContentEditor";
import {
  BlogSettingsPanel
} from "./blog-editor-tabs/BlogSettingsPanel";
import {
  BlogDatePicker
} from "./blog-editor-tabs/BlogDatePicker";
import {
  BlogExpiryPicker
} from "./blog-editor-tabs/BlogExpiryPicker";
import {
  BlogImageUpload
} from "./blog-editor-tabs/BlogImageUpload";

export const BLOG_CATEGORIES = [
  "Perkembangan Anak",
  "Tips & Trik", 
  "Metode Pembelajaran",
  "Pendidikan Islam",
  "Psikologi Anak",
  "Kegiatan & Acara",
  "Review Produk"
];

interface BlogEditorTabsProps {
  blog: Blog;
  setBlog: Dispatch<SetStateAction<Blog | null>>;
  date: Date | undefined;
  setDate: (d: Date | undefined) => void;
}

// Refactored main layout
export const BlogEditorTabs = ({
  blog,
  setBlog,
  date,
  setDate,
}: BlogEditorTabsProps) => {
  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      
      <TabsContent value="content" className="space-y-4 mt-4">
        <BlogTitleInput
          title={blog.title}
          setTitle={title => setBlog(prev => prev ? { ...prev, title } : prev)}
        />
        <BlogContentEditor
          value={blog.content}
          onChange={content => setBlog(prev => prev ? { ...prev, content } : prev)}
        />
      </TabsContent>
      
      <TabsContent value="settings" className="space-y-4 mt-4">
        <BlogSettingsPanel blog={blog} setBlog={b => setBlog(b)} />
        <BlogDatePicker
          date={date}
          setDate={setDate}
          blog={blog}
          setBlog={b => setBlog(b)}
        />
        <BlogExpiryPicker blog={blog} setBlog={b => setBlog(b)} />
        <BlogImageUpload
          value={blog.image}
          onChange={url => setBlog(prev => prev ? { ...prev, image: url } : prev)}
        />
      </TabsContent>
    </Tabs>
  );
};
