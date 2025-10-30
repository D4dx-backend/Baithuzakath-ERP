import React, { ReactNode } from 'react';
import { useRBAC } from '../../hooks/useRBAC';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Shield, ShieldX } from 'lucide-react';

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  fallback?: ReactNode;
  showError?: boolean;
  errorMessage?: string;
  children: ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  role,
  fallback,
  showError = false,
  errorMessage = 'You do not have permission to access this content.',
  children
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    hasRole, 
    isLoading 
  } = useRBAC();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Checking permissions...</span>
      </div>
    );
  }

  let hasAccess = true;

  if (role) {
    hasAccess = hasRole(role);
  } else if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <Alert variant="destructive">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
};

// Specialized components for common use cases
export const AdminOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate
    permissions={['users.read.regional', 'roles.read']}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

export const SuperAdminOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate
    role="super_admin"
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

export const BeneficiaryOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate
    role="beneficiary"
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

// Component for showing different content based on permissions
interface ConditionalRenderProps {
  conditions: Array<{
    permission?: string;
    permissions?: string[];
    role?: string;
    requireAll?: boolean;
    component: ReactNode;
  }>;
  fallback?: ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({ 
  conditions, 
  fallback 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useRBAC();

  for (const condition of conditions) {
    let hasAccess = true;

    if (condition.role) {
      hasAccess = hasRole(condition.role);
    } else if (condition.permission) {
      hasAccess = hasPermission(condition.permission);
    } else if (condition.permissions && condition.permissions.length > 0) {
      hasAccess = condition.requireAll 
        ? hasAllPermissions(condition.permissions)
        : hasAnyPermission(condition.permissions);
    }

    if (hasAccess) {
      return <>{condition.component}</>;
    }
  }

  return <>{fallback}</>;
};

// Permission status indicator
interface PermissionStatusProps {
  permission: string;
  showIcon?: boolean;
  className?: string;
}

export const PermissionStatus: React.FC<PermissionStatusProps> = ({ 
  permission, 
  showIcon = true,
  className = ""
}) => {
  const { hasPermission } = useRBAC();
  const granted = hasPermission(permission);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        granted ? (
          <Shield className="h-4 w-4 text-green-600" />
        ) : (
          <ShieldX className="h-4 w-4 text-red-600" />
        )
      )}
      <span className={granted ? 'text-green-600' : 'text-red-600'}>
        {granted ? 'Granted' : 'Denied'}
      </span>
    </div>
  );
};