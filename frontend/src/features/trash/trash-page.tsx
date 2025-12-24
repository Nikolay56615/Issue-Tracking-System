import { useEffect } from 'react';
import { useParams } from 'react-router';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/store';
import type { RootState } from '@/store/types.ts';
import { getTrash, restoreIssue } from '@/features/trash/model/trash.actions';
import { TrashIssueCard } from '@/features/trash/ui/trash-issue-card.tsx';
import { Loader2 } from 'lucide-react';

export const TrashPage = () => {
  const params = useParams();
  const projectId = Number(params.projectId);

  const dispatch = useAppDispatch();
  const { items, loading, error, restoreLoadingIds, restoreErrors } =
    useSelector((state: RootState) => state.trashReducer);

  useEffect(() => {
    if (!Number.isNaN(projectId)) {
      dispatch(getTrash(projectId));
    }
  }, [dispatch, projectId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="mx-auto my-0 grid max-w-320 grid-cols-3 gap-4 pt-4">
      {items.length === 0 && <div>No deleted issues</div>}

      {items.map((issue) => (
        <TrashIssueCard
          key={issue.id}
          issue={issue}
          restoring={restoreLoadingIds.includes(issue.id)}
          restoreError={restoreErrors[issue.id] ?? null}
          onRestore={(id) => dispatch(restoreIssue(id))}
        />
      ))}
    </div>
  );
};
