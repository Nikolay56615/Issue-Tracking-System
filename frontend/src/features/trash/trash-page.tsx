import { useEffect } from 'react';
import { useParams } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/store';
import { getTrash, restoreIssue } from '@/features/trash/model/trash.actions';
import { TrashIssueCard } from '@/features/trash/ui/trash-issue-card.tsx';
import { Loader2 } from 'lucide-react';
import { fetchProjectConfig } from '@/features/project-config/model';
import { getProjectUsers } from '@/features/users';

export const TrashPage = () => {
  const params = useParams();
  const projectId = Number(params.projectId);

  const dispatch = useAppDispatch();
  const { items, loading, error, restoreLoadingIds, restoreErrors } =
    useAppSelector((state) => state.trash);

  useEffect(() => {
    if (!Number.isNaN(projectId)) {
      dispatch(fetchProjectConfig(projectId));
      dispatch(getProjectUsers(projectId));
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
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div
        className="mx-auto grid w-full max-w-320
          grid-cols-[repeat(auto-fill,286px)] justify-start gap-4"
      >
        {items.length === 0 && (
          <div className="text-muted-foreground col-span-full">
            No deleted issues
          </div>
        )}

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
    </div>
  );
};
