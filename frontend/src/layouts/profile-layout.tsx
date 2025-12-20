import { Link, Outlet } from 'react-router';
import { Button } from '@/components/ui/button.tsx';
import { Routes } from '@/shared/constants/routes.ts';

export const ProfileLayout = () => {
  return (
    <div className="h-screen">
      <header
        className="flex h-15 w-screen items-center gap-4 border-b px-40 py-2"
      >
        <Link to={Routes.PROFILE}>
          <span className="cursor-pointer text-2xl font-extrabold">
            Issue Tracker
          </span>
        </Link>
        <Link to={Routes.LOGOUT} className="ml-auto h-full">
          <Button className="h-full cursor-pointer" variant="ghost">
            Logout
          </Button>
        </Link>
      </header>
      <Outlet />
    </div>
  );
};
