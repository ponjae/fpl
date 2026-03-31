export const Routes = {
  Home: '/home',
} as const;
export type Route = (typeof Routes)[keyof typeof Routes];
