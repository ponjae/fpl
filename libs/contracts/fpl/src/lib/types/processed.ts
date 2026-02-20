import { GameweekData, FixturesByGameweek, ReadableFixture } from './fixture';
import { TeamPlayerDict, PositionPlayerDict, ProcessedPlayer } from './player';
import { TeamDataDict } from './team';

/**
 * The complete processed data structure used internally in the application.
 */
export type ProcessedData = {
  players: PlayerDict;
  gameweeks: GameweekData;
  fixtures: FixturesByGameweek;
  readableFixtures: ReadableFixture;
  teamData: TeamDataDict;
  idTeamDict: Record<number, string>;
  idPositionDict: Record<number, string>;
  currentGameweek: number;
  lastUpdated: Date;
};

/**
 * Dictionary type for processed players.
 */
export type PlayerDict = {
  byTeam: TeamPlayerDict;
  byPosition: PositionPlayerDict;
  byId: Record<number, ProcessedPlayer>;
};
