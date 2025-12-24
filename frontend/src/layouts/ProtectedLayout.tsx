import { useSelector } from 'react-redux';
import type { RootState } from '@/store/types.ts';
import { Navigate, Outlet } from 'react-router';
import { Loader2 } from 'lucide-react';

export const ProtectedLayout = () => {
  const { loading, isAuthenticated } = useSelector(
    (state: RootState) => state.authReducer
  );

  if (loading === 'pending') {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
};
