import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Loader2 } from 'lucide-react';
import type { CustomRole, UserProfile } from '@/features/profile';
import { cn } from '@/lib/utils.ts';
import { ProfileRequests } from '@/features/profile/api';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { ProjectConfigRequests } from '@/features/project-config/api';

interface InviteUserPopoverProps {
  projectId: number;
  roles?: CustomRole[];
  disabled?: boolean;
}

const EMPTY_ROLES: CustomRole[] = [];

export function InviteUserPopover({
  projectId,
  roles = EMPTY_ROLES,
  disabled = false,
}: InviteUserPopoverProps) {
  const [open, setOpen] = useState(false);
  const [userOptions, setUserOptions] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localRoles, setLocalRoles] = useState<CustomRole[]>(roles);

  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    setLocalRoles(roles);
  }, [roles]);

  useEffect(() => {
    if (!open || localRoles.length > 0) {
      return;
    }

    let cancelled = false;

    const loadRoles = async () => {
      try {
        const config = await ProjectConfigRequests.getProjectConfig(projectId);
        if (!cancelled) {
          setLocalRoles(config.roles);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error('Failed to load project roles:', loadError);
        }
      }
    };

    loadRoles();

    return () => {
      cancelled = true;
    };
  }, [open, localRoles.length, projectId]);

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

  const handleInvite = async () => {
    if (!selectedUser || !projectId) return;

    setInviteLoading(true);

    const promise = ProfileRequests.inviteUser({
      projectId,
      userId: selectedUser.id,
      roleId: selectedRoleId,
    });

    toast.promise(promise, {
      loading: 'Sending invite...',
      success: () => `Successfully sent invite to ${selectedUser.username}`,
      error: (error) => {
        if (error instanceof AxiosError) {
          return error.response?.data?.message || 'Failed to send invitation';
        }
        return 'Failed to send invitation';
      },
    });

    setSelectedUser(null);
    setSelectedRoleId(localRoles[0]?.id ?? '');
    setOpen(false);
    setSearchQuery('');
    setUserOptions([]);
    setInviteLoading(false);
  };

  const handlePopoverOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery('');
      setSelectedUser(null);
      setSelectedRoleId(localRoles[0]?.id ?? '');
      setError(null);
    }
  };

  const showEmpty =
    open &&
    !usersLoading &&
    searchQuery.trim().length > 0 &&
    userOptions.length === 0;

  useEffect(() => {
    if (!selectedRoleId && localRoles.length > 0) {
      setSelectedRoleId(localRoles[0].id);
    }
  }, [localRoles, selectedRoleId]);

  return (
    <Popover open={open} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          disabled={disabled}
        >
          Invite User
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="space-y-4 p-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Select User
            </label>
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
            <label className="mb-2 block text-sm font-medium">
              Select Role
            </label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {localRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} size="sm">
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              size="sm"
              disabled={!selectedUser || !selectedRoleId}
            >
              {inviteLoading ? 'Sending invite...' : 'Send Invite'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
