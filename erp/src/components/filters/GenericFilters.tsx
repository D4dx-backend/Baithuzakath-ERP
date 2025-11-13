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

interface GenericFiltersProps {
  // Search
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Status filter (optional)
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: Array<{ value: string; label: string }>;
  showStatusFilter?: boolean;
  
  // Project filter (optional)
  projectFilter?: string;
  onProjectChange?: (value: string) => void;
  projectOptions?: Array<{ value: string; label: string }>;
  showProjectFilter?: boolean;
  
  // District filter (optional)
  districtFilter?: string;
  onDistrictChange?: (value: string) => void;
  districtOptions?: Array<{ value: string; label: string }>;
  showDistrictFilter?: boolean;
  
  // Area filter (optional)
  areaFilter?: string;
  onAreaChange?: (value: string) => void;
  areaOptions?: Array<{ value: string; label: string }>;
  showAreaFilter?: boolean;
  
  // Unit filter (optional)
  unitFilter?: string;
  onUnitChange?: (value: string) => void;
  unitOptions?: Array<{ value: string; label: string }>;
  showUnitFilter?: boolean;
  
  // Scheme filter (optional)
  schemeFilter?: string;
  onSchemeChange?: (value: string) => void;
  schemeOptions?: Array<{ value: string; label: string }>;
  showSchemeFilter?: boolean;
  
  // Gender filter (optional)
  genderFilter?: string;
  onGenderChange?: (value: string) => void;
  showGenderFilter?: boolean;
  
  // Verification filter (optional)
  verificationFilter?: string;
  onVerificationChange?: (value: string) => void;
  showVerificationFilter?: boolean;
  
  // Payment method filter (optional)
  methodFilter?: string;
  onMethodChange?: (value: string) => void;
  showMethodFilter?: boolean;
  
  // Date filters
  fromDate?: Date;
  onFromDateChange?: (date: Date | undefined) => void;
  toDate?: Date;
  onToDateChange?: (date: Date | undefined) => void;
  showDateFilters?: boolean;
  
  // Quick date filter
  quickDateFilter?: QuickDateRange;
  onQuickDateFilterChange?: (range: QuickDateRange) => void;
  showQuickDateFilter?: boolean;
  
  // Clear filters
  onClearFilters: () => void;
  
  // Layout customization
  className?: string;
}

export function GenericFilters({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  statusFilter,
  onStatusChange,
  statusOptions,
  showStatusFilter = false,
  projectFilter,
  onProjectChange,
  projectOptions,
  showProjectFilter = false,
  districtFilter,
  onDistrictChange,
  districtOptions,
  showDistrictFilter = false,
  areaFilter,
  onAreaChange,
  areaOptions,
  showAreaFilter = false,
  unitFilter,
  onUnitChange,
  unitOptions,
  showUnitFilter = false,
  schemeFilter,
  onSchemeChange,
  schemeOptions,
  showSchemeFilter = false,
  genderFilter,
  onGenderChange,
  showGenderFilter = false,
  verificationFilter,
  onVerificationChange,
  showVerificationFilter = false,
  methodFilter,
  onMethodChange,
  showMethodFilter = false,
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
}: GenericFiltersProps) {

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quick Date Filter */}
      {showQuickDateFilter && quickDateFilter !== undefined && onQuickDateFilterChange && (
        <QuickDateFilter selected={quickDateFilter} onSelect={onQuickDateFilterChange} />
      )}
      
      {/* Row 1: Search and main filters */}
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
        
        {showStatusFilter && statusFilter !== undefined && onStatusChange && (
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="flex-1 min-w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions ? statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              )) : (
                <>
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
                </>
              )}
            </SelectContent>
          </Select>
        )}
        
        {showProjectFilter && projectFilter !== undefined && onProjectChange && projectOptions && (
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
        
        {showSchemeFilter && schemeFilter !== undefined && onSchemeChange && schemeOptions && (
          <Combobox
            value={schemeFilter}
            onValueChange={onSchemeChange}
            options={schemeOptions}
            placeholder="Scheme"
            searchPlaceholder="Search..."
            className="w-48"
          />
        )}
        
        {showGenderFilter && genderFilter !== undefined && onGenderChange && (
          <Select value={genderFilter} onValueChange={onGenderChange}>
            <SelectTrigger className="flex-1 min-w-[120px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        {showVerificationFilter && verificationFilter !== undefined && onVerificationChange && (
          <Select value={verificationFilter} onValueChange={onVerificationChange}>
            <SelectTrigger className="flex-1 min-w-[140px]">
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Row 2: Location filters, method filter, and date range */}
      <div className="flex items-center gap-3 flex-wrap">
        {showMethodFilter && methodFilter !== undefined && onMethodChange && (
          <Select value={methodFilter} onValueChange={onMethodChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        {showDistrictFilter && districtFilter !== undefined && onDistrictChange && districtOptions && (
          <Combobox
            value={districtFilter}
            onValueChange={onDistrictChange}
            options={districtOptions}
            placeholder="District"
            searchPlaceholder="Search..."
            className="w-44"
          />
        )}
        
        {showAreaFilter && areaFilter !== undefined && onAreaChange && areaOptions && (
          <Combobox
            value={areaFilter}
            onValueChange={onAreaChange}
            options={areaOptions}
            placeholder="Area"
            searchPlaceholder="Search..."
            className="w-40"
          />
        )}
        
        {showUnitFilter && unitFilter !== undefined && onUnitChange && unitOptions && (
          <Combobox
            value={unitFilter}
            onValueChange={onUnitChange}
            options={unitOptions}
            placeholder="Unit"
            searchPlaceholder="Search..."
            className="w-40"
          />
        )}
        
        {showDateFilters && fromDate !== undefined && onFromDateChange && (
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
