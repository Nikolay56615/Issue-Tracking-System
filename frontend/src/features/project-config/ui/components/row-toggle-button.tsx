import { ChevronDown, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import type { RowToggleButtonProps } from './types.ts';

export const RowToggleButton = ({
  title,
  subtitle,
  meta,
  open,
  onClick,
  accent,
  draggable,
  expandable = true,
}: RowToggleButtonProps) => (
  <div className="flex items-center gap-2 px-2 py-1.5">
    {draggable && (
      <button
        type="button"
        className="text-muted-foreground hover:bg-muted inline-flex size-8
          shrink-0 cursor-grab items-center justify-center rounded-md
          active:cursor-grabbing"
        ref={draggable.setActivatorNodeRef}
        {...draggable.attributes}
        {...draggable.listeners}
      >
        <GripVertical className="size-4" />
      </button>
    )}
    {expandable ? (
      <button
        type="button"
        onClick={onClick}
        className="hover:bg-muted/40 flex min-w-0 flex-1 items-center gap-3
          rounded-lg px-2 py-2.5 text-left transition-colors"
      >
        {accent}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{title}</div>
          {(subtitle || meta) && (
            <div
              className="text-muted-foreground mt-1 flex flex-wrap gap-x-3
                gap-y-1 text-xs"
            >
              {subtitle && <span>{subtitle}</span>}
              {meta && <span>{meta}</span>}
            </div>
          )}
        </div>
        <ChevronDown
          className={cn(
            'text-muted-foreground h-4 w-4 shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
    ) : (
      <div
        className="flex min-w-0 flex-1 items-center justify-between gap-3
          rounded-lg px-2 py-2.5"
      >
        <div className="flex min-w-0 items-center gap-3">
          {accent}
          <div className="truncate text-sm font-medium">{title}</div>
        </div>
        {(meta || subtitle) && (
          <span className="text-muted-foreground shrink-0 text-xs">
            {meta ?? subtitle}
          </span>
        )}
      </div>
    )}
  </div>
);
