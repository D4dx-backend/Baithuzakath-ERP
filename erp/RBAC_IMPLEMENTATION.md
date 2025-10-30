# RBAC System Implementation

## Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented for the Baithuzzakath ERP system. The RBAC system provides fine-grained permission management with support for both predefined system roles and custom user-defined roles.

## Architecture

### Core Components

1. **Models**
   - `Role`: Defines roles with hierarchical levels and permissions
   - `Permission`: Granular permissions with conditions and dependencies
   - `UserRole`: Junction table managing user-role assignments with scope

2. **Services**
   - `rbacService`: Core RBAC business logic and permission checking
   - `authService`: Enhanced with RBAC integration

3. **Middleware**
   - `rbacMiddleware`: Advanced permission checking middleware
   - Enhanced `auth` middleware with RBAC integration

4. **Controllers & Routes**
   - `rbacController`: RBAC management endpoints
   - `rbacRoutes`: Protected routes for RBAC operations

5. **Frontend Components**
   - `useRBAC` hook: React hook for permission checking
   - `PermissionGate`: Component for conditional rendering
   - `RoleManagement`: Admin interface for role management

## Features

### 1. Hierarchical Role System

```
Level 0: Super Administrator (super_admin)
Level 1: State Administrator (state_admin)
Level 2: District Administrator (district_admin)
Level 3: Area Administrator (area_admin)
Level 4: Unit Administrator (unit_admin)
Level 5: Project Coordinator (project_coordinator)
Level 5: Scheme Coordinator (scheme_coordinator)
Level 6: Beneficiary (beneficiary)
```

### 2. Granular Permissions

Permissions follow the format: `{module}.{action}.{scope}`

Examples:
- `users.create` - Create users
- `users.read.regional` - Read users within assigned regions
- `applications.approve` - Approve applications
- `reports.export` - Export reports

### 3. Permission Scopes

- **Global**: System-wide access
- **Regional**: Access within assigned geographic regions
- **Project**: Access to specific projects
- **Scheme**: Access to specific schemes
- **Own**: Access to own resources only
- **Subordinate**: Access to subordinate users/resources

### 4. Advanced Features

- **Permission Dependencies**: Permissions can require other permissions
- **Time-based Restrictions**: Permissions can be limited to specific hours/days
- **IP Restrictions**: Permissions can be restricted by IP address
- **Rate Limiting**: Sensitive operations can be rate-limited
- **Audit Logging**: All permission checks and role changes are logged
- **Temporary Assignments**: Roles can be assigned with expiration dates
- **Permission Inheritance**: Roles can inherit permissions from parent roles

## Installation & Setup

### 1. Initialize RBAC System

```bash
# Initialize RBAC with default roles and permissions
npm run rbac:init
```

This will:
- Create all system permissions
- Create predefined system roles
- Create a super admin user (if none exists)
- Display system summary

### 2. Environment Variables

Ensure these environment variables are set:

```env
MONGODB_URI=mongodb://localhost:27017/baithuzzakath
JWT_SECRET=your-jwt-secret
NODE_ENV=development
```

### 3. Frontend Integration

Wrap your app with the RBAC provider:

```tsx
import { RBACProvider } from './hooks/useRBAC';

function App() {
  return (
    <RBACProvider>
      <YourAppComponents />
    </RBACProvider>
  );
}
```

## Usage Examples

### Backend Permission Checking

```javascript
// Protect routes with permissions
router.get('/users', 
  authenticate,
  RBACMiddleware.hasPermission('users.read.regional'),
  userController.getUsers
);

// Check multiple permissions
router.post('/sensitive-operation',
  authenticate,
  RBACMiddleware.hasAllPermissions(['finance.manage', 'audit.create']),
  RBACMiddleware.auditLog('sensitive_operation'),
  controller.sensitiveOperation
);

// Dynamic permission checking
router.put('/applications/:id',
  authenticate,
  RBACMiddleware.dynamicPermission(async (req) => {
    const application = await Application.findById(req.params.id);
    return application.status === 'draft' 
      ? 'applications.update.own' 
      : 'applications.approve';
  }),
  applicationController.updateApplication
);
```

### Frontend Permission Checking

```tsx
import { useRBAC, PermissionGate } from './hooks/useRBAC';

function UserManagement() {
  const { hasPermission, hasRole } = useRBAC();

  return (
    <div>
      {/* Conditional rendering based on permission */}
      <PermissionGate permission="users.create">
        <CreateUserButton />
      </PermissionGate>

      {/* Multiple permission options */}
      <PermissionGate 
        permissions={['users.read.all', 'users.read.regional']}
        fallback={<div>No access to user data</div>}
      >
        <UserTable />
      </PermissionGate>

      {/* Role-based rendering */}
      <PermissionGate role="super_admin">
        <SystemSettings />
      </PermissionGate>

      {/* Using hooks directly */}
      {hasPermission('reports.export') && (
        <ExportButton />
      )}
    </div>
  );
}
```

### Service Layer Usage

```javascript
const rbacService = require('./services/rbacService');

// Check user permission
const hasPermission = await rbacService.hasPermission(
  userId, 
  'applications.approve',
  { ip: req.ip, timestamp: new Date() }
);

// Get user permissions
const permissions = await rbacService.getUserPermissions(userId);

// Assign role to user
await rbacService.assignRole(
  userId, 
  roleId, 
  assignedBy, 
  {
    reason: 'Promotion to coordinator',
    scope: { regions: ['region1', 'region2'] },
    validUntil: new Date('2024-12-31')
  }
);
```

## API Endpoints

### Role Management

```
GET    /api/rbac/roles                    # Get all roles
GET    /api/rbac/roles/hierarchy          # Get role hierarchy
GET    /api/rbac/roles/:id                # Get role by ID
POST   /api/rbac/roles                    # Create custom role
PUT    /api/rbac/roles/:id                # Update role
DELETE /api/rbac/roles/:id                # Delete role
GET    /api/rbac/roles/:roleId/users      # Get users with role
```

### Permission Management

```
GET    /api/rbac/permissions              # Get all permissions
GET    /api/rbac/permissions/:id          # Get permission by ID
```

### User Role Assignment

```
POST   /api/rbac/users/:userId/roles      # Assign role to user
DELETE /api/rbac/users/:userId/roles/:roleId # Remove role from user
GET    /api/rbac/users/:userId/roles      # Get user roles
GET    /api/rbac/users/:userId/permissions # Get user permissions
POST   /api/rbac/users/:userId/check-permission # Check specific permission
```

### System Management

```
POST   /api/rbac/initialize               # Initialize RBAC system
GET    /api/rbac/stats                    # Get RBAC statistics
POST   /api/rbac/cleanup                  # Cleanup expired assignments
```

## Database Schema

### Role Schema

```javascript
{
  name: String,              // Unique role identifier
  displayName: String,       // Human-readable name
  description: String,       // Role description
  level: Number,            // Hierarchy level (0-10)
  category: String,         // admin, coordinator, staff, beneficiary
  type: String,             // system, custom
  permissions: [ObjectId],  // Array of permission IDs
  scopeConfig: {
    allowedScopeLevels: [String],
    defaultScopeLevel: String,
    allowMultipleScopes: Boolean,
    maxScopes: Number
  },
  constraints: {
    maxUsers: Number,
    requiresApproval: Boolean,
    isDeletable: Boolean,
    isModifiable: Boolean
  },
  isActive: Boolean,
  stats: {
    totalUsers: Number,
    activeUsers: Number
  }
}
```

### Permission Schema

```javascript
{
  name: String,              // Unique permission identifier
  displayName: String,       // Human-readable name
  description: String,       // Permission description
  module: String,           // Module (users, applications, etc.)
  category: String,         // create, read, update, delete, etc.
  scope: String,            // global, regional, project, etc.
  resource: String,         // Resource type
  action: String,           // Action type
  conditions: {
    timeRestrictions: {
      allowedHours: { start: Number, end: Number },
      allowedDays: [String]
    },
    ipRestrictions: {
      allowedIPs: [String],
      blockedIPs: [String]
    },
    requiresApproval: Boolean,
    rateLimit: {
      maxRequests: Number,
      timeWindow: Number
    }
  },
  dependencies: {
    requires: [ObjectId],     // Required permissions
    conflicts: [ObjectId],    // Conflicting permissions
    implies: [ObjectId]       // Implied permissions
  },
  securityLevel: String,    // public, internal, confidential, etc.
  auditRequired: Boolean
}
```

### UserRole Schema

```javascript
{
  user: ObjectId,           // User reference
  role: ObjectId,           // Role reference
  assignedBy: ObjectId,     // Who assigned the role
  scope: {
    regions: [ObjectId],    // Geographic scope
    projects: [ObjectId],   // Project scope
    schemes: [ObjectId]     // Scheme scope
  },
  additionalPermissions: [{
    permission: ObjectId,
    grantedBy: ObjectId,
    grantedAt: Date,
    expiresAt: Date
  }],
  restrictedPermissions: [{
    permission: ObjectId,
    restrictedBy: ObjectId,
    restrictedAt: Date,
    expiresAt: Date
  }],
  validFrom: Date,
  validUntil: Date,
  isActive: Boolean,
  isPrimary: Boolean,
  approvalStatus: String,   // pending, approved, rejected
  history: [{
    action: String,
    performedBy: ObjectId,
    performedAt: Date,
    details: Mixed
  }]
}
```

## Testing

Run the comprehensive RBAC test suite:

```bash
# Run all tests
npm test

# Run RBAC-specific tests
npm test -- --testPathPattern=rbac

# Run tests with coverage
npm test -- --coverage
```

The test suite covers:
- Role management operations
- Permission checking
- User role assignments
- Service layer functionality
- Error handling
- Security validations

## Maintenance

### Regular Tasks

1. **Cleanup Expired Assignments**
   ```bash
   npm run rbac:cleanup
   ```

2. **Monitor Permission Usage**
   ```javascript
   // Check permission statistics
   const stats = await Permission.find({}).select('name stats');
   ```

3. **Audit Role Assignments**
   ```javascript
   // Review recent role changes
   const recentChanges = await UserRole.find({
     'history.performedAt': { $gte: new Date(Date.now() - 7*24*60*60*1000) }
   }).populate('user role history.performedBy');
   ```

### Adding New Permissions

1. Define the permission in `rbacService.js`
2. Add to appropriate system roles
3. Update frontend components
4. Add tests
5. Update documentation

### Creating Custom Roles

1. Use the admin interface or API
2. Select appropriate permissions
3. Set constraints and scope
4. Test thoroughly
5. Document the role purpose

## Security Considerations

1. **Principle of Least Privilege**: Users get minimum required permissions
2. **Defense in Depth**: Multiple layers of permission checking
3. **Audit Trail**: All permission changes are logged
4. **Time-based Controls**: Sensitive operations restricted to business hours
5. **Rate Limiting**: Prevent abuse of sensitive operations
6. **IP Restrictions**: Additional security for high-privilege operations
7. **Regular Reviews**: Periodic audit of role assignments

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check user has required permission
   - Verify permission is active
   - Check time/IP restrictions
   - Verify role assignment is active

2. **Role Assignment Failures**
   - Check role constraints (max users, approval required)
   - Verify assigner has permission to assign role
   - Check for duplicate assignments

3. **Performance Issues**
   - Monitor permission check frequency
   - Consider caching for frequently checked permissions
   - Optimize database queries

### Debug Commands

```bash
# Check user permissions
node -e "
const rbacService = require('./src/services/rbacService');
rbacService.getUserPermissions('USER_ID').then(console.log);
"

# Verify role hierarchy
node -e "
const { Role } = require('./src/models');
Role.getRoleHierarchy().then(console.log);
"

# Check permission dependencies
node -e "
const { Permission } = require('./src/models');
Permission.findOne({name: 'PERMISSION_NAME'})
  .populate('dependencies.requires')
  .then(console.log);
"
```

## Migration Guide

### From Legacy System

1. **Backup existing data**
2. **Run RBAC initialization**: `npm run rbac:init`
3. **Map existing roles to new system**
4. **Update route protections**
5. **Update frontend components**
6. **Test thoroughly**
7. **Deploy incrementally**

### Version Updates

When updating the RBAC system:

1. **Review changelog**
2. **Run migration scripts**
3. **Update custom roles/permissions**
4. **Test all functionality**
5. **Update documentation**

## Contributing

When contributing to the RBAC system:

1. **Follow the steering guidelines** in `.kiro/steering/rbac-guidelines.md`
2. **Add comprehensive tests**
3. **Update documentation**
4. **Consider security implications**
5. **Review with security team**

## Support

For issues or questions:

1. **Check this documentation**
2. **Review test cases for examples**
3. **Check the steering guidelines**
4. **Contact the development team**

---

This RBAC system provides a robust, scalable, and secure foundation for managing user permissions in the Baithuzzakath ERP system. Regular maintenance and adherence to the guidelines will ensure continued security and functionality.