import { Profile } from './ui/profile.tsx';
import type { RootState } from '@/store/types.ts';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/store';
import { fetchProjects } from '@/features/profile/model/profile.actions.ts';
import { useEffect } from 'react';

export const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const { projects, loading, error } = useSelector(
    (state: RootState) => state.profileReducer
  );

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  if (loading === 'pending') return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Profile
      profile={{ id: 1, username: 'user', email: 'user@example.com' }}
      projects={projects}
    />
  );
};
