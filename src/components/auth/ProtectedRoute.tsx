import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { StaffRoleType } from "../../types/database";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: StaffRoleType[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { session, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="sync-loading">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
