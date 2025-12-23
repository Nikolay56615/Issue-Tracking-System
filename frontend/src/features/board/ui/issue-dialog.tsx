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
import { Trash } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteIssue } from '@/features/board/model/board.actions.ts';
import { AttachmentRow } from '@/features/board/ui/attachment-row.tsx';
import { AttachmentImage } from '@/features/board/ui/attachment-image.tsx';

interface IssueDialogProps {
  issue: Issue;
}

const isImage = (filename: string): boolean => {
  const ext = filename.toLowerCase().split('.').pop();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
    ext || ''
  );
};

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
  } = issue;

  const dispatch = useAppDispatch();
  const { deleteIssueStatus } = useAppSelector((state) => state.boardReducer);

  return (
    <Dialog>
      <DialogTrigger>
        <span className="cursor-pointer font-medium hover:underline">
          {name}
        </span>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
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

          <div>
            <span className="mb-1 block text-sm font-medium">Description</span>
            <p className="text-sm">{description}</p>
          </div>

          {attachments.map((attachment, index) =>
            isImage(attachment.url) ? (
              <AttachmentImage
                key={index}
                filename={attachment.url}
                originalFileName={attachment.originalFileName}
              />
            ) : (
              <AttachmentRow
                key={index}
                filename={attachment.url}
                originalFileName={attachment.originalFileName}
              />
            )
          )}

          <Button
            variant="destructive"
            className="mt-2 gap-2"
            disabled={deleteIssueStatus.loading}
            onClick={() => dispatch(deleteIssue(id))}
          >
            <Trash className="h-4 w-4" />
            <span>{deleteIssueStatus.loading ? 'Deleting...' : 'Delete'}</span>
          </Button>
          {deleteIssueStatus.error && (
            <span className="text-sm text-red-500">
              {deleteIssueStatus.error}
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
