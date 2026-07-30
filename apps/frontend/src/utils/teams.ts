/**
 * Utilities for resolving team names to badge asset filenames.
 *
 * Badge files live in `apps/frontend/src/assets/badges/`.
 * The filenames do NOT follow a simple slug of the backend team name, so this
 * module maintains an explicit lookup map covering every badge present.
 *
 * Badge files present (as of last audit):
 *   Arsenal.png, AstonVilla.png, Bournemouth.png, Brentford.png,
 *   Brighton.png, Chelsea.png, Coventry.png, CrystalPalace.png,
 *   Everton.png, Fulham.png, Hull.png, Ipswich.png, Leeds.png,
 *   Liverpool.png, ManCity.png, ManUtd.png, Newcastle.png,
 *   Nott'm Forest.png, Spurs.png, Sunderland.png
 *
 * NOTE: this set tracks the current Premier League season. Promoted and
 * relegated clubs change it every year, so when the season turns, add the
 * promoted clubs' badges and drop the relegated ones, then update both this
 * map and its test. The keys must match the `name` values returned by
 * `/api/teams/names` exactly — the live API uses e.g. "Coventry City" and
 * "Ipswich Town", not the short forms.
 */

/**
 * Explicit map from backend team name → badge filename (without the path
 * prefix; include the `.png` extension).
 *
 * Backend names are the `name` field returned by `/api/teams/names`.
 * Multiple aliases for the same club are listed where the backend name may
 * differ across seasons or data sources.
 */
const TEAM_NAME_TO_BADGE: Record<string, string> = {
  Arsenal: 'Arsenal.png',
  'Aston Villa': 'AstonVilla.png',
  Bournemouth: 'Bournemouth.png',
  Brentford: 'Brentford.png',
  Brighton: 'Brighton.png',
  'Brighton & Hove Albion': 'Brighton.png',
  Chelsea: 'Chelsea.png',
  Coventry: 'Coventry.png',
  'Coventry City': 'Coventry.png',
  'Crystal Palace': 'CrystalPalace.png',
  Everton: 'Everton.png',
  Fulham: 'Fulham.png',
  Hull: 'Hull.png',
  'Hull City': 'Hull.png',
  Ipswich: 'Ipswich.png',
  'Ipswich Town': 'Ipswich.png',
  Leeds: 'Leeds.png',
  'Leeds United': 'Leeds.png',
  Liverpool: 'Liverpool.png',
  'Man City': 'ManCity.png',
  'Manchester City': 'ManCity.png',
  'Man Utd': 'ManUtd.png',
  'Manchester United': 'ManUtd.png',
  Newcastle: 'Newcastle.png',
  'Newcastle United': 'Newcastle.png',
  "Nott'm Forest": "Nott'm Forest.png",
  'Nottingham Forest': "Nott'm Forest.png",
  Spurs: 'Spurs.png',
  Tottenham: 'Spurs.png',
  'Tottenham Hotspur': 'Spurs.png',
  Sunderland: 'Sunderland.png',
};

/**
 * Resolve a backend team name to the corresponding badge filename.
 *
 * @param teamName - the team name as returned by the backend API.
 * @returns the badge filename (e.g. `"ManUtd.png"`), or `""` if unknown.
 */
export const teamNameToBadgeKey = (teamName: string): string =>
  TEAM_NAME_TO_BADGE[teamName] ?? '';
