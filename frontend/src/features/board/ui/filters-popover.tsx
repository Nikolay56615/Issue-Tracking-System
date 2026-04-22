import { Filter, Loader2, User } from 'lucide-react';
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
import { useEffect, useRef, useState } from 'react';
import type {
  IssueCustomFieldValue,
  IssuePriority,
  IssueType,
} from '@/features/board/model';
import { BadgeButton } from '@/features/board/ui/badge-button.tsx';
import type { UserProfile } from '@/features/profile';
import { ProfileRequests } from '@/features/profile';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useAppDispatch, useAppSelector } from '@/store';
import { getBoard } from '@/features/board/model/board.actions.ts';
import {
  setFilters,
  resetFilters,
} from '@/features/board/model/board.reducer.ts';
import { getVisibleFields } from '@/features/project-config/model';

const TYPES = ['TASK', 'BUG', 'FEATURE', 'SEARCH'] as const;
const PRIORITIES = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const;

interface FiltersPopoverProps {
  projectId: number;
}

export const FiltersPopover = ({ projectId }: FiltersPopoverProps) => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.board.filters);
  const { config: projectConfig } = useAppSelector(
    (state) => state.projectConfig
  );
  const filterFields = getVisibleFields(projectConfig, 'filter');
  const visibleFilterIds = new Set(filterFields.map((field) => field.id));
  const customFilterFields = filterFields.filter(
    (field) => field.source === 'custom'
  );

  const [open, setOpen] = useState(false);
  const [localTypes, setLocalTypes] = useState<IssueType[]>(
    filters.types ?? []
  );
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

  const [userOptions, setUserOptions] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [localCustomFilters, setLocalCustomFilters] = useState<
    Record<string, IssueCustomFieldValue>
  >(filters.customFields ?? {});

  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setUserOptions([]);
        return;
      }

      setUsersLoading(true);
      setError(null);

      try {
        const response = await ProfileRequests.searchUsers(searchQuery);
        setUserOptions(response);
      } catch (err) {
        setError('Failed to fetch users');
        console.error('Error fetching users:', err);
        setUserOptions([]);
      } finally {
        setUsersLoading(false);
      }
    };

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(fetchUsers, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery]);

  const showEmpty =
    open &&
    !usersLoading &&
    searchQuery.trim().length > 0 &&
    userOptions.length === 0;

  const handleReset = () => {
    setLocalTypes([]);
    setLocalPriorities([]);
    setSelectedUser(null);
    setSearchQuery('');
    setLocalDateRange({});
    setLocalCustomFilters({});
    dispatch(resetFilters());
  };

  const handleSave = () => {
    const newFilters = {
      types: localTypes,
      priorities: localPriorities,
      assigneeId: selectedUser?.id,
      nameQuery: filters.nameQuery,
      dateFrom: localDateRange.from?.toISOString().split('T')[0],
      dateTo: localDateRange.to?.toISOString().split('T')[0],
      customFields: localCustomFilters,
    };

    dispatch(setFilters(newFilters));
    dispatch(
      getBoard({
        projectId,
        filters: newFilters,
      })
    );
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent className="mr-4 w-80 p-4" align="start">
        {visibleFilterIds.has('type') && (
          <div className="mb-3">
            <label className="mb-2 block text-sm font-medium">Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((type) => {
                const checked = localTypes.includes(type);
                return (
                  <BadgeButton
                    key={type}
                    onClick={() => {
                      setLocalTypes((prev) =>
                        prev.includes(type)
                          ? prev.filter((x) => x !== type)
                          : [...prev, type]
                      );
                    }}
                    className={cn(checked && 'bg-accent')}
                  >
                    {capitalize(type)}
                  </BadgeButton>
                );
              })}
            </div>
          </div>
        )}
        {visibleFilterIds.has('priority') && (
          <div className="mb-3">
            <label className="mb-2 block text-sm font-medium">Priority</label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((priority) => {
                const checked = localPriorities.includes(priority);
                return (
                  <BadgeButton
                    key={priority}
                    onClick={() => {
                      setLocalPriorities((prev) =>
                        prev.includes(priority)
                          ? prev.filter((x) => x !== priority)
                          : [...prev, priority]
                      );
                    }}
                    className={cn(checked && 'bg-accent')}
                  >
                    {capitalize(priority)}
                  </BadgeButton>
                );
              })}
            </div>
          </div>
        )}
        {visibleFilterIds.has('assigneeIds') && (
          <div className="mb-3">
            <label className="mb-2 block text-sm font-medium">Assignee</label>
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search by name or email..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />

              {usersLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground ml-2 text-sm">
                    Searching...
                  </span>
                </div>
              )}

              {error && (
                <div className="text-destructive p-3 text-sm">{error}</div>
              )}

              {showEmpty && <CommandEmpty>No users found.</CommandEmpty>}

              {!usersLoading && !error && userOptions.length > 0 && (
                <CommandGroup className="max-h-60 overflow-auto">
                  {userOptions.map((user) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => setSelectedUser(user)}
                      className={cn(
                        'flex items-center gap-2',
                        selectedUser?.id === user.id && 'bg-accent'
                      )}
                    >
                      <User className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{user.username}</span>
                        <span className="text-muted-foreground text-xs">
                          {user.email}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </Command>
          </div>
        )}
        {(visibleFilterIds.has('dueDate') ||
          visibleFilterIds.has('startDate')) && (
          <div>
            <label className="mb-2 block text-sm font-medium">Date range</label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="h-8 text-xs"
                value={
                  localDateRange.from
                    ? localDateRange.from.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  setLocalDateRange((prev) => ({
                    ...prev,
                    from: e.target.value ? new Date(e.target.value) : undefined,
                  }));
                }}
              />
              <span className="text-xs">–</span>
              <Input
                type="date"
                className="h-8 text-xs"
                value={
                  localDateRange.to
                    ? localDateRange.to.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  setLocalDateRange((prev) => ({
                    ...prev,
                    to: e.target.value ? new Date(e.target.value) : undefined,
                  }));
                }}
              />
            </div>
          </div>
        )}
        {customFilterFields.map((field) => {
          const value = localCustomFilters[field.id];

          if (field.type === 'select') {
            return (
              <div key={field.id} className="mb-3">
                <label className="mb-2 block text-sm font-medium">
                  {field.label}
                </label>
                <Select
                  value={typeof value === 'string' ? value : ''}
                  onValueChange={(nextValue) =>
                    setLocalCustomFilters((prev) => ({
                      ...prev,
                      [field.id]: nextValue,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={field.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (field.type === 'checkbox') {
            return (
              <label
                key={field.id}
                className="mb-3 flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) =>
                    setLocalCustomFilters((prev) => ({
                      ...prev,
                      [field.id]: event.target.checked,
                    }))
                  }
                />
                <span>{field.label}</span>
              </label>
            );
          }

          return (
            <div key={field.id} className="mb-3">
              <label className="mb-2 block text-sm font-medium">
                {field.label}
              </label>
              <Input
                type={
                  field.type === 'number'
                    ? 'number'
                    : field.type === 'date'
                      ? 'date'
                      : 'text'
                }
                value={
                  typeof value === 'string' || typeof value === 'number'
                    ? value
                    : ''
                }
                onChange={(event) =>
                  setLocalCustomFilters((prev) => ({
                    ...prev,
                    [field.id]:
                      field.type === 'number'
                        ? Number(event.target.value)
                        : event.target.value,
                  }))
                }
              />
            </div>
          );
        })}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
