import { cn } from '@/lib/utils.ts';

interface StatusBadgeProps {
  label: string;
  color: string;
  className?: string;
}

export const StatusBadge = ({
  label,
  color,
  className,
}: StatusBadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-medium',
      className
    )}
    style={{
      borderColor: `${color}66`,
      color,
    }}
  >
    <span
      className="size-2 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
    {label}
  </span>
);
