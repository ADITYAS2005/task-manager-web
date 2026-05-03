import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageSpinner } from './Spinner';

export default function ProtectedRoute({ requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
