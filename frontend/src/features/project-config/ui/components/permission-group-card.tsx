import { PERMISSION_GROUPS, formatPermissionLabel } from '@/features/project-config/model';
import type { PermissionGroupCardProps } from './types.ts';

export const PermissionGroupCard = ({
  role,
  updateRole,
}: PermissionGroupCardProps) => (
  <>
    {PERMISSION_GROUPS.map((group) => (
      <div key={group.label} className="rounded-md border p-3">
        <div className="mb-2 text-sm font-medium">{group.label}</div>
        <div className="space-y-2">
          {group.permissions.map((permission) => {
            const checked = role.permissions.includes(permission);

            return (
              <label key={permission} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) =>
                    updateRole(role.id, (current) => ({
                      ...current,
                      permissions: event.target.checked
                        ? [...current.permissions, permission]
                        : current.permissions.filter((item) => item !== permission),
                    }))
                  }
                />
                <span>{formatPermissionLabel(permission)}</span>
              </label>
            );
          })}
        </div>
      </div>
    ))}
  </>
);
