import { createBrowserRouter } from 'react-router';

import { AuthPage } from '@/features/auth';
import { AdminPage } from '@/features/admin';
import { BoardPage } from '@/features/board';
import { ProjectSettingsPage } from '@/features/project-config';
import { ProfilePage } from '@/features/profile';
import { TrashPage } from '@/features/trash';
import { UsersPage } from '@/features/users';
import { ProtectedLayout } from '@/layouts/ProtectedLayout.tsx';
import { ProfileLayout } from '@/layouts/profile-layout.tsx';
import { ProjectLayout } from '@/layouts/project-layout.tsx';
import { Routes } from '@/shared/constants/routes.ts';

export const router = createBrowserRouter([
  {
    path: Routes.AUTH,
    element: <AuthPage />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <ProfileLayout />,
        children: [
          {
            path: Routes.PROFILE,
            element: <ProfilePage />,
          },
          {
            path: Routes.ADMIN,
            element: <AdminPage />,
          },
        ],
      },
      {
        element: <ProjectLayout />,
        children: [
          {
            path: Routes.BOARD,
            element: <BoardPage />,
          },
          {
            path: Routes.USERS,
            element: <UsersPage />,
          },
          {
            path: Routes.SETTINGS,
            element: <ProjectSettingsPage />,
          },
          {
            path: Routes.TRASH,
            element: <TrashPage />,
          },
        ],
      },
    ],
  },
]);
