import { cn } from '@/lib/utils.ts';
import type { IssuePriority } from '../model/board.types.ts';

interface PriorityBadgeProps {
  priority: IssuePriority;
  className?: string;
}

const priorityVariants: Record<
  IssuePriority,
  {
    text: string;
    bg: string;
    border: string;
  }
> = {
  URGENT: {
    text: 'text-red-900 dark:text-red-100',
    bg: 'bg-red-100 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
  },
  HIGH: {
    text: 'text-orange-900 dark:text-orange-100',
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
  },
  MEDIUM: {
    text: 'text-yellow-900 dark:text-yellow-100',
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  LOW: {
    text: 'text-green-900 dark:text-green-100',
    bg: 'bg-green-100 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
  },
};

export const PriorityBadge = ({ priority, className }: PriorityBadgeProps) => {
  const variant = priorityVariants[priority];

  return (
    <span
      className={cn(
        `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs
        font-medium capitalize`,
        variant.bg,
        variant.text,
        variant.border,
        className
      )}
    >
      {priority.toLowerCase()}
    </span>
  );
};
