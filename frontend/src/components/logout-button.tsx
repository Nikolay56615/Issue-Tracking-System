import { Button } from '@/components/ui/button.tsx';
import { useAppDispatch } from '@/store';
import { useNavigate } from 'react-router';
import { logout } from '@/features/auth/model/auth.reducer.ts';

export const LogoutButton = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('authToken');
    navigate('/auth', { replace: true });
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
