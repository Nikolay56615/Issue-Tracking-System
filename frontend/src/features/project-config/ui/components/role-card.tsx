import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { getRoleMemberCount } from '@/features/project-config/model';
import { PermissionGroupCard } from './permission-group-card.tsx';
import { RowToggleButton } from './row-toggle-button.tsx';
import type { RoleCardProps } from './types.ts';

export const RoleCard = ({
  role,
  isOpen,
  users,
  onToggle,
  updateRole,
  deleteRole,
}: RoleCardProps) => (
  <div className="rounded-lg border">
    <RowToggleButton
      title={role.name}
      subtitle={`${role.permissions.length} permissions`}
      meta={`${getRoleMemberCount(users, role.id)} members`}
      open={isOpen}
      onClick={onToggle}
    />
    {isOpen && (
      <div className="border-t px-3 py-3">
        <div className="mb-4 flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label>Role name</Label>
            <Input
              value={role.name}
              onChange={(event) =>
                updateRole(role.id, (current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <Button size="sm" variant="ghost" onClick={() => deleteRole(role.id)}>
            <Trash data-icon="inline-start" />
            Delete
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PermissionGroupCard role={role} updateRole={updateRole} />
        </div>
      </div>
    )}
  </div>
);
