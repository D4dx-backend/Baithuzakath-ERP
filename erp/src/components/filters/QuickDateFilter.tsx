import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";

export type QuickDateRange = 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'custom' | null;

interface QuickDateFilterProps {
  selected: QuickDateRange;
  onSelect: (range: QuickDateRange) => void;
}

export function QuickDateFilter({ selected, onSelect }: QuickDateFilterProps) {
  const filters = [
    { value: 'today' as QuickDateRange, label: 'Today' },
    { value: 'this_week' as QuickDateRange, label: 'This Week' },
    { value: 'this_month' as QuickDateRange, label: 'This Month' },
    { value: 'this_quarter' as QuickDateRange, label: 'This Quarter' },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Quick Filter:</span>
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={selected === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(filter.value)}
          className="h-8"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}

// Helper function to get date range based on quick filter
export function getDateRangeFromQuickFilter(range: QuickDateRange): { fromDate: Date; toDate: Date } | null {
  if (!range || range === 'custom') return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return {
        fromDate: today,
        toDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'this_week': {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { fromDate: startOfWeek, toDate: endOfWeek };
    }
    
    case 'this_month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return { fromDate: startOfMonth, toDate: endOfMonth };
    }
    
    case 'this_quarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
      const endOfQuarter = new Date(today.getFullYear(), quarter * 3 + 3, 0);
      endOfQuarter.setHours(23, 59, 59, 999);
      return { fromDate: startOfQuarter, toDate: endOfQuarter };
    }
    
    default:
      return null;
  }
}
