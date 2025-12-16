import './App.css';
import { BoardPage } from '@/features/board';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Routes } from './shared/constants/routes.ts';
import { AuthPage } from '@/features/auth';
import { ProfilePage } from '@/features/profile';
import { Provider } from 'react-redux';
import { store } from './store';
import { ProjectPage } from '@/features/project';

const router = createBrowserRouter([
  {
    path: '/',
    element: <BoardPage />,
  },
  {
    path: Routes.AUTH,
    element: <AuthPage />,
  },
  {
    path: Routes.PROFILE,
    element: <ProfilePage />,
  },
  {
    path: Routes.PROJECT,
    element: <ProjectPage />,
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
