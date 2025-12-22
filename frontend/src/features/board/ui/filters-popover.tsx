import { Filter, Loader2, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { capitalize, cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import type { IssuePriority, IssueType } from '@/features/board/model';
import { BadgeButton } from '@/features/board/ui/badge-button.tsx';
import type { UserProfile } from '@/features/profile';
import { ProfileRequests } from '@/features/profile/api';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useAppDispatch } from '@/store';
import { getBoard } from '@/features/board/model/board.actions.ts';

const TYPES = ['TASK', 'BUG', 'FEATURE', 'SEARCH'] as const;
const PRIORITIES = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const;

interface FiltersPopover {
  projectId: number;
}

export const FiltersPopover = ({ projectId }: FiltersPopover) => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);

  const [types, setTypes] = useState<IssueType[]>([]);
  const [priorities, setPriorities] = useState<IssuePriority[]>([]);
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: undefined,
    to: undefined,
  });

  const [userOptions, setUserOptions] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

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

  const resetAll = () => {
    setTypes([]);
    setPriorities([]);
    setSelectedUser(null);
    setSearchQuery('');
    setDateRange({});
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
        <div className="mb-3">
          <label className="mb-2 block text-sm font-medium">Type</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((type) => {
              const checked = types.includes(type);
              return (
                <BadgeButton
                  key={type}
                  onClick={() => {
                    setTypes((prev) =>
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
        <div className="mb-3">
          <label className="mb-2 block text-sm font-medium">Priority</label>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((priority) => {
              const checked = priorities.includes(priority);
              return (
                <BadgeButton
                  key={priority}
                  onClick={() => {
                    setPriorities((prev) =>
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
        <div>
          <label className="mb-2 block text-sm font-medium">Date range</label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-8 text-xs"
              value={
                dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''
              }
              onChange={(e) => {
                setDateRange((prev) => ({
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
                dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''
              }
              onChange={(e) => {
                setDateRange((prev) => ({
                  ...prev,
                  to: e.target.value ? new Date(e.target.value) : undefined,
                }));
              }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={resetAll}>
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() =>
              dispatch(
                getBoard({
                  projectId: projectId,
                  filters: {
                    types: types,
                    priorities: priorities,
                    assigneeId: selectedUser?.id,
                    dateFrom: dateRange.from?.toISOString(),
                    dateTo: dateRange.to?.toISOString(),
                  },
                })
              )
            }
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
