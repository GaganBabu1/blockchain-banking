import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Usage: <ProtectedRoute><DashboardPage /></ProtectedRoute>
// Usage for admin: <ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { isLoggedIn, isAdmin } = useAuth();
  const [hasToken, setHasToken] = useState(!!localStorage.getItem('authToken'));

  // Check for token in localStorage as a fallback
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('authToken');
      setHasToken(!!token);
    };

    // Check immediately
    checkToken();

    // Re-check on storage changes (other tabs/windows)
    window.addEventListener('storage', checkToken);
    return () => window.removeEventListener('storage', checkToken);
  }, []);

  // If user is not logged in but token exists, it might be loading still
  if (!isLoggedIn && !hasToken) {
    return <Navigate to={adminOnly ? "/admin/login" : "/login"} replace />;
  }

  // If token exists but user isn't loaded yet, show loading
  if (!isLoggedIn && hasToken) {
    // User state hasn't loaded from localStorage yet, wait a moment
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If admin-only route and user is not admin, redirect
  if (adminOnly && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
