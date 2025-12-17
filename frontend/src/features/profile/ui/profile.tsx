import type { UserProfile } from '../model';
import type { Project } from '@/features/profile/model/profile.types.ts';
import { Link } from 'react-router';

interface ProfileProps {
  profile: UserProfile;
  projects: Project[];
}

export const Profile = ({ profile, projects }: ProfileProps) => {
  return (
    <div className="flex max-h-2/3 flex-col gap-4">
      <h1 className="text-4xl">{profile.username}</h1>
      <span className="text-3xl">{profile.email}</span>
      {projects.map((project) => (
        <Link to={`/${project.id}/board`} key={project.id}>
          <div
            className="flex w-64 flex-col gap-1 rounded-xl bg-white p-4 text-xl
              text-black"
          >
            <span>{project.name}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};
