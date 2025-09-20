import { createBrowserRouter } from 'react-router-dom';
import { CoTsListPage } from '../pages/cots/CotsListPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { UsersListPage } from '../pages/users/UsersListPage';
import { ProductsListPage } from '../pages/products/ProductsListPage';

export const router = createBrowserRouter([
  { path: '/', element: <CoTsListPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/users', element: <UsersListPage /> },
  { path: '/products', element: <ProductsListPage /> },
]);


