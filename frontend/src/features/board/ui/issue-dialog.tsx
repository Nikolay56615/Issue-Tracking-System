import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import type { Issue } from '@/features/board/model';
import { TypeBadge } from '@/features/board/ui/type-badge.tsx';
import { PriorityBadge } from '@/features/board/ui/priority-badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Trash } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteIssue } from '@/features/board/model/board.actions.ts';
import { IssueForm } from '@/features/board/ui/issue-form.tsx';
import ReactMarkdown from 'react-markdown';
import { AttachmentImage } from '@/features/board/ui/attachment-image.tsx';
import { AttachmentRow } from '@/features/board/ui/attachment-row.tsx';
import {
  formatCustomFieldValue,
  getStatusById,
  getOrderedCustomFields,
  getStatusLabel,
} from '@/features/project-config/model';
import { StatusBadge } from '@/features/board/ui/status-badge.tsx';
import { UserValueCard } from '@/features/board/ui/user-field.tsx';

interface IssueDialogProps {
  issue: Issue;
}

export const IssueDialog = ({ issue }: IssueDialogProps) => {
  const {
    id,
    projectId,
    name,
    type,
    priority,
    status,
    description,
    attachments,
    assigneeIds,
    authorId,
  } = issue;

  const dispatch = useAppDispatch();
  const { deleteIssueStatus } = useAppSelector((state) => state.board);
  const boardIssues = useAppSelector((state) => state.board.issues);
  const {
    users: projectMembers,
    loading: usersLoading,
    projectId: usersProjectId,
  } = useAppSelector((state) => state.users);
  const { config: projectConfig } = useAppSelector(
    (state) => state.projectConfig
  );
  const customDialogFields = getOrderedCustomFields(projectConfig);
  const statusMeta = getStatusById(projectConfig, status);
  const members = usersProjectId === projectId ? projectMembers : [];
  const loadingUsers =
    usersLoading === 'pending' || usersProjectId !== projectId;
  const author = members.find((member) => member.id === authorId) ?? null;
  const assignee =
    members.find((member) => assigneeIds.includes(member.id)) ?? null;

  const isImage = (filename: string): boolean => {
    const ext = filename.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
      ext || ''
    );
  };

  return (
    <Dialog>
      <DialogTrigger>
        <span
          className="cursor-pointer font-medium hover:underline"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {name}
        </span>
      </DialogTrigger>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-3xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{name}</DialogTitle>
          <IssueForm mode="edit" projectId={projectId} issue={issue} />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 pr-2">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">Id: {id}</span>
              <span className="text-muted-foreground text-sm">
                Project: {projectId}
              </span>
            </div>

            <div className="flex gap-2">
              <TypeBadge type={type} />
              <PriorityBadge priority={priority} />
              <StatusBadge
                label={getStatusLabel(projectConfig, status)}
                color={statusMeta?.color ?? '#64748b'}
              />
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium">Author</span>
              <UserValueCard
                member={author}
                loading={loadingUsers}
                emptyLabel="Unknown author"
              />
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium">Assignee</span>
              <UserValueCard
                member={assignee}
                loading={loadingUsers}
                emptyLabel="Not set"
              />
            </div>

            {description && (
              <div>
                <span className="mb-1 block text-sm font-medium">
                  Description
                </span>
                <ReactMarkdown>{description}</ReactMarkdown>
              </div>
            )}

            {issue.dueDate && (
              <div>
                <span className="mb-1 block text-sm font-medium">Due Date</span>
                <span className="text-muted-foreground text-sm">
                  {issue.dueDate}
                </span>
              </div>
            )}

            {customDialogFields.map((field) => {
              const value = issue.customFields?.[field.id];
              if (value === undefined || value === null || value === '') {
                return null;
              }

              return (
                <div key={field.id}>
                  <span className="mb-1 block text-sm font-medium">
                    {field.name}
                  </span>
                  {field.type === 'user_reference' ? (
                    <UserValueCard
                      member={
                        typeof value === 'number'
                          ? members.find((member) => member.id === value) ??
                            null
                          : null
                      }
                      loading={loadingUsers}
                      emptyLabel="Not set"
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {formatCustomFieldValue(field, value, {
                        issues: boardIssues,
                        members,
                      })}
                    </span>
                  )}
                </div>
              );
            })}

            {attachments.length > 0 && (
              <div>
                <span className="mb-2 block text-sm font-medium">
                  Attachments
                </span>
                <div className="flex flex-col gap-2">
                  {attachments.map((attachment, index) =>
                    isImage(attachment.url) ? (
                      <AttachmentImage
                        key={index}
                        issueId={id}
                        filename={attachment.url}
                        originalFileName={attachment.originalFileName}
                      />
                    ) : (
                      <AttachmentRow
                        key={index}
                        issueId={id}
                        filename={attachment.url}
                        originalFileName={attachment.originalFileName}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            <Button
              variant="destructive"
              className="mt-2 gap-2"
              disabled={deleteIssueStatus.loading}
              onClick={() => dispatch(deleteIssue(id))}
            >
              <Trash className="h-4 w-4" />
              <span>
                {deleteIssueStatus.loading ? 'Deleting...' : 'Delete'}
              </span>
            </Button>
            {deleteIssueStatus.error && (
              <span className="text-sm text-red-500">
                {deleteIssueStatus.error}
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
