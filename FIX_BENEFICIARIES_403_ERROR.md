# Fix for Beneficiaries Page 403 Error

## Problem
You're getting a 403 Forbidden error when trying to access the Beneficiaries page because:
1. You're logged in as a `beneficiary` user
2. The Beneficiaries management page requires admin roles (`state_admin`, `district_admin`, etc.)

## Solution

### Step 1: Verify Admin User Exists ✅

The test admin user already exists in your database:
- **Phone**: 9876543210
- **Role**: state_admin
- **OTP**: 123456 (in development mode with static OTP enabled)

### Step 2: Log Out from Current Session

**Option A: Using Browser Console (Recommended)**
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Run these commands:

```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

**Option B: Using UI**
- Click on your profile/logout button in the app

### Step 3: Log In as Admin

1. Go to the login page (usually at `http://localhost:5173/login`)
2. Enter phone number: **9876543210**
3. Click "Send OTP"
4. Enter OTP: **123456** (static OTP is enabled for development)
5. Click "Verify"

You should now be logged in as a **State Admin** with full access.

### Step 4: Access Beneficiaries Page

Now you should be able to access the Beneficiaries page without the 403 error:
- Navigate to `/beneficiaries` route
- You should see the beneficiaries management interface

## Additional Fixes Applied

### Fixed `projects.getAll is not a function` Error

**Problem**: The error occurred because the API response structure wasn't being handled correctly.

**Solution**: Updated the `fetchFilterOptions` function in `Beneficiaries.tsx` to:
- Add proper pagination parameters to `projects.getAll({ page: 1, limit: 1000 })`
- Add null checks for response data: `projectsRes.success && projectsRes.data`
- Safely access nested properties: `projectsRes.data.projects || []`

This ensures the filter dropdowns load correctly without errors.

## Verification

After logging in as admin, you should see:
- ✅ No 403 errors
- ✅ Beneficiaries list loads successfully
- ✅ Filter options (projects, schemes) load without errors

## Alternative: Use Beneficiary Login Page

If you want to test the beneficiary-facing features, use the dedicated beneficiary login page at:
- `/beneficiary-login` route

This page is specifically designed for beneficiaries to:
- View available schemes
- Submit applications
- Track application status
- View their profile

The main Beneficiaries page (`/beneficiaries`) is for **admin users only** to manage all beneficiaries in the system.
