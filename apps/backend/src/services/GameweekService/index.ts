import { GameweekData, GameweekDataEntry } from '@fpl/contracts/fpl';
import { ApplicationService } from '../../app';

export class GameweekService extends ApplicationService {
  /**
   * Get all gameweeks.
   *
   * @param gameweeks - the gameweek dictionary from ProcessedData.
   *
   * @returns all gameweek entries as a dictionary.
   */
  public getAllGameweeks(gameweeks: GameweekData): GameweekData {
    return gameweeks;
  }

  /**
   * Get a single gameweek by ID.
   *
   * @param gameweeks - the gameweek dictionary from ProcessedData.
   * @param id - the gameweek ID (1–38).
   *
   * @returns the gameweek entry, or `undefined` if not found.
   */
  public getGameweek(
    gameweeks: GameweekData,
    id: number
  ): GameweekDataEntry | undefined {
    return gameweeks[id];
  }

  /**
   * Get the current gameweek entry.
   *
   * @param gameweeks - the gameweek dictionary from ProcessedData.
   * @param currentGameweek - the current gameweek number from ProcessedData.
   *
   * @returns the current gameweek entry, or `undefined` if unavailable.
   */
  public getCurrentGameweek(
    gameweeks: GameweekData,
    currentGameweek: number
  ): GameweekDataEntry | undefined {
    return gameweeks[currentGameweek];
  }
}
