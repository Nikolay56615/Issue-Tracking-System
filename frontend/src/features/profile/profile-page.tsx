import { CreateProjectForm, Profile } from './ui';
import type { RootState } from '@/store/types.ts';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/store';
import {
  fetchProjects,
  getCurrentUser,
} from '@/features/profile/model/profile.actions.ts';
import { useEffect } from 'react';

export const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const {
    profile,
    profileLoading,
    profileError,
    projects,
    projectsLoading,
    projectsError,
    createProjectLoading,
    createProjectError,
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
    <div className="flex flex-col gap-4">
      <Profile profile={profile} projects={projects} />
      {createProjectLoading !== 'pending' && <CreateProjectForm />}
      {createProjectLoading === 'pending' && <div>Loading...</div>}
      {createProjectError && <div>Error: {createProjectError}</div>}
    </div>
  );
};
