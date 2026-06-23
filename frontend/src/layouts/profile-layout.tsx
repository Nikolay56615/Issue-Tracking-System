import { Link, NavLink, Outlet } from 'react-router';
import { Routes } from '@/shared/constants/routes.ts';
import { LogoutButton } from '@/components/logout-button.tsx';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { getCurrentUser } from '@/features/profile/model/profile.actions.ts';

export const ProfileLayout = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.profile);

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

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
          {profile.globalAdmin && (
            <NavLink
              to={Routes.ADMIN}
              className={({ isActive }) =>
                cn(isActive && 'bg-accent rounded-md', 'ml-5')
              }
            >
              <Button className="h-9 cursor-pointer" variant="ghost">
                Admin
              </Button>
            </NavLink>
          )}
          <div className="ml-auto">
            <LogoutButton />
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
};
