import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import type { Issue } from '@/features/board/model';
import { capitalize } from '@/lib/utils.ts';
import { TypeBadge } from '@/features/board/ui/type-badge.tsx';
import { PriorityBadge } from '@/features/board/ui/priority-badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Trash, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteIssue } from '@/features/board/model/board.actions.ts';
import { useEffect, useState } from 'react';
import type { UserProfileWithRole } from '@/features/profile/model/profile.types.ts';
import { IssueForm } from '@/features/board/ui/issue-form.tsx';
import ReactMarkdown from 'react-markdown';
import { UsersRequests } from '@/features/users/api';
import { AttachmentImage } from '@/features/board/ui/attachment-image.tsx';
import { AttachmentRow } from '@/features/board/ui/attachment-row.tsx';

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
  const { deleteIssueStatus } = useAppSelector((state) => state.boardReducer);

  const [assignees, setAssignees] = useState<UserProfileWithRole[]>([]);
  const [author, setAuthor] = useState<UserProfileWithRole | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        // Загружаем всех участников проекта
        const projectMembers = await UsersRequests.getProjectUsers(projectId);

        // Находим автора
        const authorData = projectMembers.find((u) => u.id === authorId);
        setAuthor(authorData || null);

        // Находим assignees
        const assigneesData = projectMembers.filter((u) =>
          assigneeIds.includes(u.id)
        );
        setAssignees(assigneesData);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [projectId, authorId, assigneeIds]);

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
      <DialogContent className="flex max-h-[80vh] flex-col">
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
              <span className="rounded-md border px-2 py-1 text-xs">
                {capitalize(status)}
              </span>
            </div>

            {/* Author */}
            <div>
              <span className="mb-1 block text-sm font-medium">Author</span>
              {loadingUsers ? (
                <div className="text-muted-foreground text-sm">Loading...</div>
              ) : author ? (
                <div
                  className="flex items-center gap-2 rounded border px-3 py-2
                    text-sm"
                >
                  <User className="text-muted-foreground h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{author.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {author.email}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">Unknown</div>
              )}
            </div>

            {/* Assignees */}
            {assigneeIds.length > 0 && (
              <div>
                <span className="mb-2 block text-sm font-medium">
                  Assignees
                </span>
                {loadingUsers ? (
                  <div className="text-muted-foreground text-sm">
                    Loading...
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {assignees.map((assignee) => (
                      <div
                        key={assignee.id}
                        className="flex items-center gap-2 rounded border px-3
                          py-2 text-sm"
                      >
                        <User className="text-muted-foreground h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">{assignee.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {assignee.email}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <span className="mb-1 block text-sm font-medium">
                Description
              </span>
              <ReactMarkdown>{description}</ReactMarkdown>
            </div>

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
