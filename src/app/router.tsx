import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { CoTsListPage } from '../pages/cots/CotsListPage';
import { CotsDetailPage } from '../pages/cots/CotsDetailPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { UsersListPage } from '../pages/users/UsersListPage';
import { ProductsListPage } from '../pages/products/ProductsListPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <CoTsListPage /> },
      { path: 'cots/:id', element: <CotsDetailPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'users', element: <UsersListPage /> },
      { path: 'products', element: <ProductsListPage /> },
    ],
  },
]);


