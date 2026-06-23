import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Archive,
  ArchiveRestore,
  Loader2,
  Shield,
  ShieldOff,
  Trash,
  UserCheck,
  UserX,
} from 'lucide-react';
import { AdminRequests } from '@/features/admin/api/api.admin.ts';
import type {
  AdminProject,
  AdminUser,
} from '@/features/admin/model/admin.types.ts';
import { Button } from '@/components/ui/button.tsx';
import { Card } from '@/components/ui/card.tsx';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx';
import { useAppDispatch, useAppSelector } from '@/store';
import { getCurrentUser } from '@/features/profile/model/profile.actions.ts';

const replaceUser = (users: AdminUser[], user: AdminUser) =>
  users.map((item) => (item.id === user.id ? user : item));

export const AdminPage = () => {
  const dispatch = useAppDispatch();
  const { profile, profileLoading } = useAppSelector((state) => state.profile);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (!profile.globalAdmin) return;

    const load = async () => {
      try {
        setLoading(true);
        const [loadedUsers, loadedProjects] = await Promise.all([
          AdminRequests.getUsers(),
          AdminRequests.getProjects(),
        ]);
        setUsers(loadedUsers);
        setProjects(loadedProjects);
      } catch (error) {
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [profile.globalAdmin]);

  const runUserAction = async (
    key: string,
    action: () => Promise<AdminUser>,
    successMessage: string
  ) => {
    try {
      setBusyKey(key);
      const user = await action();
      setUsers((current) => replaceUser(current, user));
      toast.success(successMessage);
    } catch (error) {
      toast.error('Admin action failed');
    } finally {
      setBusyKey(null);
    }
  };

  const reloadProjects = async () => {
    setProjects(await AdminRequests.getProjects());
  };

  const runProjectAction = async (
    key: string,
    action: () => Promise<void>,
    successMessage: string
  ) => {
    try {
      setBusyKey(key);
      await action();
      await reloadProjects();
      toast.success(successMessage);
    } catch (error) {
      toast.error('Project admin action failed');
    } finally {
      setBusyKey(null);
    }
  };

  if (profileLoading === 'pending' || loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  if (!profile.globalAdmin) {
    return (
      <main className="mx-auto w-full max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Global admin access is required.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-muted-foreground text-sm">
          Manage system users and projects for the demo environment.
        </p>
      </div>

      <Tabs defaultValue="users" className="flex flex-col gap-4">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-0 flex flex-col gap-3">
          {users.map((user) => {
            const key = `user-${user.id}`;
            const busy = busyKey?.startsWith(key);

            return (
              <Card
                key={user.id}
                className="flex flex-wrap items-center gap-3 rounded-lg p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{user.username}</span>
                    {user.globalAdmin && (
                      <span
                        className="border-primary text-primary rounded-md border px-2
                          py-0.5 text-xs font-medium"
                      >
                        Global admin
                      </span>
                    )}
                    {!user.active && (
                      <span
                        className="border-destructive text-destructive rounded-md
                          border px-2 py-0.5 text-xs font-medium"
                      >
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground truncate text-sm">
                    {user.email}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={user.globalAdmin ? 'outline' : 'default'}
                  disabled={busy}
                  onClick={() =>
                    runUserAction(
                      `${key}-admin`,
                      () =>
                        AdminRequests.setGlobalAdmin(
                          user.id,
                          !user.globalAdmin
                        ),
                      user.globalAdmin
                        ? 'Global admin removed'
                        : 'Global admin granted'
                    )
                  }
                >
                  {user.globalAdmin ? (
                    <ShieldOff data-icon="inline-start" />
                  ) : (
                    <Shield data-icon="inline-start" />
                  )}
                  {user.globalAdmin ? 'Revoke admin' : 'Make admin'}
                </Button>

                {user.active ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      runUserAction(
                        `${key}-deactivate`,
                        () => AdminRequests.deactivateUser(user.id),
                        'User deactivated'
                      )
                    }
                  >
                    <UserX data-icon="inline-start" />
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      runUserAction(
                        `${key}-restore`,
                        () => AdminRequests.restoreUser(user.id),
                        'User restored'
                      )
                    }
                  >
                    <UserCheck data-icon="inline-start" />
                    Restore
                  </Button>
                )}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="projects" className="mt-0 flex flex-col gap-3">
          {projects.map((project) => {
            const key = `project-${project.id}`;
            const busy = busyKey?.startsWith(key);

            return (
              <Card
                key={project.id}
                className="flex flex-wrap items-center gap-3 rounded-lg p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{project.name}</span>
                    {project.archived && (
                      <span
                        className="border-muted-foreground text-muted-foreground
                          rounded-md border px-2 py-0.5 text-xs font-medium"
                      >
                        Archived
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Project #{project.id} - Owner #{project.ownerId}
                  </div>
                </div>

                {project.archived ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      runProjectAction(
                        `${key}-restore`,
                        () => AdminRequests.restoreProject(project.id),
                        'Project restored'
                      )
                    }
                  >
                    <ArchiveRestore data-icon="inline-start" />
                    Restore
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      runProjectAction(
                        `${key}-archive`,
                        () => AdminRequests.archiveProject(project.id),
                        'Project archived'
                      )
                    }
                  >
                    <Archive data-icon="inline-start" />
                    Archive
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`Delete project "${project.name}"?`)) {
                      return;
                    }
                    void runProjectAction(
                      `${key}-delete`,
                      () => AdminRequests.deleteProject(project.id),
                      'Project deleted'
                    );
                  }}
                >
                  <Trash data-icon="inline-start" />
                  Delete
                </Button>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </main>
  );
};
