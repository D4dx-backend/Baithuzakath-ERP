# Applications Page Refactor - Separate Pages with Submenu

## Overview
Converted the Applications page from a tab-based interface to separate pages with a submenu structure, implementing server-side pagination for all pages.

## Changes Made

### 1. New Application Pages Created
All pages are located in `erp/src/pages/applications/`:

- **AllApplications.tsx** - View all applications (no status filter)
- **PendingApplications.tsx** - Only pending applications (status='pending')
- **UnderReviewApplications.tsx** - Applications under review (status='under_review')
- **FieldVerificationApplications.tsx** - Applications pending field verification (status='field_verification')
- **InterviewScheduledApplications.tsx** - Applications with scheduled interviews (status='interview_scheduled')
- **ApprovedApplications.tsx** - Approved applications (status='approved')
- **RejectedApplications.tsx** - Rejected applications (status='rejected')
- **CompletedApplications.tsx** - Completed applications (status='completed')

### 2. Server-Side Pagination
Each page implements server-side pagination with:
- Page number tracking
- Items per page limit (default: 10)
- Total pages calculation
- Server-side filtering by status
- Pagination controls with Previous/Next buttons

### 3. Server-Side Filtering
All pages support filtering by:
- Search term (name or application ID)
- Project
- District
- Area
- Scheme
- Date range (from/to)

Filters are sent to the backend API, reducing client-side processing.

### 4. Routes Added
New routes in `App.tsx`:
```
/applications/all - All Applications
/applications/pending - Pending Applications
/applications/under-review - Under Review Applications
/applications/field-verification - Field Verification Applications
/applications/interview-scheduled - Interview Scheduled Applications
/applications/approved - Approved Applications
/applications/rejected - Rejected Applications
/applications/completed - Completed Applications
```

### 5. Sidebar Navigation Updated
Added Applications submenu in `Sidebar.tsx`:
```
Applications (parent)
  ├── All Applications
  ├── Pending
  ├── Under Review
  ├── Field Verification
  ├── Interview Scheduled
  ├── Approved
  ├── Rejected
  └── Completed
```

### 6. Features Retained
All pages maintain:
- View application details
- Approve/Reject actions (where applicable)
- Schedule interviews (for pending applications)
- Reports modal
- Export functionality
- RBAC permission checks
- Responsive design
- Loading states
- Empty states

### 7. Page-Specific Features

#### Pending Applications
- Schedule Interview button (for schemes requiring interviews)
- Approve/Reject buttons (for schemes not requiring interviews)
- Yellow "PENDING" badge

#### Under Review Applications
- Approve/Reject buttons
- Blue "UNDER REVIEW" badge

#### Approved Applications
- View-only mode
- Green "APPROVED" badge
- Shows approved amount

#### Rejected Applications
- View-only mode
- Red "REJECTED" badge
- Shows requested amount

#### Field Verification Applications
- Approve/Reject buttons
- Blue "FIELD VERIFICATION" badge
- For applications requiring field verification

#### Interview Scheduled Applications
- View and Reschedule buttons
- Purple "INTERVIEW SCHEDULED" badge
- Shows interview date if available
- Reschedule interview functionality

#### Completed Applications
- View-only mode
- Green "COMPLETED" badge
- Shows approved/disbursed amount

## API Integration
All pages use the same API endpoint with different status filters:
```javascript
const params = {
  page: currentPage,
  limit: 10,
  status: 'pending', // or 'under_review', 'approved', 'rejected'
  // ... other filters
};
const response = await applications.getAll(params);
```

## Benefits
1. Better performance - Server-side pagination reduces data transfer
2. Cleaner UI - Separate pages instead of tabs
3. Better navigation - Submenu structure similar to Donors and Activity Logs
4. Easier maintenance - Each page is independent
5. Better UX - Focused views for each application status
6. Scalability - Can handle large datasets efficiently

## Testing Checklist
- [ ] Navigate to each application page
- [ ] Test pagination on each page
- [ ] Test filters on each page
- [ ] Test search functionality
- [ ] Test approve/reject actions
- [ ] Test schedule interview
- [ ] Test reports modal
- [ ] Test export functionality
- [ ] Verify RBAC permissions
- [ ] Test responsive design on mobile

## Notes
- The original `/applications` route still exists and can be kept or redirected
- All pages use the same modals (ApplicationViewModal, ShortlistModal, ReportsModal)
- Server-side pagination requires backend support for the status filter parameter
- Each page independently loads dropdown data (projects, schemes, districts, areas)
