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
      <DialogContent
        className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-4xl flex-col
          overflow-hidden sm:max-w-4xl"
      >
        <DialogHeader className="gap-3 pr-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="truncate text-xl">{name}</DialogTitle>
              <span className="text-muted-foreground text-sm">
                #{id} · Project {projectId}
              </span>
            </div>
            <IssueForm mode="edit" projectId={projectId} issue={issue} />
          </div>
          <div className="flex flex-wrap gap-2">
            <TypeBadge type={type} />
            <PriorityBadge priority={priority} />
            <StatusBadge
              label={getStatusLabel(projectConfig, status)}
              color={statusMeta?.color ?? '#64748b'}
            />
          </div>
        </DialogHeader>

        <div
          className="grid min-h-0 flex-1 gap-6 overflow-y-auto pr-2
            md:grid-cols-[minmax(0,1fr)_18rem]"
        >
          <div className="flex min-w-0 flex-col gap-5">
            {description && (
              <section className="bg-muted/40 rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-medium">Description</h3>
                <ReactMarkdown>{description}</ReactMarkdown>
              </section>
            )}

            {customDialogFields.length > 0 && (
              <section className="grid gap-3 sm:grid-cols-2">
                {customDialogFields.map((field) => {
                  const value = issue.customFields?.[field.id];
                  if (value === undefined || value === null || value === '') {
                    return null;
                  }

                  return (
                    <div key={field.id} className="rounded-lg border p-3">
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
              </section>
            )}

            {attachments.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-medium">Attachments</h3>
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
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-4">
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
            {issue.dueDate && (
              <div>
                <span className="mb-1 block text-sm font-medium">Due Date</span>
                <span className="text-muted-foreground text-sm">
                  {issue.dueDate}
                </span>
              </div>
            )}
            <Button
              variant="destructive"
              className="mt-auto"
              disabled={deleteIssueStatus.loading}
              onClick={() => dispatch(deleteIssue(id))}
            >
              <Trash data-icon="inline-start" />
              {deleteIssueStatus.loading ? 'Deleting...' : 'Delete'}
            </Button>
            {deleteIssueStatus.error && (
              <span className="text-destructive text-sm">
                {deleteIssueStatus.error}
              </span>
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
};
