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
import { useEffect, useState } from 'react';
import { StatusColumn } from './status-column.tsx';
import {
  changeIssueStatus,
  getBoard,
} from '@/features/board/model/board.actions.ts';
import { useAppDispatch, useAppSelector } from '@/store';
import type { CustomRole, UserProfile } from '@/features/profile';
import { toast } from 'sonner';
import { getMyRole } from '@/features/board/api/api.board.ts';
import { ProfileRequests } from '@/features/profile';
import { Loader2 } from 'lucide-react';
import { getApiErrorMessage } from '@/api/get-error-message.ts';
import {
  fetchProjectConfig,
  getOrderedStatuses,
  getStatusLabel,
  isTransitionAllowedForIssue,
} from '@/features/project-config/model';

const isTransitionAllowed = (
  issue: Issue,
  to: IssueStatus,
  currentUserId: number | null,
  currentRoleId: string | null,
  transitions: LifecycleTransition[]
): boolean => {
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
  const [role, setRole] = useState<CustomRole | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || Number.isNaN(projectId)) return;

    let cancelled = false;

    const fetchRole = async () => {
      setRole(null);
      setRoleError(null);

      try {
        const response = await getMyRole(projectId);
        if (!cancelled) {
          setRole(response.role);
        }
      } catch (error) {
        if (!cancelled) {
          const message = getApiErrorMessage(
            error,
            'Failed to load project role'
          );
          console.error('Failed to fetch role:', error);
          setRole(null);
          setRoleError(message);
          toast.error('Failed to load project role', {
            description: message,
          });
        }
      }
    };

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCurrentUser = async () => {
      try {
        const user = await ProfileRequests.getCurrentUser();
        if (!cancelled) {
          setCurrentUser(user);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch current user:', error);
          setCurrentUser(null);
        }
      }
    };

    fetchCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const dispatch = useAppDispatch();
  const { issues, boardLoading, boardError, statusChangeLoading } =
    useAppSelector((state) => state.board);
  const { config: projectConfig, loading: configLoading } = useAppSelector(
    (state) => state.projectConfig
  );

  const statuses = getOrderedStatuses(projectConfig);
  const statusIds = statuses.map((status) => status.id);
  const transitions = projectConfig?.lifecycle.transitions ?? [];

  useEffect(() => {
    dispatch(getBoard({ projectId }));
    dispatch(fetchProjectConfig(projectId));
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
        currentUser?.id ?? null,
        role.id,
        transitions
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

    return transitions.some((transition) => {
      return (
        transition.fromStatusId === issue.status &&
        isTransitionAllowedForIssue({
          transition,
          issue,
          currentUserId: currentUser?.id ?? null,
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
