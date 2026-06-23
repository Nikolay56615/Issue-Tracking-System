import { generatePath, Link, NavLink, Outlet, useParams } from 'react-router';
import { Routes } from '@/shared/constants/routes.ts';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { LogoutButton } from '@/components/logout-button.tsx';
import { useEffect } from 'react';
import type { CustomRole } from '@/features/profile';
import {
  fetchCurrentProjectRole,
  hasPermission,
} from '@/features/project-config/model';
import { useAppDispatch, useAppSelector } from '@/store';
import { getCurrentUser } from '@/features/profile/model/profile.actions.ts';

const canOpenSettings = (role: CustomRole | null) =>
  hasPermission(role, 'settings.manage');

export const ProjectLayout = () => {
  const { projectId } = useParams();
  const dispatch = useAppDispatch();
  const { currentRole: role, currentRoleProjectId } = useAppSelector(
    (state) => state.projectConfig
  );
  const { profile } = useAppSelector((state) => state.profile);
  const numericProjectId = Number(projectId);

  useEffect(() => {
    if (!projectId || Number.isNaN(numericProjectId)) return;

    dispatch(getCurrentUser());
    dispatch(fetchCurrentProjectRole(numericProjectId));
  }, [dispatch, numericProjectId, projectId]);

  const projectRole = currentRoleProjectId === numericProjectId ? role : null;

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
          {canOpenSettings(projectRole) && (
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
          {profile.globalAdmin && (
            <NavLink
              to={Routes.ADMIN}
              className={({ isActive }) =>
                cn(isActive && 'bg-accent rounded-md')
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
