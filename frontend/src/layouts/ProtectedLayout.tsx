import { useSelector } from 'react-redux';
import type { RootState } from '@/store/types.ts';
import { Navigate, Outlet } from 'react-router';

export const ProtectedLayout = () => {
  const { loading, isAuthenticated } = useSelector(
    (state: RootState) => state.authReducer
  );

  if (loading === 'pending') {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
};
