import { Profile } from './ui/profile.tsx';
import type { RootState } from '@/store/types.ts';
import { useSelector } from 'react-redux';

export const ProfilePage = () => {
  const profile = useSelector((state: RootState) => state.profileReducer);

  return <Profile profile={profile} />;
};
