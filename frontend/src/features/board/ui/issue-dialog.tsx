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

interface IssueDialogProps {
  issue: Issue;
}

export const IssueDialog = ({ issue }: IssueDialogProps) => {
  const { id, projectId, name, type, priority, status, description } = issue;

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
        </div>
      </DialogContent>
    </Dialog>
  );
};
