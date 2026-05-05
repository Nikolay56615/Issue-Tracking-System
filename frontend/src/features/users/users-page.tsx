import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserCard } from '@/features/users/ui/user-card.tsx';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  getProjectUsers,
  removeProjectUser,
  updateProjectUserRole,
} from '@/features/users/model/users.actions.ts';
import { fetchProjectConfig, hasPermission } from '@/features/project-config/model';
import { getMyRole } from '@/features/board/api/api.board.ts';
import type { CustomRole } from '@/features/profile';

export const UsersPage = () => {
  const params = useParams();
  const projectId = Number(params.projectId);
  const dispatch = useAppDispatch();
  const { users, loading, roleUpdateLoadingByUserId, removingByUserId, error } =
    useAppSelector((state) => state.users);
  const { config: projectConfig } = useAppSelector(
    (state) => state.projectConfig
  );
  const [currentRole, setCurrentRole] = useState<CustomRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    dispatch(getProjectUsers(projectId));
    dispatch(fetchProjectConfig(projectId));
  }, [dispatch, projectId]);

  useEffect(() => {
    let cancelled = false;

    const loadRole = async () => {
      setRoleLoading(true);
      try {
        const response = await getMyRole(projectId);
        if (!cancelled) {
          setCurrentRole(response.role);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error('Failed to load current role:', loadError);
          setCurrentRole(null);
        }
      } finally {
        if (!cancelled) {
          setRoleLoading(false);
        }
      }
    };

    loadRole();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const canManageRoles = hasPermission(currentRole, 'members.assignRole');
  const canRemove = hasPermission(currentRole, 'members.remove');
  const availableRoles = projectConfig?.roles ?? [];

  if (loading === 'pending' || roleLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8">Error: {error}</div>;
  }

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div
        className="mx-auto grid w-full max-w-320 gap-4 md:grid-cols-2
          xl:grid-cols-3"
      >
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            availableRoles={availableRoles}
            canManageRoles={canManageRoles}
            canRemove={canRemove}
            roleUpdating={Boolean(roleUpdateLoadingByUserId[user.id])}
            removing={Boolean(removingByUserId[user.id])}
            onRoleChange={(roleId) => {
              dispatch(
                updateProjectUserRole({ projectId, userId: user.id, roleId })
              )
                .unwrap()
                .then(() => toast.success('Member role updated'))
                .catch((updateError) => toast.error(String(updateError)));
            }}
            onRemove={() => {
              dispatch(removeProjectUser({ projectId, userId: user.id }))
                .unwrap()
                .then(() => toast.success('Member removed'))
                .catch((removeError) => toast.error(String(removeError)));
            }}
          />
        ))}
      </div>
    </div>
  );
};
