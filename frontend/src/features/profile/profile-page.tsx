import { CreateProjectForm, UserInfo } from './ui';
import type { RootState } from '@/store/types.ts';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/store';
import {
  fetchProjects,
  getCurrentUser,
} from '@/features/profile/model/profile.actions.ts';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card.tsx';
import { Link } from 'react-router';

export const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const {
    profile,
    profileLoading,
    profileError,
    projects,
    projectsLoading,
    projectsError,
  } = useSelector((state: RootState) => state.profileReducer);

  useEffect(() => {
    dispatch(getCurrentUser());
    dispatch(fetchProjects());
  }, [dispatch]);

  if (profileLoading === 'pending' || projectsLoading === 'pending')
    return <div>Loading...</div>;
  if (profileError || projectsError) {
    return <div>Error: {profileError || projectsError}</div>;
  }

  return (
    <div className="mx-auto my-0 flex max-w-320 gap-4 pt-13">
      <UserInfo profile={profile} />
      <div className="flex flex-col gap-4">
        <CreateProjectForm />
        {projects.map((project) => (
          <Link to={`/${project.id}/board`} key={project.id}>
            <Card
              className="flex w-120 flex-col gap-1 rounded-lg bg-white p-4
                text-xl text-black"
            >
              <span>{project.name}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
