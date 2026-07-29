import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import ErrorPage from '../pages/ErrorPage';
import ErrorBoundary from './ErrorBoundary';
import { Routes } from './types';
export * from './hooks';

const HomePage = lazy(() => import('../pages/HomePage'));
const RankingPage = lazy(() => import('../pages/RankingPage'));
const BestTeamPage = lazy(() => import('../pages/BestTeamPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));

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
      {
        path: Routes.Ranking,
        element: <RankingPage />,
      },
      {
        path: Routes.BestTeam,
        element: <BestTeamPage />,
      },
      {
        path: Routes.About,
        element: <AboutPage />,
      },
      {
        path: '/*',
        element: <ErrorPage />,
      },
    ],
  },
]);
