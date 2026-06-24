import { useEffect } from 'react';
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
import {
  fetchCurrentProjectRole,
  fetchProjectConfig,
  hasPermission,
} from '@/features/project-config/model';

export const UsersPage = () => {
  const params = useParams();
  const projectId = Number(params.projectId);
  const dispatch = useAppDispatch();
  const { users, loading, roleUpdateLoadingByUserId, removingByUserId, error } =
    useAppSelector((state) => state.users);
  const {
    config: projectConfig,
    currentRole,
    currentRoleProjectId,
    currentRoleLoading,
  } = useAppSelector((state) => state.projectConfig);

  useEffect(() => {
    dispatch(getProjectUsers(projectId));
    dispatch(fetchProjectConfig(projectId));
    dispatch(fetchCurrentProjectRole(projectId));
  }, [dispatch, projectId]);

  const projectRole =
    currentRoleProjectId === projectId ? currentRole : null;
  const roleLoading =
    currentRoleProjectId !== projectId || currentRoleLoading === 'pending';
  const canManageRoles = hasPermission(projectRole, 'members.assignRole');
  const canRemove = hasPermission(projectRole, 'members.remove');
  const availableRoles = projectConfig?.roles ?? [];
  const ownerCriticalPermissions = [
    'settings.manage',
    'members.invite',
    'members.remove',
    'members.assignRole',
  ] as const;
  const isOwnerLikeRole = (roleId: string) => {
    const role = availableRoles.find((item) => item.id === roleId);
    return Boolean(
      role &&
        ownerCriticalPermissions.every((permission) =>
          role.permissions.includes(permission)
        )
    );
  };
  const ownerLikeUserIds = new Set(
    users.filter((user) => isOwnerLikeRole(user.roleId)).map((user) => user.id)
  );

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
        {users.map((user) => {
          const ownerLocked =
            ownerLikeUserIds.has(user.id) && ownerLikeUserIds.size <= 1;

          return (
            <UserCard
              key={user.id}
              user={user}
              availableRoles={availableRoles}
              canManageRoles={canManageRoles}
              canRemove={canRemove}
              roleUpdating={Boolean(roleUpdateLoadingByUserId[user.id])}
              removing={Boolean(removingByUserId[user.id])}
              ownerLocked={ownerLocked}
              canSelectRole={(role) => !ownerLocked || isOwnerLikeRole(role.id)}
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
          );
        })}
      </div>
    </div>
  );
};
