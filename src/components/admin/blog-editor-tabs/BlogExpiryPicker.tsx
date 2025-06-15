
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { Blog } from "@/hooks/useBlogs";

interface BlogExpiryPickerProps {
  blog: Blog;
  setBlog: (blog: Blog) => void;
}
export const BlogExpiryPicker = ({ blog, setBlog }: BlogExpiryPickerProps) => {
  const expiryDateValue = blog.expiry_date ? new Date(blog.expiry_date) : undefined;
  const [expiryPopoverOpen, setExpiryPopoverOpen] = useState(false);

  return (
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
              onSelect={newExpiryDate => {
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
  );
};
