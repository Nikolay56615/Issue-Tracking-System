import { Link, Outlet } from 'react-router';
import { Routes } from '@/shared/constants/routes.ts';
import { LogoutButton } from '@/components/logout-button.tsx';

export const ProfileLayout = () => {
  return (
    <>
      <header
        className="flex h-15 w-screen items-center gap-4 border-b px-40 py-2"
      >
        <Link to={Routes.PROFILE}>
          <span className="cursor-pointer text-2xl font-extrabold">
            Issue Tracker
          </span>
        </Link>
        <Link to={Routes.LOGOUT} className="ml-auto h-full">
          <LogoutButton />
        </Link>
      </header>
      <Outlet />
    </>
  );
};
