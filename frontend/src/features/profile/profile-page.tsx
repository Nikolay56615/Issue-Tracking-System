import { CreateProjectForm, UserInfo } from './ui';
import type { RootState } from '@/store/types.ts';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/store';
import {
  archiveProject,
  fetchProjects,
  getCurrentUser,
  restoreProject,
} from '@/features/profile/model/profile.actions.ts';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card.tsx';
import { Link } from 'react-router';
import { InviteUserPopover } from '@/features/profile/ui/invite-user-popover.tsx';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Archive, ArchiveRestore, Ellipsis } from 'lucide-react';

export const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const {
    profile,
    profileLoading,
    profileError,
    projects,
    projectsLoading,
    projectsError,
    archiveProjectLoadingIds,
    restoreProjectLoadingIds,
  } = useSelector((state: RootState) => state.profileReducer);

  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    dispatch(getCurrentUser());
    dispatch(fetchProjects());
  }, [dispatch]);

  if (profileLoading === 'pending' || projectsLoading === 'pending')
    return <div>Loading...</div>;
  if (profileError || projectsError) {
    return <div>Error: {profileError || projectsError}</div>;
  }

  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);

  return (
    <div className="mx-auto my-0 flex max-w-320 gap-4 pt-13">
      <UserInfo profile={profile} />
      <div className="flex flex-col gap-4">
        <CreateProjectForm />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-120">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="flex flex-col gap-4">
            {activeProjects.length === 0 ? (
              <div className="text-muted-foreground">No active projects</div>
            ) : (
              activeProjects.map((project) => (
                <Card
                  key={project.id}
                  className="flex w-120 flex-row gap-2 rounded-lg bg-white p-4
                    text-xl text-black"
                >
                  <Link to={`/${project.id}/board`}>
                    <span className="block max-w-60 truncate">
                      {project.name}
                    </span>
                  </Link>
                  {project.ownerId === profile.id && (
                    <>
                      <InviteUserPopover projectId={project.id} />
                      <Button
                        disabled={archiveProjectLoadingIds.includes(project.id)}
                        size="sm"
                        onClick={() => dispatch(archiveProject(project.id))}
                      >
                        {archiveProjectLoadingIds.includes(project.id) ? (
                          <Ellipsis />
                        ) : (
                          <Archive />
                        )}
                      </Button>
                    </>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="archived" className="flex flex-col gap-4">
            {archivedProjects.length === 0 ? (
              <div className="text-muted-foreground">No archived projects</div>
            ) : (
              archivedProjects.map((project) => (
                <Card
                  key={project.id}
                  className="flex w-120 flex-row justify-between gap-1
                    rounded-lg bg-white p-4 text-xl text-black"
                >
                  <Link to={`/${project.id}/board`}>
                    <span>{project.name}</span>
                  </Link>
                  {project.ownerId === profile.id && (
                    <Button
                      size="sm"
                      onClick={() => dispatch(restoreProject(project.id))}
                    >
                      {restoreProjectLoadingIds.includes(project.id) ? (
                        <Ellipsis />
                      ) : (
                        <ArchiveRestore />
                      )}
                    </Button>
                  )}
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
