import type { Issue } from '../model/board.types.ts';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
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
  getBoardCardFieldEntries,
  getCustomFieldById,
} from '@/features/project-config/model';
import { EnumFieldBadge } from '@/features/board/ui/enum-field-badge.tsx';

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
  const boardCardFieldEntries = getBoardCardFieldEntries(projectConfig);
  const isBadgeField = (fieldId: string | undefined) =>
    fieldId === 'type' || fieldId === 'priority';
  const getMemberName = (userId: number) =>
    members.find((member) => member.id === userId)?.name ?? `User #${userId}`;

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
        {boardCardFieldEntries.map((fieldEntry, index) => {
          if (fieldEntry.kind === 'system') {
            if (fieldEntry.systemFieldId === 'description') {
              return issue.description && (
                <div key={fieldEntry.id} className="line-clamp-3">
                  <ReactMarkdown>{issue.description}</ReactMarkdown>
                </div>
              );
            }

            if (fieldEntry.systemFieldId === 'startDate') {
              return issue.startDate && (
                <span
                  key={fieldEntry.id}
                  className="text-muted-foreground text-xs"
                >
                  Start: {issue.startDate}
                </span>
              );
            }

            if (fieldEntry.systemFieldId === 'dueDate') {
              return issue.dueDate && (
                <span
                  key={fieldEntry.id}
                  className="text-muted-foreground text-xs"
                >
                  Due: {issue.dueDate}
                </span>
              );
            }

            if (fieldEntry.systemFieldId === 'assignee') {
              return issue.assigneeIds.length > 0 && (
                <span
                  key={fieldEntry.id}
                  className="text-muted-foreground text-xs"
                >
                  Assignee: {issue.assigneeIds.map(getMemberName).join(', ')}
                </span>
              );
            }

            if (fieldEntry.systemFieldId === 'author') {
              return (
                <span
                  key={fieldEntry.id}
                  className="text-muted-foreground text-xs"
                >
                  Author: {getMemberName(issue.authorId)}
                </span>
              );
            }

            if (fieldEntry.systemFieldId === 'attachments') {
              return issue.attachments.length > 0 && (
                <span
                  key={fieldEntry.id}
                  className="text-muted-foreground text-xs"
                >
                  Attachments: {issue.attachments.length}
                </span>
              );
            }

            if (
              fieldEntry.systemFieldId === 'type' ||
              fieldEntry.systemFieldId === 'priority'
            ) {
              if (isBadgeField(boardCardFieldEntries[index - 1]?.systemFieldId)) {
                return null;
              }

              const adjacentBadgeFieldIds = boardCardFieldEntries
                .slice(index)
                .map((entry) => entry.systemFieldId)
                .filter((fieldId, fieldIndex, array) => {
                  if (!isBadgeField(fieldId)) {
                    return false;
                  }

                  return array
                    .slice(0, fieldIndex)
                    .every((previousFieldId) => isBadgeField(previousFieldId));
                });

              return (
                <div key={fieldEntry.id} className="flex flex-wrap gap-2">
                  {adjacentBadgeFieldIds.map((fieldId) =>
                    fieldId === 'type' ? (
                      <TypeBadge key={fieldId} type={issue.type} />
                    ) : (
                      <PriorityBadge key={fieldId} priority={issue.priority} />
                    )
                  )}
                </div>
              );
            }

            return null;
          }

          const field = getCustomFieldById(projectConfig, fieldEntry.id);
          const value = issue.customFields?.[fieldEntry.id];
          if (
            !field ||
            value === null ||
            value === undefined ||
            value === ''
          ) {
            return null;
          }

          return (
            <span key={field.id} className="text-muted-foreground text-xs">
              {field.name}:{' '}
              {field.type === 'enum' ? (
                <EnumFieldBadge field={field} value={value} />
              ) : (
                formatCustomFieldValue(field, value, {
                  issues,
                  members,
                })
              )}
            </span>
          );
        })}
      </CardContent>
    </Card>
  );
};
