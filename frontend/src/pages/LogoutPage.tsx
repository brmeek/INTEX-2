import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/lib/authApi";
import { useAuth } from "@/context/AuthContext";

const LogoutPage = () => {
  const navigate = useNavigate();
  const { refreshAuthSession } = useAuth();

  useEffect(() => {
    const runLogout = async () => {
      try {
        await logoutUser();
      } finally {
        await refreshAuthSession();
        navigate("/", { replace: true });
      }
    };

    runLogout();
  }, [navigate, refreshAuthSession]);

  return (
    <main className="container py-16">
      <p className="text-sm text-muted-foreground">Signing out...</p>
    </main>
  );
};

export default LogoutPage;
