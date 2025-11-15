# Application Workflow Permissions Update

## Summary
Updated the application workflow to ensure Unit Admin and District Admin can only **VIEW** applications without approval capabilities. Only Area Admin, State Admin, and Super Admin can review and progress applications.

## Changes Made

### 1. Backend API Routes (`api/src/routes/applicationRoutes.js`)

**Review Application Route:**
- **Before:** `authorize('super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin')`
- **After:** `authorize('super_admin', 'state_admin', 'area_admin')`

**Approve Application Route:**
- **Before:** `authorize('super_admin', 'state_admin', 'district_admin', 'area_admin')`
- **After:** `authorize('super_admin', 'state_admin', 'area_admin')`

### 2. Frontend Application Pages

Updated the following pages to hide action buttons for Unit Admin and District Admin:

#### Files Modified:
1. `erp/src/pages/Applications.tsx`
2. `erp/src/pages/applications/AllApplications.tsx`
3. `erp/src/pages/applications/UnderReviewApplications.tsx`
4. `erp/src/pages/applications/FieldVerificationApplications.tsx`

#### Changes:
- Added `canReviewApplications` permission check:
  ```typescript
  const canReviewApplications = user && ['super_admin', 'state_admin', 'area_admin'].includes(user.role);
  ```

- Updated action buttons to only show for authorized roles:
  - Approve/Reject buttons
  - Schedule Interview buttons
  - Reschedule Interview buttons

- Unit Admin and District Admin now only see:
  - View button
  - Reports button (read-only)

## Role Permissions Summary

| Role | View Applications | Review/Approve | Schedule Interviews | Progress Applications |
|------|------------------|----------------|---------------------|----------------------|
| **Super Admin** | ✅ | ✅ | ✅ | ✅ |
| **State Admin** | ✅ | ✅ | ✅ | ✅ |
| **Area Admin** | ✅ | ✅ | ✅ | ✅ |
| **District Admin** | ✅ | ❌ | ❌ | ❌ |
| **Unit Admin** | ✅ | ❌ | ❌ | ❌ |

## Testing Checklist

- [ ] Unit Admin can view applications but cannot see action buttons
- [ ] District Admin can view applications but cannot see action buttons
- [ ] Area Admin can view, review, approve, and progress applications
- [ ] State Admin has full access to all application operations
- [ ] Super Admin has full access to all application operations
- [ ] API endpoints reject review/approve requests from Unit Admin and District Admin
- [ ] Frontend properly hides action buttons based on user role

## Notes

- Unit Admin and District Admin retain full **read access** to applications in their scope
- They can still view application details, reports, and history
- Only the ability to **modify** application status has been removed
- This ensures proper workflow control while maintaining visibility for all admin levels
