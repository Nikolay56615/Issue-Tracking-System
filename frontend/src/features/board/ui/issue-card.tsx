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
import { IssueDialog } from '@/features/board/ui/issue-dialog.tsx';
import { IssueForm } from '@/features/board/ui/issue-form.tsx';
import { useParams } from 'react-router';
import ReactMarkdown from 'react-markdown';
import { useAppSelector } from '@/store';
import { getVisibleFields } from '@/features/project-config/model';

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
  const { config: projectConfig } = useAppSelector(
    (state) => state.projectConfig
  );
  const cardFields = getVisibleFields(projectConfig, 'card');
  const visibleFieldIds = new Set(cardFields.map((field) => field.id));
  const customCardFields = cardFields.filter(
    (field) => field.source === 'custom'
  );

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
        className="flex cursor-grab flex-col gap-2 text-sm
          active:cursor-grabbing"
        {...listeners}
      >
        {visibleFieldIds.has('description') && (
          <div className="line-clamp-3">
            <ReactMarkdown>{issue.description}</ReactMarkdown>
          </div>
        )}
        {visibleFieldIds.has('dueDate') && issue.dueDate && (
          <span className="text-muted-foreground text-xs">
            Due: {issue.dueDate}
          </span>
        )}
        {customCardFields.map((field) => {
          const value = issue.customFields?.[field.id];
          if (value === undefined || value === null || value === '')
            return null;

          return (
            <span key={field.id} className="text-muted-foreground text-xs">
              {field.label}:{' '}
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </span>
          );
        })}
      </CardContent>
      <CardFooter className="gap-2">
        {visibleFieldIds.has('type') && <TypeBadge type={issue.type} />}
        {visibleFieldIds.has('priority') && (
          <PriorityBadge priority={issue.priority} />
        )}
      </CardFooter>
    </Card>
  );
};
