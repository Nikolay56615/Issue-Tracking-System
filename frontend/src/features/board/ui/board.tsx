import type { Issue, IssueStatus } from '../model';
import { updateIssueStatus } from '../model';
import { IssueCard } from './issue-card.tsx';
import {
  DndContext,
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
import { IssueForm } from './issue-form.tsx';
import { Card } from '@/components/ui/card.tsx';
import { getBoard } from '@/features/board/model/board.actions.ts';
import { useAppDispatch } from '@/store';

const statusName: Record<IssueStatus, string> = {
  'BACKLOG': 'Backlog',
  'IN_PROGRESS': 'In Progress',
  'REVIEW': 'Review',
  'DONE': 'Done',
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
  const { issues, boardLoading, boardError } = useSelector(
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

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIssue = issues.find((i) => i.id === active.id);
    if (!activeIssue) return;

    const overStatus = over.id as IssueStatus;
    if (statusOrder.includes(overStatus)) {
      if (activeIssue.status !== overStatus) {
        if (
          isTransitionAllowed(
            activeIssue.status,
            overStatus,
            userRole,
            lifecycle
          )
        ) {
          dispatch(
            updateIssueStatus({ id: activeIssue.id, status: overStatus })
          );
        }
      }
    }
  };

  const handleDragEnd = () => {
    setActiveIssue(null);
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

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-row items-center gap-16 rounded-lg px-8 py-4">
        <IssueForm mode="add" />
      </Card>
      {boardLoading !== 'pending' && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <Card className="flex h-180 flex-row gap-4 rounded-lg p-8">
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
          </Card>
          <DragOverlay>
            {activeIssue ? (
              <IssueCard issue={activeIssue} canDrag={false} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      {boardLoading === 'pending' && !boardError && <div>Loading...</div>}
    </div>
  );
};
