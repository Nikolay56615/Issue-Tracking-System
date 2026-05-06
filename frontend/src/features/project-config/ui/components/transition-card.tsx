import { Plus, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import {
  createCondition,
  describeTransitionCondition,
  getStatusLabel,
} from '@/features/project-config/model';
import { cn } from '@/lib/utils.ts';
import { RowToggleButton } from './row-toggle-button.tsx';
import { TransitionConditionRow } from './transition-condition-row.tsx';
import type { TransitionCardProps } from './types.ts';

export const TransitionCard = ({
  transition,
  draft,
  sortedStatuses,
  isOpen,
  transitionRulesDisabled,
  onToggle,
  removeTransition,
  updateTransition,
}: TransitionCardProps) => {
  const userReferenceFields = draft.customFields.filter(
    (field) => field.type === 'user_reference'
  );
  const conditionSummary = transition.conditions
    .map((condition) => describeTransitionCondition(condition, draft))
    .join(', ');

  return (
    <div className="rounded-lg border">
      <RowToggleButton
        title={`${getStatusLabel(draft, transition.fromStatusId)} -> ${getStatusLabel(
          draft,
          transition.toStatusId
        )}`}
        subtitle={`${transition.conditions.length} conditions`}
        meta={conditionSummary || 'No conditions yet'}
        open={isOpen}
        onClick={onToggle}
      />
      {isOpen && (
        <div className="border-t px-3 py-3">
          <fieldset
            disabled={transitionRulesDisabled}
            className={cn('space-y-4', transitionRulesDisabled && 'opacity-60')}
          >
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-2">
                <Label>From</Label>
                <Select
                  value={transition.fromStatusId}
                  onValueChange={(value) =>
                    updateTransition(transition.id, (current) => ({
                      ...current,
                      fromStatusId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To</Label>
                <Select
                  value={transition.toStatusId}
                  onValueChange={(value) =>
                    updateTransition(transition.id, (current) => ({
                      ...current,
                      toStatusId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeTransition(transition.id)}
                >
                  <Trash data-icon="inline-start" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {transition.conditions.map((condition, index) => (
                <TransitionConditionRow
                  key={`${transition.id}-${condition.type}-${index}`}
                  condition={condition}
                  index={index}
                  transitionId={transition.id}
                  draft={draft}
                  userReferenceFields={userReferenceFields}
                  updateTransition={updateTransition}
                />
              ))}

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  updateTransition(transition.id, (current) => ({
                    ...current,
                    conditions: [...current.conditions, createCondition('role', draft)],
                  }))
                }
              >
                <Plus data-icon="inline-start" />
                Add condition
              </Button>
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
};
