# RBAC System Verification Guide

## Overview
This document provides a comprehensive verification checklist to ensure RBAC (Role-Based Access Control), API services, and user role permissions are working correctly with no conflicts.

## System Architecture

### Backend Components
1. **RBAC Service** (`baithuzkath-api/src/services/rbacService.js`)
   - Manages roles, permissions, and user role assignments
   - Provides permission checking logic
   - Handles role hierarchy

2. **RBAC Middleware** (`baithuzkath-api/src/middleware/rbacMiddleware.js`)
   - `hasPermission(permissionName)` - Check single permission
   - `hasAnyPermission(permissions)` - Check if user has any of the permissions
   - `hasAllPermissions(permissions)` - Check if user has all permissions
   - `checkResourceScope(resourceType)` - Validate scope-based access
   - `auditLog(operation)` - Log sensitive operations

3. **Auth Middleware** (`baithuzkath-api/src/middleware/auth.js`)
   - `authenticate` - Verify JWT token
   - `authorize(...roles)` - Check user roles
   - `hasPermission(permissionName)` - Permission check wrapper
   - `checkPermission(resource, action)` - Resource-action permission check

4. **RBAC Routes** (`baithuzkath-api/src/routes/rbacRoutes.js`)
   - `/api/rbac/roles` - Role management
   - `/api/rbac/permissions` - Permission management
   - `/api/rbac/users/:userId/roles` - User role assignments
   - `/api/rbac/users/:userId/permissions` - User permissions

### Frontend Components
1. **RBAC Hook** (`src/hooks/useRBAC.tsx`)
   - `hasPermission(permissionName)` - Check single permission
   - `hasAnyPermission(permissions)` - Check any permission
   - `hasAllPermissions(permissions)` - Check all permissions
   - `hasRole(roleName)` - Check user role
   - `getUserRole()` - Get primary user role

2. **Permission Gate** (`src/components/rbac/PermissionGate.tsx`)
   - Conditional rendering based on permissions
   - Role-based rendering
   - Fallback and error handling

3. **API Client** (`src/lib/api.ts`)
   - Centralized API communication
   - Automatic token management
   - Type-safe API calls

## Verification Checklist

### 1. Backend RBAC System

#### ✅ RBAC Service Verification
```bash
# Test RBAC initialization
curl -X POST http://localhost:5001/api/rbac/initialize \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"

# Expected: Success message with roles and permissions created
```

#### ✅ Permission System
- [ ] All system permissions are created
- [ ] Permissions follow naming convention: `{module}.{action}.{scope}`
- [ ] Permission scopes are correctly defined (global, regional, own, etc.)
- [ ] Security levels are properly assigned

#### ✅ Role System
- [ ] All system roles are created (super_admin, state_admin, district_admin, etc.)
- [ ] Role hierarchy is correct (level 0-6)
- [ ] Role permissions are properly assigned
- [ ] Role constraints are enforced (maxUsers, requiresApproval, etc.)

#### ✅ Middleware Integration
Check that routes use appropriate middleware:

```javascript
// ✅ CORRECT - Using RBAC middleware
router.get('/donors', 
  authenticate,
  RBACMiddleware.hasPermission('donors.read.regional'),
  donorController.getDonors
);

// ✅ CORRECT - Using auth middleware with permission check
router.get('/users',
  authenticate,
  hasPermission('users.read.regional'),
  userController.getUsers
);

// ❌ INCORRECT - Missing permission check
router.get('/sensitive-data',
  authenticate,
  controller.getData
);
```

### 2. Frontend RBAC Integration

#### ✅ RBAC Context Setup
Verify in `App.tsx` or main entry:
```typescript
<AuthProvider>
  <RBACProvider>
    <App />
  </RBACProvider>
</AuthProvider>
```

#### ✅ Permission-Based Rendering
```typescript
// ✅ CORRECT - Using PermissionGate
<PermissionGate permission="users.create">
  <CreateUserButton />
</PermissionGate>

// ✅ CORRECT - Using useRBAC hook
const { hasPermission } = useRBAC();
if (hasPermission('users.delete')) {
  // Show delete button
}

// ❌ INCORRECT - No permission check
<DeleteButton onClick={handleDelete} />
```

#### ✅ API Integration
```typescript
// ✅ CORRECT - Using centralized API client
import { users } from '@/lib/api';
const response = await users.getAll({ page: 1, limit: 10 });

// ❌ INCORRECT - Direct fetch without API client
const response = await fetch('/api/users');
```

### 3. Route Protection Verification

#### Backend Routes
Check each route file for proper protection:

| Route File | Authentication | Authorization | Status |
|------------|---------------|---------------|--------|
| userRoutes.js | ✅ authenticate | ✅ hasPermission | ✅ |
| donorRoutes.js | ✅ authenticate | ✅ RBACMiddleware | ✅ |
| schemeRoutes.js | ✅ authenticate | ✅ authorize | ✅ |
| applicationRoutes.js | ✅ authenticate | ✅ authorize | ✅ |
| budgetRoutes.js | ✅ authenticate | ⚠️ Missing | ⚠️ |
| dashboardRoutes.js | ✅ authenticate | ⚠️ Missing | ⚠️ |

**Action Required**: Add permission checks to routes marked with ⚠️

### 4. Permission Conflicts Detection

#### Common Conflicts to Check:

1. **Multiple Middleware Patterns**
   ```javascript
   // ❌ CONFLICT - Using both authorize and hasPermission
   router.get('/data',
     authenticate,
     authorize('admin'),
     hasPermission('data.read'),
     controller.getData
   );
   
   // ✅ CORRECT - Use one consistent pattern
   router.get('/data',
     authenticate,
     hasPermission('data.read.regional'),
     controller.getData
   );
   ```

2. **Frontend-Backend Permission Mismatch**
   ```typescript
   // Frontend
   <PermissionGate permission="users.create">
     <CreateButton />
   </PermissionGate>
   
   // Backend - Must match!
   router.post('/users',
     authenticate,
     hasPermission('users.create'), // ✅ Matches frontend
     controller.createUser
   );
   ```

3. **Role vs Permission Checks**
   ```javascript
   // ❌ INCONSISTENT - Mixing role and permission checks
   // Frontend uses permission
   hasPermission('users.create')
   
   // Backend uses role
   authorize('state_admin')
   
   // ✅ CONSISTENT - Use permissions everywhere
   hasPermission('users.create')
   ```

### 5. API Endpoint Testing

#### Test User Permissions
```bash
# Get user roles
curl http://localhost:5001/api/rbac/users/USER_ID/roles \
  -H "Authorization: Bearer TOKEN"

# Get user permissions
curl http://localhost:5001/api/rbac/users/USER_ID/permissions \
  -H "Authorization: Bearer TOKEN"

# Check specific permission
curl -X POST http://localhost:5001/api/rbac/users/USER_ID/check-permission \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permission": "users.create"}'
```

#### Test Protected Endpoints
```bash
# Test with valid permission
curl http://localhost:5001/api/users \
  -H "Authorization: Bearer VALID_TOKEN"
# Expected: 200 OK with user list

# Test without permission
curl http://localhost:5001/api/users \
  -H "Authorization: Bearer LIMITED_TOKEN"
# Expected: 403 Forbidden

# Test without authentication
curl http://localhost:5001/api/users
# Expected: 401 Unauthorized
```

### 6. Frontend Permission Flow

#### Verify Permission Loading
1. User logs in
2. AuthContext stores user data
3. RBACProvider fetches user roles and permissions
4. Components use useRBAC hook to check permissions
5. PermissionGate components conditionally render

#### Debug Permission Issues
```typescript
// Add to component for debugging
const { userPermissions, userRoles, isLoading } = useRBAC();
console.log('User Permissions:', userPermissions);
console.log('User Roles:', userRoles);
console.log('Loading:', isLoading);
```

### 7. Common Issues and Solutions

#### Issue 1: Frontend shows button but API returns 403
**Cause**: Frontend permission check doesn't match backend
**Solution**: Ensure permission names match exactly

```typescript
// Frontend
<PermissionGate permission="users.create">

// Backend
hasPermission('users.create')
```

#### Issue 2: User has role but no permissions
**Cause**: Role not properly assigned or permissions not loaded
**Solution**: 
1. Check role assignment in database
2. Verify role has permissions attached
3. Check RBAC initialization

```bash
# Re-initialize RBAC system
curl -X POST http://localhost:5001/api/rbac/initialize \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

#### Issue 3: Permission check always fails
**Cause**: User ID mismatch or token issues
**Solution**:
1. Verify token contains correct user ID
2. Check user exists in database
3. Verify user has active role assignments

```javascript
// Debug middleware
console.log('User ID:', req.user._id);
console.log('Token User:', decoded.userId);
```

#### Issue 4: RBAC endpoints return 404
**Cause**: Routes not properly mounted
**Solution**: Verify in `app.js`:
```javascript
const rbacRoutes = require('./routes/rbacRoutes');
app.use('/api/rbac', rbacRoutes);
```

### 8. Security Audit Checklist

- [ ] All sensitive routes have authentication
- [ ] All admin routes have permission checks
- [ ] No hardcoded roles in business logic
- [ ] Audit logging enabled for sensitive operations
- [ ] Rate limiting on authentication endpoints
- [ ] Token expiration properly handled
- [ ] Permission checks on both frontend and backend
- [ ] Scope-based access control implemented
- [ ] Role hierarchy enforced
- [ ] User can only access their own data or authorized data

### 9. Performance Optimization

#### Cache User Permissions
```typescript
// Frontend - Already implemented in useRBAC
const [userPermissions, setUserPermissions] = useState<Permission[]>([]);

// Backend - Consider caching
const cachedPermissions = await redis.get(`user:${userId}:permissions`);
```

#### Minimize Permission Checks
```typescript
// ❌ BAD - Multiple checks
if (hasPermission('users.read')) { }
if (hasPermission('users.update')) { }
if (hasPermission('users.delete')) { }

// ✅ GOOD - Single check with multiple permissions
const permissions = ['users.read', 'users.update', 'users.delete'];
if (hasAnyPermission(permissions)) { }
```

### 10. Migration and Updates

#### Adding New Permissions
1. Add to `rbacService.js` in `createSystemPermissions()`
2. Assign to appropriate roles in `createSystemRoles()`
3. Run initialization script
4. Update frontend permission checks
5. Test thoroughly

#### Adding New Roles
1. Define role in `createSystemRoles()`
2. Assign appropriate permissions
3. Update role hierarchy if needed
4. Add to frontend role checks
5. Test role assignment and permissions

## Testing Script

Create a test file to verify RBAC:

```javascript
// test-rbac.js
const rbacService = require('./src/services/rbacService');

async function testRBAC() {
  try {
    // Test 1: Initialize RBAC
    console.log('Test 1: Initializing RBAC...');
    await rbacService.initializeRBAC();
    console.log('✅ RBAC initialized');

    // Test 2: Check user permissions
    console.log('\nTest 2: Checking user permissions...');
    const permissions = await rbacService.getUserPermissions('USER_ID');
    console.log('✅ User has', permissions.length, 'permissions');

    // Test 3: Check specific permission
    console.log('\nTest 3: Checking specific permission...');
    const hasPermission = await rbacService.hasPermission('USER_ID', 'users.create');
    console.log('✅ Has users.create:', hasPermission);

    // Test 4: Get role hierarchy
    console.log('\nTest 4: Getting role hierarchy...');
    const hierarchy = await rbacService.getRoleHierarchy();
    console.log('✅ Role hierarchy:', hierarchy.length, 'roles');

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRBAC();
```

## Monitoring and Maintenance

### Regular Checks
1. Weekly: Review audit logs for permission violations
2. Monthly: Check for expired role assignments
3. Quarterly: Review and update permissions as needed
4. Annually: Full RBAC system audit

### Cleanup Tasks
```bash
# Cleanup expired role assignments
curl -X POST http://localhost:5001/api/rbac/cleanup \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Conclusion

This verification guide ensures:
- ✅ RBAC system is properly initialized
- ✅ Permissions are consistently checked on frontend and backend
- ✅ No conflicts between different authorization methods
- ✅ API endpoints are properly protected
- ✅ User roles and permissions work correctly
- ✅ Security best practices are followed

For any issues, refer to the troubleshooting section or contact the development team.
