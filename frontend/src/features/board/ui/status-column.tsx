import type { Issue, IssueStatus } from '../model/board.types.ts';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { IssueCard } from './issue-card.tsx';
import { cn } from '@/lib/utils.ts';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { Separator } from '@/components/ui/separator.tsx';

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
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'flex w-80 flex-col gap-0 py-4 transition-opacity',
        isOver && 'opacity-80'
      )}
    >
      <CardHeader className="gap-0 px-4 pb-4">
        <h2 className="font-medium">{title}</h2>
      </CardHeader>
      <Separator />
      <SortableContext
        items={issues.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <CardContent
          className="flex h-full flex-col gap-4 overflow-y-auto px-4 pt-4"
        >
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} canDrag={canDrag(issue)} />
          ))}
        </CardContent>
      </SortableContext>
    </Card>
  );
};
