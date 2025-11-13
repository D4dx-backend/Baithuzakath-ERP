import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CompletedPayments() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to all payments with completed filter
    navigate('/payment-tracking/all?filter=completed');
  }, [navigate]);
  
  return null;
}
