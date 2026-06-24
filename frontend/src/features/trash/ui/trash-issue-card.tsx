// TrashIssueCard.tsx
import type { Issue } from '@/features/board';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card.tsx';
import { IssueDialog } from '@/features/board';
import { Button } from '@/components/ui/button.tsx';
import { IssueCardFields } from '@/features/board/ui/issue-card-fields.tsx';

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
    <Card className="w-full gap-2 text-start">
      <CardHeader className="items-center gap-0">
        <IssueDialog issue={issue} />
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-2 text-sm">
        <IssueCardFields issue={issue} />
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-between gap-2">
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
