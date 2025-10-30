import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface BeneficiaryAuthGuardProps {
  children: React.ReactNode;
}

export default function BeneficiaryAuthGuard({ children }: BeneficiaryAuthGuardProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('beneficiary_token');
    const userRole = localStorage.getItem('user_role');
    
    console.log('🔍 BeneficiaryAuthGuard - Token exists:', !!token);
    console.log('🔍 BeneficiaryAuthGuard - User role:', userRole);
    
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
    
    console.log('✅ BeneficiaryAuthGuard - Authentication successful');
  }, [navigate]);

  // Only render children if authenticated
  const token = localStorage.getItem('beneficiary_token');
  const userRole = localStorage.getItem('user_role');
  
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