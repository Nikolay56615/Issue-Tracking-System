import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
import {
  PERMISSION_DESCRIPTIONS,
  PERMISSION_GROUPS,
  formatPermissionLabel,
} from '@/features/project-config/model';
import type { PermissionGroupCardProps } from './types.ts';

export const PermissionGroupCard = ({
  role,
  disabled = false,
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
                  disabled={disabled}
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground
                        inline-flex size-5 items-center justify-center rounded-sm
                        transition-colors"
                      aria-label={`${formatPermissionLabel(permission)} permission help`}
                      onClick={(event) => event.preventDefault()}
                    >
                      <Info className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64">
                    {PERMISSION_DESCRIPTIONS[permission]}
                  </TooltipContent>
                </Tooltip>
              </label>
            );
          })}
        </div>
      </div>
    ))}
  </>
);
