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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col">
          <span>Id: {id}</span>
          <span>Project: {projectId}</span>
          <div className="flex gap-2">
            <TypeBadge type={type} />
            <PriorityBadge priority={priority} />
          </div>
          <span>Status: {capitalize(status)}</span>
          <span>Description</span>
          <p>{description}</p>
          {attachments.map((attachment) => (
            <AttachmentRow filename={attachment.url} />
          ))}
          <Button
            variant="destructive"
            className="cursor-pointer"
            disabled={deleteIssueStatus.loading}
            onClick={() => dispatch(deleteIssue(id))}
          >
            <Trash />
            <span>{deleteIssueStatus.loading ? 'Deleting...' : 'Delete'}</span>
          </Button>
          {deleteIssueStatus.error && <span>{deleteIssueStatus.error}</span>}
        </div>
      </DialogContent>
    </Dialog>
  );
};
