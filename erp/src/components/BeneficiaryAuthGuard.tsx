import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface BeneficiaryAuthGuardProps {
  children: React.ReactNode;
  requireVerification?: boolean; // If true, requires profile to be completed
}

export default function BeneficiaryAuthGuard({ 
  children, 
  requireVerification = true 
}: BeneficiaryAuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('beneficiary_token');
    const adminToken = localStorage.getItem('token');
    const userRole = localStorage.getItem('user_role');
    const userStr = localStorage.getItem('beneficiary_user');
    
    console.log('🔍 BeneficiaryAuthGuard - Beneficiary token exists:', !!token);
    console.log('🔍 BeneficiaryAuthGuard - Admin token exists:', !!adminToken);
    console.log('🔍 BeneficiaryAuthGuard - User role:', userRole);
    
    // If user has admin token but not beneficiary token, they shouldn't be here
    if (adminToken && !token) {
      console.log('⚠️ BeneficiaryAuthGuard - Admin user accessing beneficiary route, redirecting to admin dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Check authentication - must have beneficiary token AND user_role
    if (!token || userRole !== 'beneficiary') {
      console.log('❌ BeneficiaryAuthGuard - Authentication failed, redirecting to login');
      toast({
        title: "Authentication Required",
        description: "Please login to access this page",
        variant: "destructive",
      });
      navigate('/beneficiary-login', { replace: true });
      return;
    }
    
    // Check profile completion if required
    if (requireVerification && userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // If user is not verified and not already on profile completion page
        if (!user.isVerified && location.pathname !== '/beneficiary/profile-completion') {
          console.log('⚠️ BeneficiaryAuthGuard - Profile incomplete, redirecting to profile completion');
          toast({
            title: "Complete Your Profile",
            description: "Please complete your profile to continue",
          });
          navigate('/beneficiary/profile-completion', { replace: true });
          return;
        }
        
        // If user is verified but trying to access profile completion page
        if (user.isVerified && location.pathname === '/beneficiary/profile-completion') {
          console.log('✅ BeneficiaryAuthGuard - Profile already complete, redirecting to dashboard');
          navigate('/beneficiary/dashboard', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    console.log('✅ BeneficiaryAuthGuard - Authentication successful');
  }, [navigate, location.pathname, requireVerification]);

  // Only render children if authenticated as beneficiary
  const token = localStorage.getItem('beneficiary_token');
  const adminToken = localStorage.getItem('token');
  const userRole = localStorage.getItem('user_role');
  
  // If user has admin token but not beneficiary token, redirect to admin dashboard
  if (adminToken && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }
  
  if (!token || userRole !== 'beneficiary') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}