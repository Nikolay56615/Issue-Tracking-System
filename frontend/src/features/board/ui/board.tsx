import type {
  Issue,
  IssueStatus,
  LifecycleTransition,
} from '@/features/board/model/board.types.ts';
import { IssueCard } from './issue-card.tsx';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState } from 'react';
import { StatusColumn } from './status-column.tsx';
import { changeIssueStatus } from '@/features/board/model/board.actions.ts';
import { useAppDispatch, useAppSelector } from '@/store';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/api/get-error-message.ts';
import {
  type CustomStatus,
  getOrderedStatuses,
  getStatusLabel,
  isTransitionAllowedForIssue,
  isTransitionRulesEnabled,
} from '@/features/project-config/model';
import { getIssueFiltersKey } from '@/features/board/model';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';

const isTransitionAllowed = (
  issue: Issue,
  to: IssueStatus,
  currentUserId: number | null,
  currentRoleId: string | null,
  transitions: LifecycleTransition[],
  transitionRulesEnabled: boolean
): boolean => {
  if (!transitionRulesEnabled) {
    return true;
  }

  if (currentRoleId === 'GLOBAL_ADMIN') {
    return true;
  }

  return transitions.some((transition) => {
    if (
      transition.fromStatusId !== issue.status ||
      transition.toStatusId !== to
    ) {
      return false;
    }

    return isTransitionAllowedForIssue({
      transition,
      issue,
      currentUserId,
      currentRoleId,
    });
  });
};

const fallbackSkeletonStatuses: Array<
  Pick<CustomStatus, 'id' | 'name' | 'color'>
> = [
  { id: 'skeleton-backlog', name: 'Backlog', color: '#64748b' },
  { id: 'skeleton-progress', name: 'In Progress', color: '#64748b' },
  { id: 'skeleton-review', name: 'Review', color: '#64748b' },
  { id: 'skeleton-done', name: 'Done', color: '#64748b' },
];

const BoardSkeleton = ({ statuses }: { statuses: CustomStatus[] }) => {
  const skeletonStatuses = statuses.length ? statuses : fallbackSkeletonStatuses;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="flex min-h-0 flex-1 flex-row gap-4 overflow-x-auto rounded-lg
          px-8 py-4"
      >
        {skeletonStatuses.map((status, columnIndex) => (
          <Card
            key={status.id}
            className="flex w-80 min-w-80 shrink-0 flex-col gap-0 py-4"
          >
            <CardHeader className="gap-0 px-4 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <h2 className="truncate font-medium">{status.name}</h2>
                </div>
                <Skeleton className="h-4 w-6" />
              </div>
            </CardHeader>
            <Separator />
            <CardContent
              className="flex h-full flex-col gap-4 overflow-y-auto px-4 pt-4"
            >
              {Array.from({ length: columnIndex % 2 === 0 ? 3 : 2 }).map(
                (_, cardIndex) => (
                  <div
                    key={`${status.id}-${cardIndex}`}
                    className="rounded-lg border bg-card p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="size-8" />
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-11/12" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const Board = ({ projectId }: { projectId: number }) => {
  const dispatch = useAppDispatch();
  const {
    issues,
    filters,
    boardLoading,
    boardProjectId,
    boardFiltersKey,
    pendingBoardProjectId,
    pendingBoardFiltersKey,
    boardError,
    statusChangeLoading,
  } = useAppSelector((state) => state.board);
  const {
    config: projectConfig,
    configProjectId,
    loading: configLoading,
    currentRole,
    currentRoleProjectId,
    currentRoleError,
  } = useAppSelector((state) => state.projectConfig);
  const currentUser = useAppSelector((state) => state.profile.profile);
  const role = currentRoleProjectId === projectId ? currentRole : null;
  const roleError =
    currentRoleProjectId === projectId ? currentRoleError : null;
  const currentUserId = currentUser.id > 0 ? currentUser.id : null;
  const currentFiltersKey = getIssueFiltersKey(filters);
  const hasCurrentBoard =
    boardProjectId === projectId && boardFiltersKey === currentFiltersKey;
  const currentBoardError =
    !hasCurrentBoard &&
    boardLoading === 'failed' &&
    pendingBoardProjectId === projectId &&
    pendingBoardFiltersKey === currentFiltersKey
      ? boardError
      : null;
  const activeProjectConfig =
    configProjectId === projectId ? projectConfig : null;
  const displayIssues = hasCurrentBoard ? issues : [];

  const statuses = getOrderedStatuses(activeProjectConfig);
  const statusIds = statuses.map((status) => status.id);
  const transitions = activeProjectConfig?.lifecycle.transitions ?? [];
  const transitionRulesEnabled = isTransitionRulesEnabled(activeProjectConfig);

  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const issue = displayIssues.find((i) => i.id === active.id) ?? null;
    setActiveIssue(issue);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);

    if (!over) return;

    const draggedIssue = displayIssues.find((i) => i.id === active.id);
    if (!draggedIssue) return;

    if (statusChangeLoading[draggedIssue.id]) return;

    const overId = over.id;
    const overIssue = displayIssues.find((i) => i.id === Number(overId));
    const overStatus =
      typeof overId === 'string' && statusIds.includes(overId as IssueStatus)
        ? (overId as IssueStatus)
        : overIssue?.status;

    if (
      !overStatus ||
      !statusIds.includes(overStatus) ||
      draggedIssue.status === overStatus
    ) {
      return;
    }

    if (activeProjectConfig == null) return;

    if (role == null) {
      toast.error('Project role is not loaded', {
        description: 'Status changes are temporarily disabled.',
      });
      return;
    }

    if (
      !isTransitionAllowed(
        draggedIssue,
        overStatus,
        currentUserId,
        role.id,
        transitions,
        transitionRulesEnabled
      )
    ) {
      toast.error('Transition not allowed', {
        description: `Cannot move from ${getStatusLabel(
          activeProjectConfig,
          draggedIssue.status
        )} to ${getStatusLabel(activeProjectConfig, overStatus)}`,
      });
      return;
    }

    try {
      await dispatch(
        changeIssueStatus({
          id: draggedIssue.id,
          newStatus: overStatus,
          previousStatus: draggedIssue.status,
        })
      ).unwrap();

      toast.success(
        `Status changed to ${getStatusLabel(activeProjectConfig, overStatus)}`
      );
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to change status'));
    }
  };

  const grouped = displayIssues.reduce((map, issue) => {
    const statusIssues = map.get(issue.status) || [];
    map.set(issue.status, [...statusIssues, issue]);
    return map;
  }, new Map<IssueStatus, Issue[]>());

  const canDrag = (issue: Issue): boolean => {
    if (activeProjectConfig === null || role === null) return false;

    if (role.id === 'GLOBAL_ADMIN') {
      return true;
    }

    if (!transitionRulesEnabled) {
      return true;
    }

    return transitions.some((transition) => {
      return (
        transition.fromStatusId === issue.status &&
        isTransitionAllowedForIssue({
          transition,
          issue,
          currentUserId,
          currentRoleId: role.id,
        })
      );
    });
  };

  if (currentBoardError) {
    return <div>Error: {currentBoardError}</div>;
  }

  if (configLoading === 'pending' || !hasCurrentBoard) {
    return <BoardSkeleton statuses={statuses} />;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-0 flex-col">
        {roleError && (
          <div
            className="border-destructive/30 bg-destructive/10 text-destructive
              mx-8 mt-4 rounded-md border px-3 py-2 text-sm"
          >
            {roleError}
          </div>
        )}
        <div
          className="flex min-h-0 flex-1 flex-row gap-4 overflow-x-auto rounded-lg
            px-8 py-4"
        >
          {statuses.map((status) => {
            const statusIssues = grouped.get(status.id) || [];
            return (
              <StatusColumn
                key={status.id}
                status={status.id}
                title={status.name}
                color={status.color}
                issues={statusIssues}
                canDrag={canDrag}
              />
            );
          })}
        </div>
      </div>
      <DragOverlay>
        {activeIssue ? (
          <IssueCard issue={activeIssue} canDrag={false} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
