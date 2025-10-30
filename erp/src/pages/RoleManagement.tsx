import { RoleManagement as RoleManagementComponent } from "@/components/rbac/RoleManagement";
import { useRBAC } from "@/hooks/useRBAC";
import { Shield } from "lucide-react";

export default function RoleManagement() {
  const { hasPermission } = useRBAC();
  
  // Permission check
  const canViewRoles = hasPermission('roles.read');
  
  if (!canViewRoles) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to view role management.
          </p>
        </div>
      </div>
    );
  }
  
  return <RoleManagementComponent />;
}