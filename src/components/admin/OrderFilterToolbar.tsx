
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface OrderFilterToolbarProps {
  dateRange: DateRange | undefined;
  setDateRange: (dr: DateRange | undefined) => void;
  onRefresh: () => void;
  onExport: () => void;
}

export function OrderFilterToolbar({
  dateRange,
  setDateRange,
  onRefresh,
  onExport,
}: OrderFilterToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={(!dateRange?.from || !dateRange?.to) ? "text-muted-foreground" : ""}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
                  : "Select Date Range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {(dateRange?.from && dateRange?.to) && (
            <Button
              variant="ghost"
              onClick={() => setDateRange(undefined)}
              className="text-xs text-gray-500"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onRefresh} variant="outline">
          Refresh Orders
        </Button>
        <Button onClick={onExport} variant="default">
          Export Orders as CSV
        </Button>
      </div>
    </div>
  );
}
