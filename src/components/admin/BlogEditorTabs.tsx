
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

const BLOG_CATEGORIES = [
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

export const BlogEditorTabs = ({
  blog,
  setBlog,
  date,
  setDate,
}: BlogEditorTabsProps) => {
  // Expiry date state for controlled popover
  const expiryDateValue = blog.expiry_date ? new Date(blog.expiry_date) : undefined;
  const [expiryPopoverOpen, setExpiryPopoverOpen] = useState(false);

  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      
      <TabsContent value="content" className="space-y-4 mt-4">
        <div>
          <Label htmlFor="blog-title">Title</Label>
          <Input
            id="blog-title"
            value={blog.title}
            onChange={(e) => setBlog({ ...blog, title: e.target.value })}
            className="text-xl font-medium"
            placeholder="Enter blog title..."
          />
        </div>
        <RichTextEditor
          value={blog.content}
          onChange={(content) => setBlog({ ...blog, content })}
          label="Blog Content"
        />
      </TabsContent>
      
      <TabsContent value="settings" className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="blog-author">Author</Label>
            <Input
              id="blog-author"
              value={blog.author}
              onChange={(e) => setBlog({ ...blog, author: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="blog-category">Category</Label>
            <Select
              value={blog.category}
              onValueChange={(value) => setBlog({ ...blog, category: value })}
            >
              <SelectTrigger id="blog-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {BLOG_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="blog-date">Publish Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm font-normal text-left transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium " +
                    (!date ? "text-muted-foreground" : ""),
                  "relative"
                )}
                style={{ cursor: "pointer" }}
              >
                {date ? format(date, "PPP") : ""}
                <CalendarIcon className="absolute right-4 top-2 h-4 w-4 pointer-events-none opacity-60" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  if (newDate) {
                    setBlog({
                      ...blog,
                      date: format(newDate, "yyyy-MM-dd"),
                    });
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Expiry Date Selector */}
        <div>
          <Label htmlFor="blog-expiry-date">Expiry Date</Label>
          <div className="flex items-center gap-3">
            <Popover open={expiryPopoverOpen} onOpenChange={setExpiryPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm font-normal text-left transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium",
                    !expiryDateValue ? "text-muted-foreground" : "",
                    "relative"
                  )}
                  style={{ cursor: "pointer", width: "200px" }}
                  aria-label="Select expiry date"
                >
                  {expiryDateValue
                    ? format(expiryDateValue, "PPP")
                    : "Forever (no expiry)"}
                  <CalendarIcon className="absolute right-4 top-2 h-4 w-4 pointer-events-none opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expiryDateValue}
                  onSelect={(newExpiryDate) => {
                    setExpiryPopoverOpen(false);
                    setBlog({
                      ...blog,
                      expiry_date: newExpiryDate
                        ? newExpiryDate.toISOString()
                        : null,
                    });
                  }}
                  initialFocus
                />
                <button
                  className="mt-2 block text-xs text-athfal-pink/80 hover:underline"
                  onClick={() => {
                    setBlog({ ...blog, expiry_date: null });
                    setExpiryPopoverOpen(false);
                  }}
                  type="button"
                >
                  No expiry (up forever)
                </button>
              </PopoverContent>
            </Popover>
            {expiryDateValue && (
              <button
                type="button"
                onClick={() => setBlog({ ...blog, expiry_date: null })}
                className="text-xs text-athfal-pink/80 hover:underline"
              >
                Remove Expiry
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Leave as "Forever" to keep this blog active indefinitely.
          </p>
        </div>

        <ImageUpload
          value={blog.image}
          onChange={(url) => setBlog({ ...blog, image: url })}
          label="Featured Image"
        />
      </TabsContent>
    </Tabs>
  );
};
