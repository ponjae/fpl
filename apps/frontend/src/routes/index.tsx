import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import ErrorPage from '../pages/ErrorPage';
import ErrorBoundary from './ErrorBoundary';
import { Routes } from './types';
export * from './hooks';

const HomePage = lazy(() => import('../pages/HomePage'));
const PlayersPage = lazy(() => import('../pages/PlayersPage'));
const StatsPage = lazy(() => import('../pages/StatsPage'));
const PlayerDetailPage = lazy(() => import('../pages/PlayerDetailPage'));
const TeamsPage = lazy(() => import('../pages/TeamsPage'));
const TeamDetailPage = lazy(() => import('../pages/TeamDetailPage'));
const FixturesPage = lazy(() => import('../pages/FixturesPage'));
const OptimizerPage = lazy(() => import('../pages/OptimizerPage'));
const MySquadPage = lazy(() => import('../pages/MySquadPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));

const RootLayout: React.FC = () => (
  <ErrorBoundary>
    <PageLayout>
      <Suspense>
        <Outlet />
      </Suspense>
    </PageLayout>
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
        path: Routes.Players,
        element: <PlayersPage />,
      },
      {
        path: Routes.Stats,
        element: <StatsPage />,
      },
      {
        path: Routes.PlayerDetail,
        element: <PlayerDetailPage />,
      },
      {
        path: Routes.Teams,
        element: <TeamsPage />,
      },
      {
        path: Routes.TeamDetail,
        element: <TeamDetailPage />,
      },
      {
        path: Routes.Fixtures,
        element: <FixturesPage />,
      },
      {
        path: Routes.Optimizer,
        element: <OptimizerPage />,
      },
      {
        path: Routes.MySquad,
        element: <MySquadPage />,
      },
      {
        path: Routes.About,
        element: <AboutPage />,
      },
      {
        path: Routes.Ranking,
        element: <Navigate to={Routes.Players} replace />,
      },
      {
        path: Routes.BestTeam,
        element: <Navigate to={Routes.Optimizer} replace />,
      },
      {
        path: '/*',
        element: <ErrorPage />,
      },
    ],
  },
]);
