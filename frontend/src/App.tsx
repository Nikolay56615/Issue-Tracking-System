import './App.css';
import { BoardPage } from '@/features/board';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Routes } from './shared/constants/routes.ts';
import { AuthPage } from '@/features/auth';
import { ProfilePage } from '@/features/profile';
import { Provider } from 'react-redux';
import { store } from './store';
import { ProjectPage } from '@/features/project';
import { ProtectedLayout } from '@/layouts/ProtectedLayout.tsx';
import { ProfileLayout } from '@/layouts/profile-layout.tsx';

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
        path: Routes.PROJECT,
        element: <ProjectPage />,
      },
      {
        path: Routes.BOARD,
        element: <BoardPage />,
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
