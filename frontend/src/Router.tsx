import { createBrowserRouter } from 'react-router';

import { AuthPage } from '@/features/auth';
import { BoardPage } from '@/features/board';
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
            path: Routes.TRASH,
            element: <TrashPage />,
          },
        ],
      },
    ],
  },
]);
