import type { Issue } from '../model/board.types.ts';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card.tsx';
import { cn } from '@/lib/utils.ts';
import { IssueDialog } from '@/features/board/ui/issue-dialog.tsx';
import { IssueForm } from '@/features/board/ui/issue-form.tsx';
import { useParams } from 'react-router';
import { IssueCardFields } from './issue-card-fields.tsx';

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
  const params = useParams();
  const projectId = Number(params.projectId);

  const {
    attributes,
    listeners, // НЕ применяем к корневому элементу
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
      // Убираем {...listeners} отсюда
      className={cn('gap-2 text-start', isDragging && 'shadow-lg')}
    >
      <CardHeader className="flex flex-row justify-center">
        <IssueDialog issue={issue} />
        <IssueForm mode={'edit'} projectId={projectId} issue={issue} />
      </CardHeader>
      <CardContent
        className="flex cursor-grab flex-col items-start gap-2 text-sm
          active:cursor-grabbing"
        {...listeners}
      >
        <IssueCardFields issue={issue} />
      </CardContent>
    </Card>
  );
};
