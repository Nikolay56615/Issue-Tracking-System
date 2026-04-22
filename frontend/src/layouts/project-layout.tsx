import { generatePath, Link, NavLink, Outlet, useParams } from 'react-router';
import { Routes } from '@/shared/constants/routes.ts';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { LogoutButton } from '@/components/logout-button.tsx';
import { useEffect, useState } from 'react';
import type { UserRole } from '@/features/profile';
import { getMyRole } from '@/features/board/api/api.board.ts';

const canOpenSettings = (role: UserRole | null) =>
  role === 'ADMIN' || role === 'OWNER';

export const ProjectLayout = () => {
  const { projectId } = useParams();
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;

    const loadRole = async () => {
      try {
        const response = await getMyRole(Number(projectId));
        if (!cancelled) setRole(response);
      } catch {
        if (!cancelled) setRole(null);
      }
    };

    loadRole();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

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
        <NavLink
          to={generatePath(Routes.TRASH, { projectId })}
          className={({ isActive }) =>
            cn(isActive && 'bg-accent rounded-md', 'h-full')
          }
        >
          <Button className="h-full cursor-pointer" variant="ghost">
            Trash
          </Button>
        </NavLink>
        {canOpenSettings(role) && (
          <NavLink
            to={generatePath(Routes.SETTINGS, { projectId })}
            className={({ isActive }) =>
              cn(isActive && 'bg-accent rounded-md', 'h-full')
            }
          >
            <Button className="h-full cursor-pointer" variant="ghost">
              Settings
            </Button>
          </NavLink>
        )}
        <div className="ml-auto h-full">
          <LogoutButton />
        </div>
      </header>
      <Outlet />
    </>
  );
};
