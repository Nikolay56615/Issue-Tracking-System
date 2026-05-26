import { Info, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
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
        helpText="Statuses define the issue workflow columns and their order."
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
        helpText="Transition rules control who can move issues between statuses."
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground
                      inline-flex size-5 items-center justify-center rounded-sm
                      transition-colors"
                    aria-label="Disable transition rules help"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">
                  When disabled, issues can move between statuses without
                  checking transition rules.
                </TooltipContent>
              </Tooltip>
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
