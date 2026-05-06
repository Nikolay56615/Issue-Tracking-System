import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils.ts';
import type { SortableSettingsRowProps } from './types.ts';

export const SortableSettingsRow = ({
  id,
  children,
}: SortableSettingsRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && 'z-10')}
    >
      {children({
        draggable: {
          attributes,
          listeners,
          setActivatorNodeRef,
        },
        isDragging,
      })}
    </div>
  );
};
