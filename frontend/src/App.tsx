import './App.css';

import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router';

import { router } from '@/Router.tsx';
import { store } from '@/store';

export const App = () => {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
};
