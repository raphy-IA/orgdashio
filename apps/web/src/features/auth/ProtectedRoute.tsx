import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-600">Vérification de la session en cours...</p>
      </div>
    </div>
  );
}

/**
 * Route guard for authenticated users (Tenant Members & Admins)
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Route guard strictly reserved for Platform Super-Admins
 */
export function PlatformAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPlatformAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isPlatformAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * Route guard for public-only pages like /login and /register
 * If already logged in, redirects to the appropriate dashboard
 */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPlatformAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to={isPlatformAdmin ? '/platform/dashboard' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}
