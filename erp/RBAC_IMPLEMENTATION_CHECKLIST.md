# RBAC Implementation Checklist

Use this checklist when adding new features to ensure proper RBAC integration.

## ✅ System Status

- [x] RBAC service implemented
- [x] RBAC middleware implemented
- [x] Auth middleware implemented
- [x] RBAC routes implemented
- [x] Frontend RBAC hook implemented
- [x] Permission Gate component implemented
- [x] API client with RBAC methods
- [x] All existing routes protected
- [x] Documentation complete
- [x] Verification script available

## 📋 Checklist for Adding New Features

### Phase 1: Planning
- [ ] Define required permissions for the feature
- [ ] Determine which roles should have access
- [ ] Identify permission scopes (global, regional, own, etc.)
- [ ] Document permission requirements

### Phase 2: Backend Implementation

#### Define Permissions
- [ ] Add permissions to `rbacService.js` in `createSystemPermissions()`
- [ ] Follow naming convention: `{module}.{action}.{scope}`
- [ ] Set appropriate security level
- [ ] Add audit requirement if needed

Example:
```javascript
{
  name: 'documents.create',
  displayName: 'Create Documents',
  description: 'Upload and create new documents',
  module: 'documents',
  category: 'create',
  resource: 'document',
  action: 'create',
  scope: 'regional',
  securityLevel: 'internal'
}
```

#### Assign to Roles
- [ ] Add permissions to appropriate roles in `createSystemRoles()`
- [ ] Consider role hierarchy
- [ ] Test with different role levels

Example:
```javascript
{
  name: 'state_admin',
  permissions: [
    // ... existing permissions
    'documents.create',
    'documents.read.all',
    'documents.update.regional',
    'documents.delete'
  ]
}
```

#### Create Routes
- [ ] Create route file in `baithuzkath-api/src/routes/`
- [ ] Import authentication middleware
- [ ] Import permission middleware
- [ ] Apply authentication to all routes
- [ ] Add permission checks to each route

Example:
```javascript
const express = require('express');
const { authenticate, hasPermission } = require('../middleware/auth');
const RBACMiddleware = require('../middleware/rbacMiddleware');

const router = express.Router();
router.use(authenticate);

// Single permission
router.get('/',
  hasPermission('documents.read.regional'),
  controller.getDocuments
);

// Multiple permissions
router.post('/',
  RBACMiddleware.hasAnyPermission([
    'documents.create',
    'documents.manage'
  ]),
  controller.createDocument
);

// With audit logging
router.delete('/:id',
  hasPermission('documents.delete'),
  RBACMiddleware.auditLog('document_deletion'),
  controller.deleteDocument
);
```

#### Create Controller
- [ ] Implement controller methods
- [ ] Add scope-based filtering
- [ ] Handle permission errors
- [ ] Return appropriate status codes

Example:
```javascript
exports.getDocuments = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};
    
    // Apply scope-based filtering
    if (user.role !== 'super_admin' && user.role !== 'state_admin') {
      filter.region = { $in: user.adminScope.regions };
    }
    
    const documents = await Document.find(filter);
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

#### Register Routes
- [ ] Import routes in `app.js`
- [ ] Mount routes with appropriate prefix
- [ ] Test route registration

Example:
```javascript
const documentRoutes = require('./routes/documentRoutes');
app.use('/api/documents', documentRoutes);
```

### Phase 3: Frontend Implementation

#### Add API Methods
- [ ] Add methods to API client (`src/lib/api.ts`)
- [ ] Use consistent naming
- [ ] Include TypeScript types
- [ ] Handle errors properly

Example:
```typescript
export const documents = {
  getAll: (params?: any) => apiClient.request(`/documents${params ? `?${new URLSearchParams(params).toString()}` : ''}`),
  getById: (id: string) => apiClient.request(`/documents/${id}`),
  create: (data: any) => apiClient.request('/documents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiClient.request(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiClient.request(`/documents/${id}`, { method: 'DELETE' }),
};
```

#### Create Page Component
- [ ] Create page component in `src/pages/`
- [ ] Add loading state
- [ ] Add error handling
- [ ] Wrap with PermissionGate
- [ ] Add permission checks for actions

Example:
```typescript
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { useRBAC } from '@/hooks/useRBAC';

export default function DocumentsPage() {
  const { hasPermission } = useRBAC();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <PermissionGate permission="documents.read.regional">
      <div>
        <h1>Documents</h1>
        
        {hasPermission('documents.create') && (
          <Button onClick={handleCreate}>Create Document</Button>
        )}
        
        <DocumentList />
      </div>
    </PermissionGate>
  );
}
```

#### Add to Navigation
- [ ] Add menu item with permission check
- [ ] Update navigation component
- [ ] Test navigation visibility

Example:
```typescript
<PermissionGate permission="documents.read.regional">
  <NavLink to="/documents">
    <FileText className="mr-2" />
    Documents
  </NavLink>
</PermissionGate>
```

#### Register Route
- [ ] Add route to `App.tsx`
- [ ] Wrap with AuthGuard
- [ ] Test route protection

Example:
```typescript
<Route path="/documents" element={
  <AuthGuard>
    <Layout>
      <DocumentsPage />
    </Layout>
  </AuthGuard>
} />
```

### Phase 4: Testing

#### Backend Testing
- [ ] Test with super_admin role (should have full access)
- [ ] Test with state_admin role (should have regional access)
- [ ] Test with district_admin role (should have limited access)
- [ ] Test with beneficiary role (should have no access)
- [ ] Test without authentication (should return 401)
- [ ] Test with invalid token (should return 401)
- [ ] Test scope-based filtering

#### Frontend Testing
- [ ] Test permission-based rendering
- [ ] Test with different user roles
- [ ] Test loading states
- [ ] Test error handling
- [ ] Test navigation visibility
- [ ] Test action buttons visibility

#### Integration Testing
- [ ] Test complete user workflow
- [ ] Test permission changes
- [ ] Test role assignment
- [ ] Test token expiration
- [ ] Test concurrent users

### Phase 5: Documentation

- [ ] Document new permissions in code comments
- [ ] Update API documentation
- [ ] Add usage examples
- [ ] Update team documentation
- [ ] Add to permission reference

### Phase 6: Verification

- [ ] Run verification script: `node verify-rbac-system.cjs`
- [ ] Check for warnings or errors
- [ ] Fix any issues found
- [ ] Re-run verification

### Phase 7: Deployment

- [ ] Initialize RBAC system on server
- [ ] Verify permissions are created
- [ ] Test in staging environment
- [ ] Monitor for permission errors
- [ ] Deploy to production

## 🔍 Common Patterns

### Pattern 1: Simple CRUD with Regional Access
```javascript
// Backend
router.get('/', authenticate, hasPermission('module.read.regional'), controller.getAll);
router.post('/', authenticate, hasPermission('module.create'), controller.create);
router.put('/:id', authenticate, hasPermission('module.update.regional'), controller.update);
router.delete('/:id', authenticate, hasPermission('module.delete'), controller.delete);

// Frontend
<PermissionGate permission="module.read.regional">
  <DataList />
</PermissionGate>
```

### Pattern 2: Hierarchical Access
```javascript
// Backend - Allow multiple permission levels
router.get('/',
  authenticate,
  RBACMiddleware.hasAnyPermission([
    'module.read.all',
    'module.read.regional',
    'module.read.own'
  ]),
  controller.getAll
);

// Frontend
<PermissionGate permissions={['module.read.all', 'module.read.regional']}>
  <DataList />
</PermissionGate>
```

### Pattern 3: Sensitive Operations
```javascript
// Backend - Multiple checks + audit
router.post('/sensitive',
  authenticate,
  RBACMiddleware.hasAllPermissions([
    'module.create',
    'module.approve'
  ]),
  RBACMiddleware.auditLog('sensitive_operation'),
  RBACMiddleware.rateLimitSensitiveOperation(3, 60000),
  controller.sensitiveOperation
);

// Frontend
<PermissionGate 
  permissions={['module.create', 'module.approve']}
  requireAll={true}
>
  <SensitiveButton />
</PermissionGate>
```

### Pattern 4: Owner or Admin Access
```javascript
// Backend
const checkOwnerOrAdmin = async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);
  
  if (resource.createdBy.toString() === req.user._id.toString()) {
    return next(); // Owner
  }
  
  const hasAdminAccess = await rbacService.hasPermission(
    req.user._id, 
    'module.read.all'
  );
  
  if (hasAdminAccess) {
    return next(); // Admin
  }
  
  return res.status(403).json({ message: 'Access denied' });
};

router.get('/:id', authenticate, checkOwnerOrAdmin, controller.getById);
```

## ⚠️ Common Mistakes to Avoid

### ❌ Don't: Skip backend protection
```typescript
// Frontend only - INSECURE!
<PermissionGate permission="users.delete">
  <DeleteButton />
</PermissionGate>

// No backend protection!
router.delete('/users/:id', controller.deleteUser);
```

### ✅ Do: Protect both frontend and backend
```typescript
// Frontend
<PermissionGate permission="users.delete">
  <DeleteButton />
</PermissionGate>

// Backend
router.delete('/users/:id',
  authenticate,
  hasPermission('users.delete'),
  controller.deleteUser
);
```

### ❌ Don't: Mix authorization methods
```javascript
// Inconsistent!
router.get('/data1', authorize('admin'), controller.getData1);
router.get('/data2', hasPermission('data.read'), controller.getData2);
```

### ✅ Do: Use consistent authorization
```javascript
// Consistent!
router.get('/data1', hasPermission('data.read.all'), controller.getData1);
router.get('/data2', hasPermission('data.read.regional'), controller.getData2);
```

### ❌ Don't: Hardcode roles
```javascript
if (user.role === 'admin') {
  // Do something
}
```

### ✅ Do: Check permissions
```javascript
if (await rbacService.hasPermission(userId, 'module.manage')) {
  // Do something
}
```

## 📊 Verification Commands

```bash
# Run full verification
node verify-rbac-system.cjs

# View fix suggestions
node fix-rbac-routes.cjs

# Test specific endpoint
curl http://localhost:5001/api/endpoint \
  -H "Authorization: Bearer TOKEN"

# Check user permissions
curl http://localhost:5001/api/rbac/users/USER_ID/permissions \
  -H "Authorization: Bearer TOKEN"

# Initialize RBAC system
curl -X POST http://localhost:5001/api/rbac/initialize \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

## 📚 Reference Documents

- **RBAC_VERIFICATION_GUIDE.md** - Detailed verification procedures
- **RBAC_SYSTEM_STATUS.md** - Current system status
- **RBAC_QUICK_REFERENCE.md** - Quick reference for developers
- **RBAC_FIX_COMPLETE.md** - Recent fixes and improvements
- **rbac-guidelines.md** - Steering document for RBAC
- **Development Standards** - General development guidelines

## 🎯 Quick Reference

### Permission Naming
```
{module}.{action}.{scope}

Modules: users, roles, beneficiaries, applications, projects, schemes, etc.
Actions: create, read, update, delete, manage, approve, assign, export
Scopes: all, regional, assigned, own
```

### Role Hierarchy
```
0: super_admin
1: state_admin
2: district_admin
3: area_admin
4: unit_admin
5: project_coordinator / scheme_coordinator
6: beneficiary
```

### Common Permissions
```
users.create
users.read.regional
users.update.regional
users.delete
applications.read.regional
applications.approve
projects.read.assigned
schemes.manage
finances.read.regional
reports.export
```

---

**Last Updated**: October 28, 2025  
**Version**: 1.0  
**Status**: Complete and Verified ✅
