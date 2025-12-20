import type { Issue } from '../model/board.types.ts';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card.tsx';
import { cn } from '@/lib/utils.ts';
import { PriorityBadge } from '@/features/board/ui/priority-badge.tsx';
import { TypeBadge } from '@/features/board/ui/type-badge.tsx';

interface IssueCardProps {
  issue: Issue;
  canDrag: boolean;
  isDragging?: boolean;
}

export const IssueCard = ({
  issue,
  canDrag,
  isDragging = false,
}: IssueCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: issue.id,
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab gap-2 text-start active:cursor-grabbing',
        isDragging && 'shadow-lg'
      )}
    >
      <CardHeader className="items-center gap-0">
        <span className="font-medium">{issue.name}</span>
      </CardHeader>
      <CardContent className="line-clamp-3 text-sm">
        {issue.description}
      </CardContent>
      <CardFooter className="gap-2">
        <TypeBadge type={issue.type} />
        <PriorityBadge priority={issue.priority} />
      </CardFooter>
    </Card>
  );
};
