import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { teamNameToBadgeKey } from './teams';

describe('teamNameToBadgeKey', () => {
  const cases: [string, string][] = [
    ['Arsenal', 'Arsenal.png'],
    ['Aston Villa', 'AstonVilla.png'],
    ['Bournemouth', 'Bournemouth.png'],
    ['Brentford', 'Brentford.png'],
    ['Brighton', 'Brighton.png'],
    ['Brighton & Hove Albion', 'Brighton.png'],
    ['Chelsea', 'Chelsea.png'],
    ['Coventry', 'Coventry.png'],
    ['Coventry City', 'Coventry.png'],
    ['Crystal Palace', 'CrystalPalace.png'],
    ['Everton', 'Everton.png'],
    ['Fulham', 'Fulham.png'],
    ['Hull', 'Hull.png'],
    ['Hull City', 'Hull.png'],
    ['Ipswich', 'Ipswich.png'],
    ['Ipswich Town', 'Ipswich.png'],
    ['Leeds', 'Leeds.png'],
    ['Leeds United', 'Leeds.png'],
    ['Liverpool', 'Liverpool.png'],
    ['Man City', 'ManCity.png'],
    ['Manchester City', 'ManCity.png'],
    ['Man Utd', 'ManUtd.png'],
    ['Manchester United', 'ManUtd.png'],
    ['Newcastle', 'Newcastle.png'],
    ['Newcastle United', 'Newcastle.png'],
    ["Nott'm Forest", "Nott'm Forest.png"],
    ['Nottingham Forest', "Nott'm Forest.png"],
    ['Spurs', 'Spurs.png'],
    ['Tottenham', 'Spurs.png'],
    ['Tottenham Hotspur', 'Spurs.png'],
    ['Sunderland', 'Sunderland.png'],
  ];

  it.each(cases)('maps "%s" → "%s"', (name, expected) => {
    expect(teamNameToBadgeKey(name)).toBe(expected);
  });

  it('returns empty string for unknown team name', () => {
    expect(teamNameToBadgeKey('Unknown FC')).toBe('');
  });

  // Relegated clubs: their badge assets were removed when the season turned,
  // so they must no longer resolve to a filename that does not exist on disk.
  it.each([['Burnley'], ['West Ham'], ['Wolves']])(
    'no longer maps relegated club "%s"',
    (name) => {
      expect(teamNameToBadgeKey(name)).toBe('');
    }
  );

  // Guards against the map drifting away from the assets on disk. Asserting
  // the mapping string alone is not enough: a mapped-but-missing file renders
  // as a broken badge at runtime while the unit test still passes.
  it('maps every team only to a badge file that exists on disk', () => {
    const badgeDir = join(__dirname, '..', 'assets', 'badges');
    const onDisk = new Set(readdirSync(badgeDir));
    const mapped = [...new Set(cases.map(([, file]) => file))];
    const missing = mapped.filter((file) => !onDisk.has(file));

    expect(missing).toEqual([]);
  });
});
