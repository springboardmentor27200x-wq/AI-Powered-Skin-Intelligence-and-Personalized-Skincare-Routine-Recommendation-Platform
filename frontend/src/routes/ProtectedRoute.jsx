import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <Card className="text-center p-6 border-rose-200 bg-rose-50/20">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-600 mt-1 mb-6">
            Your current role (<strong className="font-semibold">{user?.role}</strong>) does not have permission to view this administrative resource.
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return children;
}
