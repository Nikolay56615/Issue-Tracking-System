import { cn } from '@/lib/utils.ts';
import type { IssueType } from '../model/board.types.ts';

interface TypeBadgeProps {
  type: IssueType;
  className?: string;
}

const typeVariants: Record<
  IssueType,
  {
    text: string;
    bg: string;
    border: string;
  }
> = {
  TASK: {
    text: 'text-blue-900 dark:text-blue-100',
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
  },
  BUG: {
    text: 'text-purple-900 dark:text-purple-100',
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
  },
  FEATURE: {
    text: 'text-emerald-900 dark:text-emerald-100',
    bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  SEARCH: {
    text: 'text-cyan-900 dark:text-cyan-100',
    bg: 'bg-cyan-100 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
};

export const TypeBadge = ({ type, className }: TypeBadgeProps) => {
  const variant = typeVariants[type];

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
      {type.toLowerCase()}
    </span>
  );
};
