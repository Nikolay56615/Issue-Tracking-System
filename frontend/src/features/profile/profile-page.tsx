import { Profile } from './ui/profile.tsx';
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

  return <Profile profile={profile} projects={projects} />;
};
