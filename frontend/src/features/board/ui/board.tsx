import type { Issue, IssueStatus } from '@/features/board/model/board.types.ts';
import { IssueCard } from './issue-card.tsx';
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
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
} from '@/features/board/model/board.actions.ts';
import { useAppDispatch } from '@/store';

const statusName: Record<IssueStatus, string> = {
  BACKLOG: 'Backlog',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
};

const statusOrder: IssueStatus[] = ['BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE'];

type UserRole = 'owner' | 'reviewer' | 'admin' | 'user';

interface LifecycleTransition {
  from: IssueStatus;
  to: IssueStatus;
  role: UserRole;
}

interface Lifecycle {
  transitions: LifecycleTransition[];
}

const userRole: UserRole = 'user';

const lifecycle: Lifecycle = {
  transitions: [
    {
      from: 'BACKLOG',
      to: 'IN_PROGRESS',
      role: 'user',
    },
    {
      from: 'IN_PROGRESS',
      to: 'BACKLOG',
      role: 'user',
    },
  ],
};

const isTransitionAllowed = (
  from: IssueStatus,
  to: IssueStatus,
  userRole: UserRole,
  lifecycle: Lifecycle
): boolean => {
  return lifecycle.transitions.some(
    (transition) =>
      transition.from === from &&
      transition.to === to &&
      transition.role === userRole
  );
};

export const Board = ({ projectId }: { projectId: number }) => {
  const dispatch = useAppDispatch();
  const { issues, boardLoading, boardError, statusChangeLoading } = useSelector(
    (state: RootState) => state.boardReducer
  );

  useEffect(() => {
    dispatch(getBoard({ projectId }));
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

  const handleDragOver = (event: DragOverEvent) => {};

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);

    if (!over) return;

    const draggedIssue = issues.find((i) => i.id === active.id);
    if (!draggedIssue) return;

    if (statusChangeLoading[draggedIssue.id]) return;

    const overStatus = over.id as IssueStatus;

    if (statusOrder.includes(overStatus)) {
      if (draggedIssue.status !== overStatus) {
        if (
          isTransitionAllowed(
            draggedIssue.status,
            overStatus,
            userRole,
            lifecycle
          )
        ) {
          dispatch(
            changeIssueStatus({
              id: draggedIssue.id,
              newStatus: overStatus,
              previousStatus: draggedIssue.status,
            })
          );
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
    return lifecycle.transitions.some(
      (t) => t.from === issue.status && t.role === userRole
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
      onDragOver={handleDragOver}
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
