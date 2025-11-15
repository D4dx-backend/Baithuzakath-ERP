import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProcessingPayments() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to all payments with processing filter
    navigate('/payment-tracking/all?filter=processing');
  }, [navigate]);
  
  return null;
}
