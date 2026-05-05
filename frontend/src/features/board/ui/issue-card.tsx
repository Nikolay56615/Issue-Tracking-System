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
import {
  formatCustomFieldValue,
  getCustomFieldById,
  getOrderedCustomFields,
  getStatusById,
  getStatusLabel,
} from '@/features/project-config/model';
import { StatusBadge } from '@/features/board/ui/status-badge.tsx';

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
  const { issues, users: members } = useAppSelector((state) => ({
    issues: state.board.issues,
    users: state.users.users,
  }));
  const orderedCustomFields = getOrderedCustomFields(projectConfig);
  const statusMeta = getStatusById(projectConfig, issue.status);
  const customFieldEntries = orderedCustomFields
    .map((field) => [field.id, issue.customFields?.[field.id]] as const)
    .filter(([, value]) => value !== null && value !== undefined && value !== '');

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
        {issue.description && (
          <div className="line-clamp-3">
            <ReactMarkdown>{issue.description}</ReactMarkdown>
          </div>
        )}
        {issue.dueDate && (
          <span className="text-muted-foreground text-xs">
            Due: {issue.dueDate}
          </span>
        )}
        {customFieldEntries.map(([fieldId, value]) => {
          const field = getCustomFieldById(projectConfig, fieldId);
          if (!field) return null;

          return (
            <span key={field.id} className="text-muted-foreground text-xs">
              {field.name}:{' '}
              {formatCustomFieldValue(field, value, {
                issues,
                members,
              })}
            </span>
          );
        })}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <StatusBadge
          label={getStatusLabel(projectConfig, issue.status)}
          color={statusMeta?.color ?? '#64748b'}
        />
        <TypeBadge type={issue.type} />
        <PriorityBadge priority={issue.priority} />
      </CardFooter>
    </Card>
  );
};
