# Filters Implementation Summary

## Overview
Implemented reusable filter components and hooks for Applications, Interviews, and Beneficiaries pages with server-side filtering and quick date filters.

## Components Created

### 1. Filter Components
- **QuickDateFilter** (`src/components/filters/QuickDateFilter.tsx`)
  - Quick date range buttons: Today, This Week, This Month, This Quarter
  - Helper function for date range calculations
  
- **ApplicationFilters** (`src/components/filters/ApplicationFilters.tsx`)
  - Specialized filter component for applications
  - Includes all application-specific filters
  
- **GenericFilters** (`src/components/filters/GenericFilters.tsx`)
  - Flexible filter component for any page
  - Configurable filters (show/hide any filter)
  - Supports: search, status, project, district, area, unit, scheme, gender, verification, date range

### 2. Custom Hooks

#### useApplicationFilters (`src/hooks/useApplicationFilters.ts`)
For application pages with filters:
- Search term
- Status (pending, approved, rejected, etc.)
- Project, District, Area, Scheme
- Date range (from/to)
- Quick date filter
- Server-side pagination

#### useInterviewFilters (`src/hooks/useInterviewFilters.ts`)
For interview pages with filters:
- Search term
- Status (scheduled, completed, cancelled)
- Project, District, Area, Scheme
- Date range (from/to)
- Quick date filter
- Server-side pagination

#### useBeneficiaryFilters (`src/hooks/useBeneficiaryFilters.ts`)
For beneficiary pages with filters:
- Search term
- Status (active, inactive, pending)
- Project, District, Area, Unit, Scheme
- Gender (male, female, other)
- Verification status (verified, unverified)
- Date range (from/to)
- Quick date filter
- Server-side pagination

### 3. Export Hook

#### useApplicationExport (`src/hooks/useApplicationExport.ts`)
- Handles CSV export with all applied filters
- Includes quick date filter in export
- Generates filename with filters and timestamp
- Fallback to manual CSV generation

## Pages Updated

### Applications (8 pages) ✅
All application pages now use reusable components:
1. All Applications
2. Pending Applications
3. Under Review Applications
4. Field Verification Applications
5. Interview Scheduled Applications
6. Approved Applications
7. Rejected Applications
8. Completed Applications

### To Be Updated
1. **Upcoming Interviews** - Use `useInterviewFilters` + `GenericFilters`
2. **Beneficiaries** - Use `useBeneficiaryFilters` + `GenericFilters`

## Usage Examples

### For Interviews Page
```typescript
import { useInterviewFilters } from "@/hooks/useInterviewFilters";
import { GenericFilters } from "@/components/filters/GenericFilters";

export default function UpcomingInterviews() {
  const filterHook = useInterviewFilters();
  
  // Load data with filters
  useEffect(() => {
    const loadData = async () => {
      const params = filterHook.getApiParams(filterHook.filters.currentPage, 10);
      const response = await interviews.getAll(params);
      // Handle response...
    };
    loadData();
  }, [
    filterHook.filters.currentPage,
    filterHook.filters.searchTerm,
    filterHook.filters.statusFilter,
    // ... other filter dependencies
  ]);
  
  return (
    <div>
      <GenericFilters
        searchTerm={filterHook.filters.searchTerm}
        onSearchChange={filterHook.setSearchTerm}
        searchPlaceholder="Search interviews..."
        showStatusFilter={true}
        statusFilter={filterHook.filters.statusFilter}
        onStatusChange={filterHook.setStatusFilter}
        statusOptions={[
          { value: "all", label: "All Status" },
          { value: "scheduled", label: "Scheduled" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ]}
        showProjectFilter={true}
        projectFilter={filterHook.filters.projectFilter}
        onProjectChange={filterHook.setProjectFilter}
        projectOptions={filterHook.dropdownOptions.projectOptions}
        showDistrictFilter={true}
        districtFilter={filterHook.filters.districtFilter}
        onDistrictChange={filterHook.setDistrictFilter}
        districtOptions={filterHook.dropdownOptions.districtOptions}
        showAreaFilter={true}
        areaFilter={filterHook.filters.areaFilter}
        onAreaChange={filterHook.setAreaFilter}
        areaOptions={filterHook.dropdownOptions.areaOptions}
        showSchemeFilter={true}
        schemeFilter={filterHook.filters.schemeFilter}
        onSchemeChange={filterHook.setSchemeFilter}
        schemeOptions={filterHook.dropdownOptions.schemeOptions}
        showDateFilters={true}
        fromDate={filterHook.filters.fromDate}
        onFromDateChange={filterHook.setFromDate}
        toDate={filterHook.filters.toDate}
        onToDateChange={filterHook.setToDate}
        showQuickDateFilter={true}
        quickDateFilter={filterHook.filters.quickDateFilter}
        onQuickDateFilterChange={filterHook.setQuickDateFilter}
        onClearFilters={filterHook.clearAllFilters}
      />
    </div>
  );
}
```

### For Beneficiaries Page
```typescript
import { useBeneficiaryFilters } from "@/hooks/useBeneficiaryFilters";
import { GenericFilters } from "@/components/filters/GenericFilters";

export default function Beneficiaries() {
  const filterHook = useBeneficiaryFilters();
  
  // Similar pattern as interviews...
  
  return (
    <div>
      <GenericFilters
        searchTerm={filterHook.filters.searchTerm}
        onSearchChange={filterHook.setSearchTerm}
        searchPlaceholder="Search beneficiaries..."
        // Include additional filters like gender, verification, unit
        showGenderFilter={true}
        genderFilter={filterHook.filters.genderFilter}
        onGenderChange={filterHook.setGenderFilter}
        showVerificationFilter={true}
        verificationFilter={filterHook.filters.verificationFilter}
        onVerificationChange={filterHook.setVerificationFilter}
        showUnitFilter={true}
        unitFilter={filterHook.filters.unitFilter}
        onUnitChange={filterHook.setUnitFilter}
        unitOptions={filterHook.dropdownOptions.unitOptions}
        // ... other filters
        onClearFilters={filterHook.clearAllFilters}
      />
    </div>
  );
}
```

## Features

### Quick Date Filters
- **Today**: Current day only
- **This Week**: Sunday to Saturday of current week
- **This Month**: 1st to last day of current month
- **This Quarter**: Current quarter (Q1-Q4)
- **Custom**: Manual date selection

### Server-Side Filtering
All filters are sent to the backend API:
- `page`: Page number
- `limit`: Items per page
- `search`: Search term
- `status`: Status filter
- `project`: Project ID
- `district`: District ID
- `area`: Area ID
- `unit`: Unit ID (beneficiaries only)
- `scheme`: Scheme ID
- `gender`: Gender (beneficiaries only)
- `isVerified`: Verification status (beneficiaries only)
- `fromDate`: Start date (ISO string)
- `toDate`: End date (ISO string)
- `quickDateFilter`: Quick filter type (for logging)

### Export Functionality
- Export button on every page
- Applies ALL current filters to export
- Includes quick date filter in filename
- Format: `{page_type}_{filters}_{timestamp}.csv`

## Benefits
1. **Consistency**: Same filter behavior across all pages
2. **Reusability**: Single source of truth for filter logic
3. **Maintainability**: Update filters in one place
4. **Performance**: Server-side filtering reduces data transfer
5. **User Experience**: Quick date filters for common use cases
6. **Type Safety**: Full TypeScript support
7. **Flexibility**: Easy to show/hide filters per page

## Next Steps
1. Update UpcomingInterviews page to use `useInterviewFilters` + `GenericFilters`
2. Update Beneficiaries page to use `useBeneficiaryFilters` + `GenericFilters`
3. Test all filters with backend API
4. Add export functionality to interviews and beneficiaries pages
