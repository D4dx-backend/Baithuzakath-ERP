import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Donors() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to All Donors page
    navigate('/donors/all', { replace: true });
  }, [navigate]);

  return null;
}
