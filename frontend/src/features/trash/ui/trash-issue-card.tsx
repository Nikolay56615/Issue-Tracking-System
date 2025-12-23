// TrashIssueCard.tsx
import type { Issue } from '@/features/board/model';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card.tsx';
import { PriorityBadge } from '@/features/board/ui/priority-badge.tsx';
import { TypeBadge } from '@/features/board/ui/type-badge.tsx';
import { IssueDialog } from '@/features/board/ui/issue-dialog.tsx';
import { Button } from '@/components/ui/button.tsx';

interface TrashIssueCardProps {
  issue: Issue;
  onRestore: (id: number) => void;
  restoring?: boolean;
  restoreError?: string | null;
}

export const TrashIssueCard = ({
  issue,
  onRestore,
  restoring = false,
  restoreError,
}: TrashIssueCardProps) => {
  return (
    <Card className="w-50 gap-2 text-start">
      <CardHeader className="items-center gap-0">
        <IssueDialog issue={issue} />
      </CardHeader>
      <CardContent className="line-clamp-3 text-sm">
        {issue.description}
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-between gap-2">
        <div className="flex gap-2">
          <TypeBadge type={issue.type} />
          <PriorityBadge priority={issue.priority} />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            disabled={restoring}
            onClick={() => onRestore(issue.id)}
          >
            {restoring ? 'Restoring...' : 'Restore'}
          </Button>
          {restoreError && (
            <span className="text-xs text-red-500">{restoreError}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
