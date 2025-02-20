import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to appropriate dashboard if role doesn't match
    return (
      <Navigate
        to={user.role === "admin" ? "/admin-dashboard" : "/user-console"}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
