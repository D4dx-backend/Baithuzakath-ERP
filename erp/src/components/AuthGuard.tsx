import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { getUserRole } = useRBAC();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Check both React state and localStorage as fallback
  const hasToken = isAuthenticated || (localStorage.getItem('token') && localStorage.getItem('user'));
  
  if (!hasToken) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is a beneficiary - use actual user object, not localStorage
  const actualUserRole = user?.role || (user ? JSON.parse(localStorage.getItem('user') || '{}').role : null);
  const rbacRole = getUserRole();
  const beneficiaryToken = localStorage.getItem('beneficiary_token');
  
  // Only redirect if user is actually a beneficiary (check actual user data, not stale localStorage)
  const isBeneficiary = actualUserRole === 'beneficiary' || rbacRole?.name === 'beneficiary' || beneficiaryToken;
  
  if (isBeneficiary && !beneficiaryToken) {
    // User has beneficiary role but no beneficiary token - clear stale data
    // This shouldn't happen for admin users, but clear anyway to be safe
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'beneficiary') {
          // Clear stale beneficiary data
          localStorage.removeItem('user_role');
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
  
  if (isBeneficiary && beneficiaryToken) {
    // Beneficiary trying to access admin routes - redirect to beneficiary dashboard
    if (location.pathname !== '/beneficiary/dashboard' && 
        location.pathname !== '/beneficiary/schemes' && 
        location.pathname !== '/beneficiary/profile-completion' &&
        !location.pathname.startsWith('/beneficiary/')) {
      return <Navigate to="/beneficiary/dashboard" replace />;
    }
  }

  return <>{children}</>;
}