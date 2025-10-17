import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { CoTsListPage } from '../pages/cots/CotsListPage';
import { CotsDetailPage } from '../pages/cots/CotsDetailPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { UsersListPage } from '../pages/users/UsersListPage';
import { UsersDetailPage } from '../pages/users/UsersDetailPage';
import { ProductsListPage } from '../pages/products/ProductsListPage';
import { ProductsDetailPage } from '../pages/products/ProductsDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <CoTsListPage /> },
      { path: 'cots/:id', element: <CotsDetailPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'users', element: <UsersListPage /> },
      { path: 'users/:id', element: <UsersDetailPage /> },
      { path: 'products', element: <ProductsListPage /> },
      { path: 'products/:id', element: <ProductsDetailPage /> },
    ],
  },
]);


