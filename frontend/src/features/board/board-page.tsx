import { Board } from './ui/board';
import { useParams } from 'react-router';
import { IssueForm } from '@/features/board/ui/issue-form.tsx';
import { Input } from '@/components/ui/input.tsx';
import { FiltersPopover } from '@/features/board/ui/filters-popover.tsx';

export const BoardPage = () => {
  const params = useParams();
  const projectId = Number(params.projectId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-row items-center gap-4 px-8 pt-4">
        <Input placeholder="Search issues..." />
        <FiltersPopover projectId={projectId} />
        <IssueForm mode="add" projectId={projectId} />
      </div>
      <Board projectId={projectId} />
    </div>
  );
};
