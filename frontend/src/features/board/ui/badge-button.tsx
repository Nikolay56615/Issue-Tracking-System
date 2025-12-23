import { cn } from '@/lib/utils.ts';
import type { ReactNode } from 'react';

interface BadgeButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}

export const BadgeButton = ({
  children,
  onClick,
  className,
}: BadgeButtonProps) => {
  return (
    <button
      className={cn(
        `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs
        font-medium capitalize`,
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
