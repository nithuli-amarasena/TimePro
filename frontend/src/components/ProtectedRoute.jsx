import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * 1. Checks AuthContext for the current user session.
 * 2. If session is loading, returns nothing (prevents "flash" of login screen).
 * 3. If no user, redirects to /login and saves the attempted URL in 'location.state'.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // While the session is being verified with Flask, we show nothing or a spinner
    return null; 
  }

  if (!user) {
    // Redirect to login, but store the location they were trying to reach
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;