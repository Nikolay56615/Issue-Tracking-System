import type { UserProfile } from '@/features/profile';
import { Card } from '@/components/ui/card.tsx';

interface UserCardProps {
  user: UserProfile;
}

export const UserCard = ({ user }: UserCardProps) => {
  return (
    <Card className="flex w-103 flex-row gap-4 px-6">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full
          bg-purple-100"
      >
        <span className="text-2xl font-bold text-purple-900">
          {user.username[0].toUpperCase() ?? '?'}
        </span>
      </div>
      <div className="flex flex-col text-start">
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
          {user.username}
        </h1>
        <span className="text-gray-600 dark:text-gray-300">{user.email}</span>
      </div>
    </Card>
  );
};
