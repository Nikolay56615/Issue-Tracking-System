import './App.css';
import { BoardPage } from './features/board/board-page.tsx';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Routes } from './shared/constants/routes.ts';
import { AuthPage } from './features/auth/auth-page.tsx';
import { ProfilePage } from './features/profile/profile-page.tsx';
import { Provider } from 'react-redux';
import { store } from './store';
import { ProjectPage } from './features/project/project-page.tsx';

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
