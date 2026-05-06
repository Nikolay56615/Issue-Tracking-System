import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  SettingsSection,
  StatusRow,
  TransitionCard,
} from './components';
import type { LifecycleTabProps } from './types.ts';

export const LifecycleTab = ({
  draft,
  sortedStatuses,
  expandedStatusId,
  setExpandedStatusId,
  expandedTransitionId,
  setExpandedTransitionId,
  transitionRulesDisabled,
  getIssueCountForStatus,
  addStatus,
  deleteStatus,
  updateStatus,
  addTransition,
  updateTransition,
  removeTransition,
  handleStatusDragEnd,
  setTransitionRulesDisabled,
  setInitialStatus,
}: LifecycleTabProps) => {
  const statusSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  return (
    <>
      <SettingsSection
        title="Statuses"
        action={
          <Button size="sm" onClick={addStatus}>
            <Plus data-icon="inline-start" />
            Add status
          </Button>
        }
      >
        <DndContext
          sensors={statusSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleStatusDragEnd}
        >
          <SortableContext
            items={sortedStatuses.map((status) => status.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedStatuses.map((status) => {
              const isOpen = expandedStatusId === status.id;

              return (
                <StatusRow
                  key={status.id}
                  status={status}
                  isOpen={isOpen}
                  issueCount={getIssueCountForStatus(status.id)}
                  onToggle={() => setExpandedStatusId(isOpen ? null : status.id)}
                  onDelete={deleteStatus}
                  onSetInitial={setInitialStatus}
                  updateStatus={updateStatus}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </SettingsSection>

      <SettingsSection
        title="Transitions"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={transitionRulesDisabled}
                onChange={(event) =>
                  setTransitionRulesDisabled(event.target.checked)
                }
              />
              <span>Disable transition rules</span>
            </label>
            <Button
              size="sm"
              onClick={addTransition}
              disabled={transitionRulesDisabled}
            >
              <Plus data-icon="inline-start" />
              Add transition
            </Button>
          </div>
        }
      >
        {draft.lifecycle.transitions.map((transition) => {
          const isOpen = expandedTransitionId === transition.id;

          return (
            <TransitionCard
              key={transition.id}
              transition={transition}
              draft={draft}
              sortedStatuses={sortedStatuses}
              isOpen={isOpen}
              transitionRulesDisabled={transitionRulesDisabled}
              onToggle={() =>
                setExpandedTransitionId(isOpen ? null : transition.id)
              }
              removeTransition={removeTransition}
              updateTransition={updateTransition}
            />
          );
        })}
      </SettingsSection>
    </>
  );
};
