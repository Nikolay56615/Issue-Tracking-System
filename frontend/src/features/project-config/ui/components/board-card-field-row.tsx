import { Eye, EyeOff } from 'lucide-react';
import { formatFieldTypeLabel } from '@/features/project-config/model';
import type { BoardCardFieldRowProps } from './types.ts';

export const BoardCardFieldRow = ({
  fieldEntry,
  checked,
  onToggle,
}: BoardCardFieldRowProps) => (
  <label
    className="bg-background hover:bg-muted/40 flex items-center gap-3 rounded-lg
      border px-3 py-2.5 text-sm transition-colors"
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={() => onToggle(fieldEntry.id)}
      className="shrink-0"
    />
    {checked ? (
      <Eye className="text-muted-foreground size-4 shrink-0" />
    ) : (
      <EyeOff className="text-muted-foreground size-4 shrink-0" />
    )}
    <span className="min-w-0 flex-1">
      <span className="block truncate font-medium">{fieldEntry.label}</span>
      <span className="text-muted-foreground block text-xs">
        {fieldEntry.kind === 'custom' && fieldEntry.customField
          ? formatFieldTypeLabel(fieldEntry.customField.type)
          : 'System field'}
      </span>
    </span>
  </label>
);
