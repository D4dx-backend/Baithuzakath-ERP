# Quick Fix Summary - Beneficiaries Page 403 Error

## What Was Wrong?

You were logged in as a **beneficiary** user trying to access an **admin-only** page.

## The Fix

### 1. Log out and clear your session
```javascript
// Run in browser console (F12)
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### 2. Log in as admin
- **Phone**: 9876543210
- **OTP**: 123456

### 3. Access the page
You can now access `/beneficiaries` without errors.

## What Was Fixed in Code?

✅ Fixed `projects.getAll is not a function` error in `Beneficiaries.tsx`
- Renamed API imports to avoid naming conflicts (`projects` → `projectsApi`, `schemes` → `schemesApi`)
- Added proper pagination parameters
- Added null safety checks
- Mapped API response data to match component interface (id → _id)

✅ Fixed Pagination component type error
- Created `SimplePagination` component with correct props
- Updated import to use the new component

## Admin vs Beneficiary Access

### Admin Pages (require admin role)
- `/beneficiaries` - Manage all beneficiaries
- `/users` - User management
- `/projects` - Project management
- `/schemes` - Scheme management
- `/applications` - All applications
- `/payments` - Payment management

### Beneficiary Pages (require beneficiary role)
- `/beneficiary-login` - Beneficiary login
- `/beneficiary/schemes` - View available schemes
- `/beneficiary/applications` - My applications
- `/beneficiary/profile` - My profile

## Test Credentials

### Admin User
- Phone: 9876543210
- Role: state_admin
- OTP: 123456

### Beneficiary Users
Create via the beneficiary registration flow or admin panel.

## Need More Help?

See `FIX_BENEFICIARIES_403_ERROR.md` for detailed instructions.
