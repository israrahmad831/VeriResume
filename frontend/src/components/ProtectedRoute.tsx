import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactElement;
  requiredRole?: "jobseeker" | "hr" | "admin";
};

const roleDashboard: Record<string, string> = {
  jobseeker: "/dashboardjob",
  hr: "/dashboardhr",
  admin: "/dashboardadmin",
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role && user.role !== requiredRole) {
    // Redirect to correct dashboard
    const redirectPath = roleDashboard[user.role] || "/";
    return <Navigate to={redirectPath} replace />;
  }
  return children;
};

export default ProtectedRoute;
