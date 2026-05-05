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
import { Loader2 } from 'lucide-react';
import { getApiErrorMessage } from '@/api/get-error-message.ts';
import {
  getOrderedStatuses,
  getStatusLabel,
  isTransitionAllowedForIssue,
  isTransitionRulesEnabled,
} from '@/features/project-config/model';

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

export const Board = ({ projectId }: { projectId: number }) => {
  const dispatch = useAppDispatch();
  const { issues, boardLoading, boardError, statusChangeLoading } =
    useAppSelector((state) => state.board);
  const {
    config: projectConfig,
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

  const statuses = getOrderedStatuses(projectConfig);
  const statusIds = statuses.map((status) => status.id);
  const transitions = projectConfig?.lifecycle.transitions ?? [];
  const transitionRulesEnabled = isTransitionRulesEnabled(projectConfig);

  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const issue = issues.find((i) => i.id === active.id) ?? null;
    setActiveIssue(issue);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);

    if (!over) return;

    const draggedIssue = issues.find((i) => i.id === active.id);
    if (!draggedIssue) return;

    if (statusChangeLoading[draggedIssue.id]) return;

    const overStatus = over.id as IssueStatus;

    if (!statusIds.includes(overStatus) || draggedIssue.status === overStatus) {
      return;
    }

    if (projectConfig == null) return;

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
          projectConfig,
          draggedIssue.status
        )} to ${getStatusLabel(projectConfig, overStatus)}`,
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

      toast.success(`Status changed to ${getStatusLabel(projectConfig, overStatus)}`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to change status'));
    }
  };

  const grouped = issues.reduce((map, issue) => {
    const statusIssues = map.get(issue.status) || [];
    map.set(issue.status, [...statusIssues, issue]);
    return map;
  }, new Map<IssueStatus, Issue[]>());

  const canDrag = (issue: Issue): boolean => {
    if (projectConfig === null || role === null) return false;

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

  if (boardLoading === 'pending' || configLoading === 'pending') {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (boardError) {
    return <div>Error: {boardError}</div>;
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
