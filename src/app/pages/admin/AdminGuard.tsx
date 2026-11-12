// src/app/pages/admin/AdminGuard.tsx
import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useApp } from '../../context/AppContext';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { userRole, loading } = useApp();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return <Navigate to={userRole ? `/${userRole}` : '/auth/login'} replace />;
  }

  return <>{children}</>;
}
