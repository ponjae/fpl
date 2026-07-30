export const Routes = {
  Home: '/',
  Players: '/players',
  PlayerDetail: '/players/:id',
  Teams: '/teams',
  TeamDetail: '/teams/:id',
  Fixtures: '/fixtures',
  Optimizer: '/optimizer',
  MySquad: '/my-squad',
  About: '/about',
  Ranking: '/ranking',
  BestTeam: '/best-team',
} as const;
export type Route = (typeof Routes)[keyof typeof Routes];
