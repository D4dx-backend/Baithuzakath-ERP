# Fix for RBAC 403 Forbidden Error

## Problem
Getting `403 Forbidden` error when accessing `/api/rbac/permissions` endpoint from the RoleManagement component.

## Root Cause
The RBAC (Role-Based Access Control) system is properly configured and the `state_admin` role has the required `permissions.read` permission. However, the user's current session may not be reflecting the RBAC permissions properly.

## Verification Completed
✅ RBAC system is initialized
✅ `state_admin` role has 85 permissions including `permissions.read`
✅ User has the role assigned in the database
✅ Permission check returns `true` when tested directly

## Solution

### Option 1: Restart API Server (Recommended)
1. Stop the current API server
2. Restart it using:
   ```bash
   cd api
   npm start
   ```
3. The server will reload all RBAC configurations

### Option 2: Logout and Login Again
1. Open the ERP application
2. Logout from your current session
3. Login again with your credentials
4. This will create a new session with updated RBAC permissions

### Option 3: Test the API Directly
Open `test-permissions-api.html` in your browser to:
1. Check your current token
2. Test the permissions endpoint directly
3. Verify your permissions are working

## Testing Scripts Created

### 1. `api/fix-rbac-permissions.js`
Verifies and fixes RBAC role assignments for state_admin users.
```bash
cd api
node fix-rbac-permissions.js
```

### 2. `api/test-user-permissions.js`
Tests if a user has specific permissions.
```bash
cd api
node test-user-permissions.js
```

### 3. `api/test-permissions-endpoint.js`
Tests the permissions API endpoint with a token.
```bash
cd api
node test-permissions-endpoint.js <your-token>
```

### 4. `test-permissions-api.html`
Interactive HTML page to test permissions API from the browser.
- Open in browser
- It will automatically detect your token from localStorage
- Test various RBAC endpoints

## Technical Details

### The Permission Check Flow
1. Frontend makes request to `/api/rbac/permissions`
2. `authenticate` middleware verifies JWT token
3. `checkPermission('permissions', 'read')` middleware checks RBAC
4. RBAC service queries UserRole assignments
5. Returns effective permissions for the user

### State Admin Permissions
The `state_admin` role includes:
- `permissions.read` - View permission definitions ✅
- `permissions.manage` - Manage permissions ✅
- `roles.read` - View roles ✅
- `roles.create` - Create roles ✅
- `roles.update` - Update roles ✅
- `roles.delete` - Delete roles ✅
- `roles.assign` - Assign roles to users ✅
- Plus 78 other permissions for full system access

## Next Steps

1. **Restart the API server** - This is the quickest solution
2. **Clear browser cache** if issues persist
3. **Check browser console** for any other errors
4. **Use test-permissions-api.html** to verify the fix

## Files Modified/Created
- ✅ `api/fix-rbac-permissions.js` - RBAC fix script
- ✅ `api/test-user-permissions.js` - Permission testing script
- ✅ `api/test-permissions-endpoint.js` - API endpoint testing script
- ✅ `test-permissions-api.html` - Interactive testing page
- ✅ `FIX_RBAC_403_ERROR.md` - This documentation

## Verification
Run this command to verify permissions are working:
```bash
cd api
node test-user-permissions.js
```

Expected output:
```
✅ permissions.read               GRANTED
✅ roles.read                     GRANTED
✅ beneficiaries.read.all         GRANTED
✅ users.read.all                 GRANTED
```

All checks should show ✅ GRANTED.
