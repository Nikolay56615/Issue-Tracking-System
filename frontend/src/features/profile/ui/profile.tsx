import type { UserProfile } from '../model';

interface ProfileProps {
  profile: UserProfile;
}

export const Profile = ({ profile }: ProfileProps) => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-4xl">{profile.name}</h1>
      {profile.projects.map((project) => (
        <div
          className="flex w-64 flex-col gap-1 rounded-xl bg-white p-4 text-xl
            text-black"
        >
          <span>{project.name}</span>
          <p>{project.description}</p>
        </div>
      ))}
    </div>
  );
};
