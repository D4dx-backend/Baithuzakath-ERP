# Reusable Components Implementation for Applications

## Overview
Successfully refactored all application pages to use reusable components and hooks with quick date filters (Today, This Week, This Month, This Quarter) and export functionality.

## New Reusable Components & Hooks

### 1. **QuickDateFilter Component** (`src/components/filters/QuickDateFilter.tsx`)
- Provides quick date range selection buttons
- Options: Today, This Week, This Month, This Quarter
- Helper function `getDateRangeFromQuickFilter()` calculates date ranges
- Automatically updates from/to dates when selected

### 2. **ApplicationFilters Component** (`src/components/filters/ApplicationFilters.tsx`)
- Comprehensive filter component with all application filters
- Configurable visibility for each filter type
- Includes:
  - Search by name or ID
  - Status filter (optional)
  - Project filter
  - District filter
  - Area filter
  - Scheme filter
  - Date range (from/to)
  - Quick date filter integration
  - Clear all filters button

### 3. **useApplicationFilters Hook** (`src/hooks/useApplicationFilters.ts`)
- Manages all filter states in one place
- Automatically loads dropdown data (projects, schemes, districts, areas)
- Provides filter setters that reset pagination
- Returns API params for backend queries
- Returns export params for CSV export
- Handles quick date filter logic
- Can accept default status for filtered pages

### 4. **useApplicationExport Hook** (`src/hooks/useApplicationExport.ts`)
- Handles CSV export with all applied filters
- Includes quick date filter in export
- Generates filename with status and date filter
- Fallback to manual CSV generation if API doesn't exist
- Shows loading state during export

## Updated Application Pages

All 8 application pages now use the reusable components:

1. **AllApplications** - All applications with status filter
2. **PendingApplications** - Pending only (status='pending')
3. **UnderReviewApplications** - Under review (status='under_review')
4. **FieldVerificationApplications** - Field verification (status='field_verification')
5. **InterviewScheduledApplications** - Interview scheduled (status='interview_scheduled')
6. **ApprovedApplications** - Approved (status='approved')
7. **RejectedApplications** - Rejected (status='rejected')
8. **CompletedApplications** - Completed (status='completed')

## Features Implemented

### Quick Date Filters
- **Today**: Shows applications from today only
- **This Week**: Shows applications from Sunday to Saturday of current week
- **This Month**: Shows applications from 1st to last day of current month
- **This Quarter**: Shows applications from current quarter (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
- **Custom**: Allows manual date selection

### Export Functionality
- Export button on every page
- Applies ALL current filters to export
- Includes quick date filter in filename
- Format: `{page_type}_{status}_{date_filter}_{timestamp}.csv`
- Example: `pending_applications_this_week_2024-11-12.csv`
- Shows "Exporting..." state during export

### Server-Side Pagination
- All filters sent to backend
- Page number and limit included
- Pagination resets to page 1 when filters change
- Efficient data loading

## Usage Example

```typescript
// In any application page
import { useApplicationFilters } from "@/hooks/useApplicationFilters";
import { useApplicationExport } from "@/hooks/useApplicationExport";
import { ApplicationFilters } from "@/components/filters/ApplicationFilters";

export default function MyApplicationPage() {
  // Initialize with default status (optional)
  const filterHook = useApplicationFilters('pending');
  const { exportApplications, exporting } = useApplicationExport();
  
  // Load applications with filters
  const loadApplications = async () => {
    const params = filterHook.getApiParams(filterHook.filters.currentPage, 10);
    const response = await applications.getAll(params);
    // Handle response...
  };
  
  // Export with filters
  const handleExport = () => {
    const exportParams = filterHook.getExportParams();
    exportApplications(exportParams, 'my_applications');
  };
  
  return (
    <div>
      {/* Filters */}
      <ApplicationFilters
        searchTerm={filterHook.filters.searchTerm}
        onSearchChange={filterHook.setSearchTerm}
        projectFilter={filterHook.filters.projectFilter}
        onProjectChange={filterHook.setProjectFilter}
        projectOptions={filterHook.dropdownOptions.projectOptions}
        // ... other filter props
        quickDateFilter={filterHook.filters.quickDateFilter}
        onQuickDateFilterChange={filterHook.setQuickDateFilter}
        onClearFilters={filterHook.clearAllFilters}
      />
      
      {/* Export button */}
      <Button onClick={handleExport} disabled={exporting}>
        {exporting ? "Exporting..." : "Export Report"}
      </Button>
    </div>
  );
}
```

## Benefits

1. **Code Reusability**: Single source of truth for filters
2. **Consistency**: All pages have identical filter behavior
3. **Maintainability**: Update filters in one place
4. **Performance**: Efficient server-side filtering
5. **User Experience**: Quick date filters for common use cases
6. **Export**: Filtered data export with clear filenames
7. **Type Safety**: Full TypeScript support
8. **Flexibility**: Easy to add/remove filters per page

## API Requirements

The backend should support these query parameters:
- `page`: Page number
- `limit`: Items per page
- `status`: Application status
- `search`: Search term
- `project`: Project ID
- `district`: District ID
- `area`: Area ID
- `scheme`: Scheme ID
- `fromDate`: Start date (ISO string)
- `toDate`: End date (ISO string)
- `quickDateFilter`: Quick filter type (optional, for logging)

## Future Enhancements

1. Save filter preferences per user
2. Add more quick filters (Last 7 days, Last 30 days, etc.)
3. Export to multiple formats (Excel, PDF)
4. Scheduled exports
5. Filter presets/templates
6. Advanced search with multiple criteria
