import { Trash } from 'lucide-react';
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
  CONDITION_EDITOR_OPTIONS,
  createCondition,
  createConditionFromUserSource,
  getConditionEditorKind,
  getUserSourceValue,
} from '@/features/project-config/model';
import type { TransitionConditionRowProps } from './types.ts';

export const TransitionConditionRow = ({
  condition,
  index,
  transitionId,
  draft,
  userReferenceFields,
  updateTransition,
}: TransitionConditionRowProps) => (
  <div
    className="grid gap-3 rounded-md border p-3
      md:grid-cols-[180px_1fr_auto]"
  >
    <div className="space-y-2">
      <Label>Condition</Label>
      <Select
        value={getConditionEditorKind(condition)}
        onValueChange={(value) =>
          updateTransition(transitionId, (current) => ({
            ...current,
            conditions: current.conditions.map((item, itemIndex) =>
              itemIndex === index
                ? value === 'role'
                  ? createCondition('role', draft)
                  : createConditionFromUserSource('assignee', draft)
                : item
            ),
          }))
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONDITION_EDITOR_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label>{condition.type === 'role' ? 'Role' : 'User source'}</Label>
      {condition.type === 'role' ? (
        <Select
          value={condition.roleId}
          onValueChange={(value) =>
            updateTransition(transitionId, (current) => ({
              ...current,
              conditions: current.conditions.map((item, itemIndex) =>
                itemIndex === index && item.type === 'role'
                  ? { ...item, roleId: value }
                  : item
              ),
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {draft.roles.map((projectRole) => (
              <SelectItem key={projectRole.id} value={projectRole.id}>
                {projectRole.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Select
          value={getUserSourceValue(condition)}
          onValueChange={(value) =>
            updateTransition(transitionId, (current) => ({
              ...current,
              conditions: current.conditions.map((item, itemIndex) =>
                itemIndex === index
                  ? createConditionFromUserSource(value, draft)
                  : item
              ),
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="author">Author</SelectItem>
            <SelectItem value="assignee">Assignee</SelectItem>
            {userReferenceFields
              .filter((field) => field.type === 'user_reference')
              .map((field) => (
                <SelectItem key={field.id} value={`field:${field.id}`}>
                  {field.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
    </div>

    <div className="flex items-end justify-end">
      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          updateTransition(transitionId, (current) => ({
            ...current,
            conditions: current.conditions.filter(
              (_, itemIndex) => itemIndex !== index
            ),
          }))
        }
      >
        <Trash data-icon="inline-start" />
        Delete
      </Button>
    </div>
  </div>
);
