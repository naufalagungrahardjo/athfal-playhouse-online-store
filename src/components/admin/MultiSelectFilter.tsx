import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  options: MultiSelectOption[];
  /** Selected values. An empty array means "all". */
  selected: string[];
  onChange: (values: string[]) => void;
  allLabel?: string;
  width?: string;
  className?: string;
}

/**
 * A checkbox dropdown filter. When nothing is selected it is treated as "all".
 * Lets the user include all options or pick only several.
 */
export const MultiSelectFilter = ({
  options,
  selected,
  onChange,
  allLabel = 'All',
  width = 'w-[200px]',
  className,
}: MultiSelectFilterProps) => {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const allSelected = selected.length === 0;
  const label = allSelected
    ? allLabel
    : selected.length === 1
      ? options.find(o => o.value === selected[0])?.label || `1 selected`
      : `${selected.length} selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(width, 'justify-between font-normal', className)}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <div className="max-h-72 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          >
            <span className="flex h-4 w-4 items-center justify-center">
              {allSelected && <Check className="h-4 w-4" />}
            </span>
            <span className="font-medium">{allLabel}</span>
          </button>
          <div className="my-1 h-px bg-border" />
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Checkbox checked={selected.includes(opt.value)} className="pointer-events-none" />
              <span className="truncate text-left">{opt.label}</span>
            </button>
          ))}
          {options.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">No options</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelectFilter;