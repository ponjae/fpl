import { getPath, Routes, BasePath } from './routes';

describe('getPath', () => {
  it('should return the full path with parameters substituted', () => {
    expect(
      getPath(Routes.Team, {
        id: 'teamA',
      })
    ).toBe(`${BasePath}/teams/teamA`);
  });

  it('should return the full path without parameters if no params provided', () => {
    expect(getPath(Routes.Teams)).toBe(`${BasePath}/teams`);
  });
});
