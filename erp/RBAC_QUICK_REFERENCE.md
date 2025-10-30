# RBAC Quick Reference Guide

## For Developers: How to Use RBAC in Your Code

### Backend: Protecting API Routes

#### Method 1: Using hasPermission (Recommended)
```javascript
const { authenticate, hasPermission } = require('../middleware/auth');

router.get('/users',
  authenticate,
  hasPermission('users.read.regional'),
  userController.getUsers
);
```

#### Method 2: Using RBACMiddleware
```javascript
const { authenticate } = require('../middleware/auth');
const RBACMiddleware = require('../middleware/rbacMiddleware');

router.post('/donors',
  authenticate,
  RBACMiddleware.hasPermission('donors.create'),
  donorController.createDonor
);
```

#### Method 3: Using authorize (Role-based)
```javascript
const { authenticate, authorize } = require('../middleware/auth');

router.post('/schemes',
  authenticate,
  authorize('state_admin', 'district_admin'),
  schemeController.createScheme
);
```

#### Multiple Permissions (Any)
```javascript
router.get('/data',
  authenticate,
  RBACMiddleware.hasAnyPermission([
    'data.read.all',
    'data.read.regional'
  ]),
  controller.getData
);
```

#### Multiple Permissions (All Required)
```javascript
router.post('/sensitive',
  authenticate,
  RBACMiddleware.hasAllPermissions([
    'data.create',
    'data.approve'
  ]),
  controller.createSensitive
);
```

#### With Audit Logging
```javascript
router.delete('/users/:id',
  authenticate,
  hasPermission('users.delete'),
  RBACMiddleware.auditLog('user_deletion'),
  userController.deleteUser
);
```

### Frontend: Permission-Based Rendering

#### Method 1: Using PermissionGate Component
```typescript
import { PermissionGate } from '@/components/rbac/PermissionGate';

function UserManagement() {
  return (
    <div>
      <PermissionGate permission="users.create">
        <Button onClick={handleCreate}>Create User</Button>
      </PermissionGate>
      
      <PermissionGate permission="users.delete">
        <Button onClick={handleDelete}>Delete User</Button>
      </PermissionGate>
    </div>
  );
}
```

#### Method 2: Using useRBAC Hook
```typescript
import { useRBAC } from '@/hooks/useRBAC';

function UserList() {
  const { hasPermission, hasRole } = useRBAC();
  
  return (
    <div>
      {hasPermission('users.read.regional') && (
        <UserTable />
      )}
      
      {hasPermission('users.create') && (
        <CreateButton />
      )}
      
      {hasRole('super_admin') && (
        <AdminPanel />
      )}
    </div>
  );
}
```

#### Multiple Permissions (Any)
```typescript
<PermissionGate 
  permissions={['users.read.all', 'users.read.regional']}
>
  <UserList />
</PermissionGate>
```

#### Multiple Permissions (All Required)
```typescript
<PermissionGate 
  permissions={['users.create', 'roles.assign']}
  requireAll={true}
>
  <AdminUserCreation />
</PermissionGate>
```

#### With Fallback
```typescript
<PermissionGate 
  permission="users.read.regional"
  fallback={<AccessDenied />}
>
  <UserList />
</PermissionGate>
```

#### Show Error Message
```typescript
<PermissionGate 
  permission="users.delete"
  showError={true}
  errorMessage="You don't have permission to delete users"
>
  <DeleteButton />
</PermissionGate>
```

### Permission Naming Convention

Format: `{module}.{action}.{scope}`

#### Modules
- users
- roles
- permissions
- beneficiaries
- applications
- projects
- schemes
- locations
- reports
- finances
- settings
- audit
- dashboard
- donors
- documents

#### Actions
- create
- read
- update
- delete
- manage
- approve
- assign
- export
- configure

#### Scopes
- all (global access)
- regional (within assigned regions)
- assigned (assigned projects/schemes)
- own (own data only)

#### Examples
```
users.create                    // Create users
users.read.all                  // Read all users
users.read.regional             // Read users in assigned regions
users.update.own                // Update own profile
applications.approve            // Approve applications
reports.export                  // Export reports
finances.read.regional          // Read regional financial data
schemes.manage                  // Full scheme management
```

### Role Hierarchy

```
Level 0: super_admin           (Full system access)
Level 1: state_admin           (State-level access)
Level 2: district_admin        (District-level access)
Level 3: area_admin            (Area-level access)
Level 4: unit_admin            (Unit-level access)
Level 5: project_coordinator   (Project-specific access)
Level 5: scheme_coordinator    (Scheme-specific access)
Level 6: beneficiary           (Own data access)
```

### Common Patterns

#### Protect Entire Page
```typescript
export default function UsersPage() {
  const { hasPermission } = useRBAC();
  
  if (!hasPermission('users.read.regional')) {
    return <AccessDenied />;
  }
  
  return <UserManagement />;
}
```

#### Conditional Actions
```typescript
function UserCard({ user }) {
  const { hasPermission } = useRBAC();
  
  return (
    <Card>
      <CardContent>
        <h3>{user.name}</h3>
        <div className="actions">
          {hasPermission('users.update.regional') && (
            <Button onClick={() => handleEdit(user)}>Edit</Button>
          )}
          {hasPermission('users.delete') && (
            <Button onClick={() => handleDelete(user)}>Delete</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Role-Based Navigation
```typescript
import { useRoleNavigation } from '@/hooks/useRBAC';

function Navigation() {
  const { canAccessRoute } = useRoleNavigation();
  
  return (
    <nav>
      {canAccessRoute('/admin') && (
        <Link to="/admin">Admin Panel</Link>
      )}
      {canAccessRoute('/users') && (
        <Link to="/users">Users</Link>
      )}
    </nav>
  );
}
```

### API Client Usage

#### Making Authenticated Requests
```typescript
import { users, projects, schemes } from '@/lib/api';

// Get users
const response = await users.getAll({ page: 1, limit: 10 });

// Create project
const project = await projects.create({
  name: 'New Project',
  description: 'Project description'
});

// Update scheme
await schemes.update(schemeId, {
  status: 'active'
});
```

#### Checking Permissions via API
```typescript
import { apiClient } from '@/lib/api';

// Check if user has permission
const response = await apiClient.request(
  `/rbac/users/${userId}/check-permission`,
  {
    method: 'POST',
    body: JSON.stringify({ permission: 'users.create' })
  }
);

if (response.data.hasPermission) {
  // User has permission
}
```

### Error Handling

#### Backend
```javascript
// Permission denied
return res.status(403).json({
  success: false,
  message: 'Access denied. Required permission: users.create',
  requiredPermission: 'users.create'
});

// Authentication required
return res.status(401).json({
  success: false,
  message: 'Authentication required'
});
```

#### Frontend
```typescript
try {
  await users.create(userData);
  toast({
    title: "Success",
    description: "User created successfully"
  });
} catch (error: any) {
  if (error.message.includes('403')) {
    toast({
      title: "Permission Denied",
      description: "You don't have permission to create users",
      variant: "destructive"
    });
  } else {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive"
    });
  }
}
```

### Testing Permissions

#### Manual Testing
```bash
# Get user permissions
curl http://localhost:5001/api/rbac/users/USER_ID/permissions \
  -H "Authorization: Bearer TOKEN"

# Check specific permission
curl -X POST http://localhost:5001/api/rbac/users/USER_ID/check-permission \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permission": "users.create"}'

# Test protected endpoint
curl http://localhost:5001/api/users \
  -H "Authorization: Bearer TOKEN"
```

#### Debug Frontend Permissions
```typescript
// Add to component
const { userPermissions, userRoles, isLoading } = useRBAC();

useEffect(() => {
  console.log('User Permissions:', userPermissions);
  console.log('User Roles:', userRoles);
  console.log('Loading:', isLoading);
}, [userPermissions, userRoles, isLoading]);
```

### Common Mistakes to Avoid

#### ❌ Don't: Mix role and permission checks inconsistently
```typescript
// Frontend uses permission
hasPermission('users.create')

// Backend uses role
authorize('state_admin')
```

#### ✅ Do: Use permissions consistently
```typescript
// Both frontend and backend
hasPermission('users.create')
```

#### ❌ Don't: Forget backend protection
```typescript
// Only frontend check
<PermissionGate permission="users.delete">
  <DeleteButton />
</PermissionGate>

// No backend protection!
router.delete('/users/:id', userController.deleteUser);
```

#### ✅ Do: Protect both frontend and backend
```typescript
// Frontend
<PermissionGate permission="users.delete">
  <DeleteButton />
</PermissionGate>

// Backend
router.delete('/users/:id',
  authenticate,
  hasPermission('users.delete'),
  userController.deleteUser
);
```

#### ❌ Don't: Hardcode roles in business logic
```javascript
if (user.role === 'admin') {
  // Do something
}
```

#### ✅ Do: Use permission checks
```javascript
if (await rbacService.hasPermission(userId, 'users.manage')) {
  // Do something
}
```

### Quick Checklist for New Features

When adding a new feature:

- [ ] Define required permissions
- [ ] Add permissions to RBAC service
- [ ] Assign permissions to appropriate roles
- [ ] Add permission checks to backend routes
- [ ] Add permission checks to frontend components
- [ ] Test with different user roles
- [ ] Update documentation
- [ ] Run verification script

### Need Help?

1. Check `RBAC_VERIFICATION_GUIDE.md` for detailed verification steps
2. Run `node verify-rbac-system.cjs` to check for issues
3. Check `RBAC_SYSTEM_STATUS.md` for current system status
4. Review steering documents in `.kiro/steering/`

---

**Quick Links**:
- Full Guide: `RBAC_VERIFICATION_GUIDE.md`
- System Status: `RBAC_SYSTEM_STATUS.md`
- Verification Script: `verify-rbac-system.cjs`
- Fix Suggestions: `fix-rbac-routes.cjs`
