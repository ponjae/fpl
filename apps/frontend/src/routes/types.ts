export const Routes = {
  Home: '/',
  Ranking: '/ranking',
  BestTeam: '/best-team',
  About: '/about',
} as const;
export type Route = (typeof Routes)[keyof typeof Routes];
