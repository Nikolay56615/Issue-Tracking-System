import { User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import type { UserProfileWithRole } from '@/features/profile';
import { cn } from '@/lib/utils.ts';

interface UserSelectFieldProps {
  members: UserProfileWithRole[];
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  placeholder: string;
  emptyLabel: string;
  disabled?: boolean;
}

export const UserSelectField = ({
  members,
  value,
  onChange,
  placeholder,
  emptyLabel,
  disabled = false,
}: UserSelectFieldProps) => (
  <Select
    value={value == null ? 'none' : String(value)}
    onValueChange={(nextValue) =>
      onChange(nextValue === 'none' ? null : Number(nextValue))
    }
    disabled={disabled}
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">{emptyLabel}</SelectItem>
      {members.map((member) => (
        <SelectItem key={member.id} value={String(member.id)}>
          {member.name} · {member.roleName}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

interface UserValueCardProps {
  member?: UserProfileWithRole | null;
  loading?: boolean;
  emptyLabel?: string;
  className?: string;
}

export const UserValueCard = ({
  member,
  loading = false,
  emptyLabel = 'Not set',
  className,
}: UserValueCardProps) => {
  if (loading) {
    return (
      <div className="text-muted-foreground rounded-md border px-3 py-2 text-sm">
        Loading...
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-muted-foreground rounded-md border px-3 py-2 text-sm">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border px-3 py-2 text-sm',
        className
      )}
    >
      <div
        className="bg-muted flex size-8 shrink-0 items-center justify-center
          rounded-full"
      >
        <User className="text-muted-foreground size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{member.name}</div>
        <div className="text-muted-foreground truncate text-xs">
          {member.email}
        </div>
      </div>
      <span
        className="text-muted-foreground bg-muted rounded-full px-2 py-1 text-xs"
      >
        {member.roleName}
      </span>
    </div>
  );
};
