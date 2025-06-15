
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Blog } from "@/hooks/useBlogs";

interface BlogDatePickerProps {
  date: Date | undefined;
  setDate: (d: Date | undefined) => void;
  blog: Blog;
  setBlog: (blog: Blog) => void;
}
export const BlogDatePicker = ({
  date,
  setDate,
  blog,
  setBlog,
}: BlogDatePickerProps) => (
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
          onSelect={newDate => {
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
);
