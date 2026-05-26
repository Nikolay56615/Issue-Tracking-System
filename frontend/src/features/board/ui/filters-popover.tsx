import { Filter, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { capitalize, cn } from '@/lib/utils';
import type {
  IssueCustomFieldValue,
  IssuePriority,
  IssueType,
} from '@/features/board/model';
import { BadgeButton } from '@/features/board/ui/badge-button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  resetFilters,
  setFilters,
} from '@/features/board/model/board.reducer.ts';
import {
  getAssignableMembersForField,
  getOrderedCustomFields,
  type CustomFieldDefinition,
} from '@/features/project-config/model';
import { UserSelectField } from '@/features/board/ui/user-field.tsx';
import { getProjectUsers } from '@/features/users/model/users.actions.ts';

const TYPES = ['TASK', 'BUG', 'FEATURE', 'SEARCH'] as const;
const PRIORITIES = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const;

interface FiltersPopoverProps {
  projectId: number;
}

const getStringValue = (value: IssueCustomFieldValue) =>
  typeof value === 'string' ? value : '';

export const FiltersPopover = ({ projectId }: FiltersPopoverProps) => {
  const dispatch = useAppDispatch();
  const { filters, issues } = useAppSelector((state) => state.board);
  const {
    users,
    loading: usersLoading,
    projectId: usersProjectId,
  } = useAppSelector((state) => state.users);
  const { config: projectConfig } = useAppSelector(
    (state) => state.projectConfig
  );

  const customFields = getOrderedCustomFields(projectConfig);
  const [open, setOpen] = useState(false);
  const [localTypes, setLocalTypes] = useState<IssueType[]>(filters.types ?? []);
  const [localPriorities, setLocalPriorities] = useState<IssuePriority[]>(
    filters.priorities ?? []
  );
  const [localDateRange, setLocalDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    to: filters.dateTo ? new Date(filters.dateTo) : undefined,
  });
  const [localAssigneeId, setLocalAssigneeId] = useState<number | undefined>(
    filters.assigneeId
  );
  const [localCustomFilters, setLocalCustomFilters] = useState<
    Record<string, IssueCustomFieldValue>
  >(filters.customFields ?? {});

  useEffect(() => {
    if (!open) return;

    dispatch(getProjectUsers(projectId));
  }, [dispatch, open, projectId]);

  const projectMembers = usersProjectId === projectId ? users : [];
  const membersLoading =
    open && (usersLoading === 'pending' || usersProjectId !== projectId);

  const issueReferenceOptions = useMemo(
    () => issues.filter((issue) => issue.projectId === projectId),
    [issues, projectId]
  );

  const handleReset = () => {
    setLocalTypes([]);
    setLocalPriorities([]);
    setLocalAssigneeId(undefined);
    setLocalDateRange({});
    setLocalCustomFilters({});
    dispatch(resetFilters());
  };

  const handleSave = () => {
    const nextFilters = {
      types: localTypes,
      priorities: localPriorities,
      assigneeId: localAssigneeId,
      nameQuery: filters.nameQuery,
      dateFrom: localDateRange.from?.toISOString().split('T')[0],
      dateTo: localDateRange.to?.toISOString().split('T')[0],
      customFields: localCustomFilters,
    };

    dispatch(setFilters(nextFilters));
    setOpen(false);
  };

  const renderCustomFieldFilter = (field: CustomFieldDefinition) => {
    const value = localCustomFilters[field.id];

    if (field.type === 'text') {
      return (
        <Input
          value={getStringValue(value)}
          onChange={(event) =>
            setLocalCustomFilters((prev) => ({
              ...prev,
              [field.id]: event.target.value,
            }))
          }
        />
      );
    }

    if (field.type === 'number') {
      return (
        <Input
          type="number"
          value={typeof value === 'number' ? String(value) : ''}
          onChange={(event) =>
            setLocalCustomFilters((prev) => ({
              ...prev,
              [field.id]:
                event.target.value === ''
                  ? null
                  : Number(event.target.value),
            }))
          }
        />
      );
    }

    if (field.type === 'date') {
      return (
        <Input
          type="date"
          value={getStringValue(value)}
          onChange={(event) =>
            setLocalCustomFilters((prev) => ({
              ...prev,
              [field.id]: event.target.value || null,
            }))
          }
        />
      );
    }

    if (field.type === 'checkbox') {
      return (
        <Select
          value={
            value === true ? 'checked' : value === false ? 'unchecked' : 'all'
          }
          onValueChange={(nextValue) =>
            setLocalCustomFilters((prev) => ({
              ...prev,
              [field.id]:
                nextValue === 'all' ? null : nextValue === 'checked',
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={field.name} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="checked">Checked</SelectItem>
            <SelectItem value="unchecked">Unchecked</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (field.type === 'user_reference') {
      const allowedMembers = getAssignableMembersForField(field, projectMembers);

      return (
        <UserSelectField
          members={allowedMembers}
          value={typeof value === 'number' ? value : null}
          onChange={(nextValue) =>
            setLocalCustomFilters((prev) => ({
              ...prev,
              [field.id]: nextValue,
            }))
          }
          placeholder={field.name}
          emptyLabel="Any member"
          disabled={membersLoading}
        />
      );
    }

    return (
      <Select
        value={value == null ? 'all' : String(value)}
        onValueChange={(nextValue) =>
          setLocalCustomFilters((prev) => ({
            ...prev,
            [field.id]: nextValue === 'all' ? null : Number(nextValue),
          }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder={field.name} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any issue</SelectItem>
          {issueReferenceOptions.map((issue) => (
            <SelectItem key={issue.id} value={String(issue.id)}>
              {issue.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent className="mr-4 w-96 p-4" align="start">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((type) => {
                const checked = localTypes.includes(type);
                return (
                  <BadgeButton
                    key={type}
                    onClick={() =>
                      setLocalTypes((prev) =>
                        prev.includes(type)
                          ? prev.filter((item) => item !== type)
                          : [...prev, type]
                      )
                    }
                    className={cn(checked && 'bg-accent')}
                  >
                    {capitalize(type)}
                  </BadgeButton>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Priority</label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((priority) => {
                const checked = localPriorities.includes(priority);
                return (
                  <BadgeButton
                    key={priority}
                    onClick={() =>
                      setLocalPriorities((prev) =>
                        prev.includes(priority)
                          ? prev.filter((item) => item !== priority)
                          : [...prev, priority]
                      )
                    }
                    className={cn(checked && 'bg-accent')}
                  >
                    {capitalize(priority)}
                  </BadgeButton>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Assignee</label>
            {membersLoading ? (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading members...</span>
              </div>
            ) : (
              <UserSelectField
                members={projectMembers}
                value={localAssigneeId}
                onChange={(value) => setLocalAssigneeId(value ?? undefined)}
                placeholder="Any assignee"
                emptyLabel="Any assignee"
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Due date</label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="h-8 text-xs"
                value={
                  localDateRange.from
                    ? localDateRange.from.toISOString().split('T')[0]
                    : ''
                }
                onChange={(event) =>
                  setLocalDateRange((prev) => ({
                    ...prev,
                    from: event.target.value
                      ? new Date(event.target.value)
                      : undefined,
                  }))
                }
              />
              <span className="text-xs">-</span>
              <Input
                type="date"
                className="h-8 text-xs"
                value={
                  localDateRange.to
                    ? localDateRange.to.toISOString().split('T')[0]
                    : ''
                }
                onChange={(event) =>
                  setLocalDateRange((prev) => ({
                    ...prev,
                    to: event.target.value
                      ? new Date(event.target.value)
                      : undefined,
                  }))
                }
              />
            </div>
          </div>

          {customFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium">{field.name}</label>
              {renderCustomFieldFilter(field)}
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
