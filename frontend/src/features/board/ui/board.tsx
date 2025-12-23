import type {
  Issue,
  IssueStatus,
  LifecycleGraph,
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
import { useEffect, useState } from 'react';
import { StatusColumn } from './status-column.tsx';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/types.ts';
import {
  changeIssueStatus,
  getBoard,
  getLifecycleGraph,
} from '@/features/board/model/board.actions.ts';
import { useAppDispatch } from '@/store';
import type { UserRole } from '@/features/profile/model/profile.types.ts';
import { toast } from 'sonner';

const statusName: Record<IssueStatus, string> = {
  BACKLOG: 'Backlog',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
};

const statusOrder: IssueStatus[] = ['BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE'];

const isTransitionAllowed = (
  from: IssueStatus,
  to: IssueStatus,
  userRole: UserRole,
  isAuthor: boolean,
  isAssignee: boolean,
  lifecycleGraph: LifecycleGraph
): boolean => {
  return lifecycleGraph.transitions.some((transition) => {
    if (transition.from !== from || transition.to !== to) {
      return false;
    }
    const roleAllowed = transition.allowedRoles.includes(userRole);
    const authorAllowed = transition.authorAllowed && isAuthor;
    const assigneeAllowed = transition.assigneeAllowed && isAssignee;
    return roleAllowed || authorAllowed || assigneeAllowed;
  });
};

export const Board = ({ projectId }: { projectId: number }) => {
  const role: UserRole = 'OWNER'; //TODO: get from api

  const dispatch = useAppDispatch();
  const {
    issues,
    boardLoading,
    boardError,
    statusChangeLoading,
    lifecycleGraph,
  } = useSelector((state: RootState) => state.boardReducer);

  useEffect(() => {
    dispatch(getBoard({ projectId }));
    dispatch(getLifecycleGraph());
  }, [dispatch, projectId]);

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

    if (statusOrder.includes(overStatus)) {
      if (draggedIssue.status !== overStatus) {
        if (lifecycleGraph == null) return;

        if (
          !isTransitionAllowed(
            draggedIssue.status,
            overStatus,
            role,
            false,
            false,
            lifecycleGraph
          )
        ) {
          toast.error('Transition not allowed', {
            description: `Cannot move from ${draggedIssue.status} to ${overStatus}`,
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

          toast.success(`Status changed to ${overStatus}`);
        } catch (err: any) {
          const errorMessage =
            typeof err === 'string'
              ? err
              : err?.message || 'Failed to change status: ';

          toast.error(errorMessage);
        }
      }
    }
  };

  const grouped = issues.reduce((map, issue) => {
    const statusIssues = map.get(issue.status) || [];
    map.set(issue.status, [...statusIssues, issue]);
    return map;
  }, new Map<IssueStatus, Issue[]>());

  const canDrag = (issue: Issue): boolean => {
    if (lifecycleGraph === null) return false;
    return lifecycleGraph.transitions.some(
      (t) => t.from === issue.status && t.allowedRoles.includes(role)
    );
  };

  if (boardLoading === 'pending') {
    return <div>Loading...</div>;
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
      <div className="flex h-full min-h-0 flex-row gap-4 rounded-lg px-8 py-4">
        {statusOrder.map((status) => {
          const statusIssues = grouped.get(status) || [];
          return (
            <StatusColumn
              key={status}
              status={status}
              title={statusName[status]}
              issues={statusIssues}
              canDrag={canDrag}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeIssue ? (
          <IssueCard issue={activeIssue} canDrag={false} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
