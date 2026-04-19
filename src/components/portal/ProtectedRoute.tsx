import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "coach" | "admin" | "club_manager";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === "coach" && role !== "coach" && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === "admin" && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === "club_manager" && role !== "club_manager" && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Send to onboarding if not completed
  if (
    role === "player" &&
    profile &&
    !profile.onboarding_completed &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
