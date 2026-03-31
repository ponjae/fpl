import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import ErrorBoundary from './ErrorBoundary';
import { Routes } from './types';
export * from './hooks';

const HomePage = lazy(() => import('../pages/HomePage'));

const RootLayout: React.FC = () => (
  <ErrorBoundary>
    {/* <OverviewProvider> */}
    <PageLayout>
      <Suspense>
        <Outlet />
      </Suspense>
    </PageLayout>
    {/* </OverviewProvider> */}
  </ErrorBoundary>
);

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: Routes.Home,
        element: <HomePage />,
      },
    ],
  },
]);
