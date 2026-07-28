import {
  isObject,
  isObjectOfType,
  isString,
  isNumber,
  isDate,
} from '@fpl/utils';
import { PlayerDict, ProcessedData, ProcessedPlayer } from '../types';
import {
  isGameweekData,
  isFixturesByGameweek,
  isReadableFixture,
} from './fixture';
import {
  isPositionPlayerDict,
  isTeamPlayerDict,
  isProcessedPlayer,
} from './player';
import { isTeamDataDict } from './team';

const isProcessedPlayerDict = (
  obj: unknown
): obj is Record<number, ProcessedPlayer> =>
  isObjectOfType(obj, isNumber, isProcessedPlayer);

/**
 * Check if p is a PlayerDict.
 *
 * @param p - the value to check.
 *
 * @returns true if p is a PlayerDict, false otherwise.
 */
export const isPlayerDict = (p: unknown): p is PlayerDict =>
  isObject(p) &&
  isTeamPlayerDict(p.byTeam) &&
  isPositionPlayerDict(p.byPosition) &&
  isProcessedPlayerDict(p.byId);

const isIdTeamDict = (obj: unknown): obj is Record<number, string> =>
  isObjectOfType(obj, isNumber, isString);

const isIdPositionDict = (obj: unknown): obj is Record<number, string> =>
  isObjectOfType(obj, isNumber, isString);

/**
 * Check if p is a ProcessedData.
 *
 * @param p - the value to check.
 *
 * @returns true if p is a ProcessedData, false otherwise.
 */
export const isProcessedData = (p: unknown): p is ProcessedData =>
  isObject(p) &&
  isPlayerDict(p.players) &&
  isGameweekData(p.gameweeks) &&
  isFixturesByGameweek(p.fixtures) &&
  isReadableFixture(p.readableFixtures) &&
  isTeamDataDict(p.teamData) &&
  isIdTeamDict(p.idTeamDict) &&
  isIdPositionDict(p.idPositionDict) &&
  isNumber(p.currentGameweek) &&
  isDate(p.lastUpdated);
