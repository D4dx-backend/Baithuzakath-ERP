import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function UpcomingPayments() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to all payments with upcoming filter
    navigate('/payment-tracking/all?filter=upcoming');
  }, [navigate]);
  
  return null;
}
