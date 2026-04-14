import { Button } from '@/components/ui/button.tsx';
import { logout } from '@/features/auth';
import { Routes } from '@/shared/constants/routes.ts';
import { useAppDispatch } from '@/store';
import { useNavigate } from 'react-router';

export const LogoutButton = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate(Routes.AUTH, { replace: true });
  };

  return (
    <Button
      className="h-full cursor-pointer"
      variant="ghost"
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
};
