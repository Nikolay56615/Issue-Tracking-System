import { Link, Outlet } from 'react-router';
import { Routes } from '@/shared/constants/routes.ts';
import { LogoutButton } from '@/components/logout-button.tsx';

export const ProfileLayout = () => {
  return (
    <>
      <header className="border-b">
        <div
          className="mx-auto flex h-15 w-full max-w-7xl items-center gap-4 px-6"
        >
          <Link to={Routes.PROFILE}>
            <span className="cursor-pointer text-2xl font-extrabold">
              Issue Tracker
            </span>
          </Link>
          <div className="ml-auto">
            <LogoutButton />
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
};
