import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import type { Issue } from '@/features/board/model';
import { capitalize } from '@/lib/utils.ts';

interface IssueDialogProps {
  issue: Issue;
}

export const IssueDialog = ({ issue }: IssueDialogProps) => {
  const { id, projectId, name, type, priority, status, description } = issue;

  return (
    <Dialog>
      <DialogTrigger>
        <span className="font-medium">{name}</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        <div>
          <span>Id: {id}</span>
          <span>Project: {projectId}</span>
          <span>Type: {capitalize(type)}</span>
          <span>Priority: {capitalize(priority)}</span>
          <span>Status: {capitalize(status)}</span>
          <span>Description</span>
          <p>{description}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
