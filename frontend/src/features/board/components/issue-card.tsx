import type { Issue } from '../types.ts';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card.tsx';

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
      className={`w-64 cursor-grab active:cursor-grabbing
        ${isDragging ? 'shadow-lg' : ''}`}
    >
      <CardHeader>{issue.title}</CardHeader>
      <CardContent>Short Description</CardContent>
      <CardFooter>Issue Type, Issue Status</CardFooter>
    </Card>
  );
};
