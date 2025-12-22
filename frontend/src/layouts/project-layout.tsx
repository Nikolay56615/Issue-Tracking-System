import { generatePath, Link, NavLink, Outlet, useParams } from 'react-router';
import { Routes } from '@/shared/constants/routes.ts';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { LogoutButton } from '@/components/logout-button.tsx';

export const ProjectLayout = () => {
  const { projectId } = useParams();

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
        <NavLink
          to={generatePath(Routes.BOARD, { projectId })}
          className={({ isActive }) =>
            cn(isActive && 'bg-accent rounded-md', 'ml-5 h-full')
          }
        >
          <Button className="h-full cursor-pointer" variant="ghost">
            Board
          </Button>
        </NavLink>
        <NavLink
          to={generatePath(Routes.USERS, { projectId })}
          className={({ isActive }) =>
            cn(isActive && 'bg-accent rounded-md', 'h-full')
          }
        >
          <Button className="h-full cursor-pointer" variant="ghost">
            Users
          </Button>
        </NavLink>
        <Link to={Routes.LOGOUT} className="ml-auto h-full">
          <LogoutButton />
        </Link>
      </header>
      <Outlet />
    </>
  );
};
