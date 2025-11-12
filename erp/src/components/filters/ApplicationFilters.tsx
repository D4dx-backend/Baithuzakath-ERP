import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { QuickDateFilter, QuickDateRange } from "./QuickDateFilter";
import { Search, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ApplicationFiltersProps {
  // Search
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Status filter (optional)
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  showStatusFilter?: boolean;
  
  // Project filter
  projectFilter: string;
  onProjectChange: (value: string) => void;
  projectOptions: Array<{ value: string; label: string }>;
  showProjectFilter?: boolean;
  
  // District filter
  districtFilter: string;
  onDistrictChange: (value: string) => void;
  districtOptions: Array<{ value: string; label: string }>;
  showDistrictFilter?: boolean;
  
  // Area filter
  areaFilter: string;
  onAreaChange: (value: string) => void;
  areaOptions: Array<{ value: string; label: string }>;
  showAreaFilter?: boolean;
  
  // Scheme filter
  schemeFilter: string;
  onSchemeChange: (value: string) => void;
  schemeOptions: Array<{ value: string; label: string }>;
  showSchemeFilter?: boolean;
  
  // Date filters
  fromDate?: Date;
  onFromDateChange: (date: Date | undefined) => void;
  toDate?: Date;
  onToDateChange: (date: Date | undefined) => void;
  showDateFilters?: boolean;
  
  // Quick date filter
  quickDateFilter: QuickDateRange;
  onQuickDateFilterChange: (range: QuickDateRange) => void;
  showQuickDateFilter?: boolean;
  
  // Clear filters
  onClearFilters: () => void;
  
  // Layout customization
  className?: string;
}

export function ApplicationFilters({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search by name or ID...",
  statusFilter,
  onStatusChange,
  showStatusFilter = false,
  projectFilter,
  onProjectChange,
  projectOptions,
  showProjectFilter = true,
  districtFilter,
  onDistrictChange,
  districtOptions,
  showDistrictFilter = true,
  areaFilter,
  onAreaChange,
  areaOptions,
  showAreaFilter = true,
  schemeFilter,
  onSchemeChange,
  schemeOptions,
  showSchemeFilter = true,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  showDateFilters = true,
  quickDateFilter,
  onQuickDateFilterChange,
  showQuickDateFilter = true,
  onClearFilters,
  className,
}: ApplicationFiltersProps) {

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quick Date Filter */}
      {showQuickDateFilter && (
        <QuickDateFilter selected={quickDateFilter} onSelect={onQuickDateFilterChange} />
      )}
      
      {/* Row 1: Search, Status (optional), Project, Scheme */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-[2] min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder={searchPlaceholder}
            className="pl-10 w-full" 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        {showStatusFilter && onStatusChange && (
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="flex-1 min-w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="field_verification">Field Verification</SelectItem>
              <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
              <SelectItem value="interview_completed">Interview Completed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="disbursed">Disbursed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        {showProjectFilter && (
          <Select value={projectFilter} onValueChange={onProjectChange}>
            <SelectTrigger className="flex-1 min-w-[150px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              {projectOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {showSchemeFilter && (
          <Combobox
            value={schemeFilter}
            onValueChange={onSchemeChange}
            options={schemeOptions}
            placeholder="Scheme"
            searchPlaceholder="Search..."
            className="w-48"
          />
        )}
      </div>

      {/* Row 2: District, Area, Date Range, Clear */}
      <div className="flex items-center gap-3 flex-wrap">
        {showDistrictFilter && (
          <Combobox
            value={districtFilter}
            onValueChange={onDistrictChange}
            options={districtOptions}
            placeholder="District"
            searchPlaceholder="Search..."
            className="w-44"
          />
        )}
        
        {showAreaFilter && (
          <Combobox
            value={areaFilter}
            onValueChange={onAreaChange}
            options={areaOptions}
            placeholder="Area"
            searchPlaceholder="Search..."
            className="w-40"
          />
        )}
        
        {showDateFilters && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-36 justify-start text-left font-normal",
                    !fromDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "dd/MM/yy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={onFromDateChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-36 justify-start text-left font-normal",
                    !toDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "dd/MM/yy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={onToDateChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </>
        )}
        
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
