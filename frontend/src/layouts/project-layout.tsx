import { generatePath, Link, NavLink, Outlet, useParams } from 'react-router';
import { Routes } from '@/shared/constants/routes.ts';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { LogoutButton } from '@/components/logout-button.tsx';
import { useEffect, useState } from 'react';
import type { CustomRole } from '@/features/profile';
import { getMyRole } from '@/features/board/api/api.board.ts';
import { hasPermission } from '@/features/project-config/model';

const canOpenSettings = (role: CustomRole | null) =>
  hasPermission(role, 'settings.manage');

export const ProjectLayout = () => {
  const { projectId } = useParams();
  const [role, setRole] = useState<CustomRole | null>(null);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;

    const loadRole = async () => {
      try {
        const response = await getMyRole(Number(projectId));
        if (!cancelled) setRole(response.role);
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
      <header className="border-b">
        <div
          className="mx-auto flex h-15 w-full max-w-7xl items-center gap-4 px-6"
        >
          <Link to={Routes.PROFILE}>
            <span className="cursor-pointer text-2xl font-extrabold">
              Issue Tracker
            </span>
          </Link>
          <NavLink
            to={generatePath(Routes.BOARD, { projectId })}
            className={({ isActive }) =>
              cn(isActive && 'bg-accent rounded-md', 'ml-5')
            }
          >
            <Button className="h-9 cursor-pointer" variant="ghost">
              Board
            </Button>
          </NavLink>
          <NavLink
            to={generatePath(Routes.USERS, { projectId })}
            className={({ isActive }) =>
              cn(isActive && 'bg-accent rounded-md')
            }
          >
            <Button className="h-9 cursor-pointer" variant="ghost">
              Users
            </Button>
          </NavLink>
          <NavLink
            to={generatePath(Routes.TRASH, { projectId })}
            className={({ isActive }) =>
              cn(isActive && 'bg-accent rounded-md')
            }
          >
            <Button className="h-9 cursor-pointer" variant="ghost">
              Trash
            </Button>
          </NavLink>
          {canOpenSettings(role) && (
            <NavLink
              to={generatePath(Routes.SETTINGS, { projectId })}
              className={({ isActive }) =>
                cn(isActive && 'bg-accent rounded-md')
              }
            >
              <Button className="h-9 cursor-pointer" variant="ghost">
                Settings
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
