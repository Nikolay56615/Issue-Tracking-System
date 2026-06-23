import {
  generatePath,
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useParams,
} from 'react-router';
import { Routes } from '@/shared/constants/routes.ts';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { LogoutButton } from '@/components/logout-button.tsx';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { CustomRole, PermissionKey } from '@/features/profile';
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
  const location = useLocation();
  const {
    currentRole: role,
    currentRoleProjectId,
    currentRoleLoading,
  } = useAppSelector((state) => state.projectConfig);
  const numericProjectId = Number(projectId);

  useEffect(() => {
    if (!projectId || Number.isNaN(numericProjectId)) return;

    dispatch(getCurrentUser());
    dispatch(fetchCurrentProjectRole(numericProjectId));
  }, [dispatch, numericProjectId, projectId]);

  const projectRole = currentRoleProjectId === numericProjectId ? role : null;
  const requiredPermission: PermissionKey = location.pathname.endsWith('/users')
    ? 'members.view'
    : location.pathname.endsWith('/settings')
      ? 'settings.manage'
      : 'issue.view';

  if (!projectId || Number.isNaN(numericProjectId)) {
    return <Navigate to={Routes.PROFILE} replace />;
  }

  if (
    currentRoleProjectId !== numericProjectId ||
    currentRoleLoading === 'idle' ||
    currentRoleLoading === 'pending'
  ) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  if (!hasPermission(projectRole, requiredPermission)) {
    return <Navigate to={Routes.PROFILE} replace />;
  }

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
          {hasPermission(projectRole, 'issue.view') && <NavLink
            to={generatePath(Routes.BOARD, { projectId })}
            className={({ isActive }) =>
              cn(isActive && 'bg-accent rounded-md', 'ml-5')
            }
          >
            <Button className="h-9 cursor-pointer" variant="ghost">
              Board
            </Button>
          </NavLink>}
          {hasPermission(projectRole, 'members.view') && <NavLink
            to={generatePath(Routes.USERS, { projectId })}
            className={({ isActive }) =>
              cn(isActive && 'bg-accent rounded-md')
            }
          >
            <Button className="h-9 cursor-pointer" variant="ghost">
              Users
            </Button>
          </NavLink>}
          {hasPermission(projectRole, 'issue.view') && <NavLink
            to={generatePath(Routes.TRASH, { projectId })}
            className={({ isActive }) =>
              cn(isActive && 'bg-accent rounded-md')
            }
          >
            <Button className="h-9 cursor-pointer" variant="ghost">
              Trash
            </Button>
          </NavLink>}
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
          <div className="ml-auto">
            <LogoutButton />
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
};
