# RBAC Page Implementation Patterns

## Standard Pattern for All Pages

### 1. Import RBAC Hook
```typescript
import { useRBAC } from "@/hooks/useRBAC";
```

### 2. Define Permission Requirements
```typescript
const { hasAnyPermission, hasPermission } = useRBAC();

// View permissions (at least one required)
const canView = hasAnyPermission(['module.read.all', 'module.read.regional', 'module.read.own']);

// Action permissions (optional, for buttons)
const canCreate = hasPermission('module.create');
const canUpdate = hasAnyPermission(['module.update.all', 'module.update.regional']);
const canDelete = hasPermission('module.delete');
```

### 3. Add Access Denied UI
```typescript
if (!canView) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <IconComponent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-muted-foreground">
          You don't have permission to view this page.
        </p>
      </div>
    </div>
  );
}
```

### 4. Conditional Data Loading
```typescript
useEffect(() => {
  if (canView) {
    loadData();
  }
}, [canView]);
```

## Page-Specific Permissions

### Applications
```typescript
const canView = hasAnyPermission(['applications.read.all', 'applications.read.regional', 'applications.read.own']);
const canCreate = hasPermission('applications.create');
const canUpdate = hasPermission('applications.update.regional');
const canApprove = hasPermission('applications.approve');
```

### Beneficiaries
```typescript
const canView = hasAnyPermission(['beneficiaries.read.all', 'beneficiaries.read.regional', 'beneficiaries.read.own']);
const canCreate = hasPermission('beneficiaries.create');
const canUpdate = hasPermission('beneficiaries.update.regional');
```

### Budget
```typescript
const canView = hasAnyPermission(['finances.read.all', 'finances.read.regional']);
const canManage = hasPermission('finances.manage');
```

### Communications
```typescript
const canView = hasPermission('communications.send');
const canSend = hasPermission('communications.send');
```

### Locations
```typescript
const canView = hasPermission('settings.read');
const canUpdate = hasPermission('settings.update');
```

### Payment Tracking
```typescript
const canView = hasAnyPermission(['finances.read.all', 'finances.read.regional']);
```

### Payment Distribution
```typescript
const canView = hasAnyPermission(['finances.read.all', 'finances.read.regional']);
const canManage = hasPermission('finances.manage');
```

### Role Management
```typescript
const canView = hasPermission('roles.read');
const canCreate = hasPermission('roles.create');
const canUpdate = hasPermission('roles.update');
const canDelete = hasPermission('roles.delete');
const canAssign = hasPermission('roles.assign');
```

### Settings
```typescript
const canView = hasPermission('settings.read');
const canUpdate = hasPermission('settings.update');
```

### Upcoming Interviews
```typescript
const canView = hasAnyPermission(['applications.read.all', 'applications.read.regional']);
```

### User Management
```typescript
const canView = hasAnyPermission(['users.read.all', 'users.read.regional']);
const canCreate = hasPermission('users.create');
const canUpdate = hasAnyPermission(['users.update.all', 'users.update.regional']);
const canDelete = hasPermission('users.delete');
```

## Pages That Don't Need RBAC

- Auth.tsx (public)
- Login.tsx (public)
- BeneficiaryLogin.tsx (public)
- PublicSchemes.tsx (public)
- Index.tsx (landing page)
- NotFound.tsx (error page)
- Dashboard.tsx (all authenticated users)
- BeneficiaryDashboard.tsx (has own auth guard)
- BeneficiaryApplication.tsx (has own auth guard)
- BeneficiarySchemes.tsx (has own auth guard)
- ApplicationTracking.tsx (has own auth guard)
- DebugPermissions.tsx (debug tool)
- FormBuilder.tsx (admin tool, can add later)
