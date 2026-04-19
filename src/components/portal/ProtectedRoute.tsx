import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "coach" | "admin" | "club_manager";
  /** If true, only the "player" role can access this route. Other roles are
   *  redirected to their own home so coaches/clubs/admins don't land in player UI. */
  playerOnly?: boolean;
}

const ROLE_HOME: Record<string, string> = {
  coach: "/coach",
  admin: "/admin",
  club_manager: "/club",
  player: "/dashboard",
};

const ProtectedRoute = ({ children, requiredRole, playerOnly }: ProtectedRouteProps) => {
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
    return <Navigate to={ROLE_HOME[role || "player"] || "/dashboard"} replace />;
  }

  if (requiredRole === "admin" && role !== "admin") {
    return <Navigate to={ROLE_HOME[role || "player"] || "/dashboard"} replace />;
  }

  if (requiredRole === "club_manager" && role !== "club_manager" && role !== "admin") {
    return <Navigate to={ROLE_HOME[role || "player"] || "/dashboard"} replace />;
  }

  // Bounce non-players away from player-only screens so coaches/clubs see their own home.
  if (playerOnly && role && role !== "player") {
    return <Navigate to={ROLE_HOME[role]} replace />;
  }

  // Send to onboarding if not completed (players only).
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

