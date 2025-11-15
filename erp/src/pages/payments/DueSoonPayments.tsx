import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DueSoonPayments() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to all payments with due soon filter
    navigate('/payment-tracking/all?filter=due-soon');
  }, [navigate]);
  
  return null;
}
