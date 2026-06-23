import { Card } from '@/components/ui/card.tsx';
import type { UserProfileWithRole } from '@/features/profile';
import { Button } from '@/components/ui/button.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import type { CustomRole } from '@/features/profile/model/profile.types.ts';

interface UserCardProps {
  user: UserProfileWithRole;
  availableRoles: CustomRole[];
  canManageRoles: boolean;
  canRemove: boolean;
  roleUpdating: boolean;
  removing: boolean;
  onRoleChange: (roleId: string) => void;
  onRemove: () => void;
}

export const UserCard = ({
  user,
  availableRoles,
  canManageRoles,
  canRemove,
  roleUpdating,
  removing,
  onRoleChange,
  onRemove,
}: UserCardProps) => {
  return (
    <Card className="flex w-full flex-row gap-4 px-6 py-4">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full
          bg-purple-100"
      >
        <span className="text-2xl font-bold text-purple-900">
          {user.name[0].toUpperCase() ?? '?'}
        </span>
      </div>
      <div className="flex flex-col text-start">
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
          {user.name}
        </h1>
        <span className="text-gray-600 dark:text-gray-300">{user.email}</span>
        <span className="text-gray-600 dark:text-gray-300">
          {user.roleName}
        </span>
        {user.projectOwner && (
          <span className="text-muted-foreground mt-2 text-sm">
            Project owner
          </span>
        )}
        {canManageRoles && !user.projectOwner && (
          <div className="mt-2 flex items-center gap-2">
            <Select
              value={user.roleId}
              onValueChange={onRoleChange}
              disabled={roleUpdating}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {!user.projectOwner && !canManageRoles && canRemove && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={removing}
              onClick={onRemove}
            >
              {removing ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        )}
        {!user.projectOwner && canManageRoles && canRemove && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={removing}
              onClick={onRemove}
            >
              {removing ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
