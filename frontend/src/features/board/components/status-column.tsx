import type { Issue, IssueStatus } from '../types.ts';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { IssueCard } from './issue-card.tsx';
import { cn } from '@/lib/utils.ts';

interface StatusColumnProps {
  status: IssueStatus;
  title: string;
  issues: Issue[];
  canDrag: (issue: Issue) => boolean;
}

export const StatusColumn = ({
  status,
  title,
  issues,
  canDrag,
}: StatusColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-64 flex-col gap-4 transition-opacity',
        isOver && 'opacity-80'
      )}
    >
      <h2 className="text-2xl">{title}</h2>
      <SortableContext
        items={issues.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-[200px] flex-col gap-4">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} canDrag={canDrag(issue)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};
