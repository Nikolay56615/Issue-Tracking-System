import './App.css';
import { BoardPage } from '@/features/board';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Routes } from './shared/constants/routes.ts';
import { AuthPage } from '@/features/auth';
import { ProfilePage } from '@/features/profile';
import { Provider } from 'react-redux';
import { store } from './store';
import { ProtectedLayout } from '@/layouts/ProtectedLayout.tsx';
import { ProfileLayout } from '@/layouts/profile-layout.tsx';
import { ProjectLayout } from '@/layouts/project-layout.tsx';
import { UsersPage } from '@/features/users/users-page.tsx';

const router = createBrowserRouter([
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
        ],
      },
    ],
  },
]);

export const App = () => {
  return (
    <>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </>
  );
};
