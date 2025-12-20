import type { UserProfile } from '../model';

interface ProfileProps {
  profile: UserProfile;
}

export const UserInfo = ({ profile }: ProfileProps) => {
  return (
    <div className="flex w-fit flex-col gap-4 px-6">
      <div
        className="flex h-32 w-32 items-center justify-center rounded-full
          bg-purple-100"
      >
        <span className="text-2xl font-bold text-purple-900">
          {profile.username[0].toUpperCase() ?? '?'}
        </span>
      </div>
      <div className="flex flex-col text-start">
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
          {profile.username}
        </h1>
        <span className="text-gray-600 dark:text-gray-300">
          {profile.email}
        </span>
      </div>
    </div>
  );
};
