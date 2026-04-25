import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    navigate(user ? "/app" : "/auth", { replace: true });
  }, [user, loading, navigate]);
  return (
    <div className="min-h-screen bg-cloud flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-deep-navy border-t-transparent animate-spin" />
    </div>
  );
};

export default Index;
