import { useParams } from 'react-router';
import { useAppDispatch } from '@/store';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/types.ts';
import { UserCard } from '@/features/users/ui/user-card.tsx';
import { useEffect } from 'react';
import { getProjectUsers } from '@/features/users/model/users.actions.ts';

export const UsersPage = () => {
  const params = useParams();
  const projectId = Number(params.projectId);

  const dispatch = useAppDispatch();
  const { users, loading, error } = useSelector(
    (state: RootState) => state.usersReducer
  );

  useEffect(() => {
    dispatch(getProjectUsers(projectId));
  }, [dispatch, projectId]);

  if (loading === 'pending') {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: ${error}</div>;
  }

  return (
    <div className="mx-auto my-0 grid max-w-320 grid-cols-3 gap-4 pt-4">
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};
