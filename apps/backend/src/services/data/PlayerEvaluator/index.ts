import { ProcessedPlayer, PlayerValue } from '@fpl/contracts/fpl';
import { ApplicationService } from '../../../app';

export class PlayerEvaluator extends ApplicationService {
  /**
   * Gameweek factor multiplier based on fixture congestion.
   * Positive values = double/triple gameweeks (better)
   * Negative values = blank gameweeks (worse)
   */
  private readonly GW_FACTOR: Record<number, number> = {
    0: 1, // Normal gameweek
    1: 2, // One extra game (double gameweek)
    '-1': 0.5, // One less game (blank gameweek)
    2: 3, // Two extra games (triple gameweek)
    '-2': 0.25, // Two less games
  };

  /**
   * Calculate player value for all three timeframes (1GW, 5GW, remaining).
   *
   * The formula for each horizon is:
   *   `(historyValue + (form * games) / fdrSum) * multiplier`
   * where:
   *   - `historyValue` = totalPoints / gameweeksLapsed (season average)
   *   - `fdrSum` is the SUM of fixture difficulties across the horizon
   *   - `multiplier` adjusts for double/blank gameweeks
   *   - returns `null` when no games are scheduled in that horizon
   *
   * @param player - the processed player to evaluate.
   * @param gameweeksLapsed - gameweeks actually played so far this season.
   *   Must be at least 1; see FPLDataService.getGameweeksLapsed for how this is
   *   derived, including the preseason case.
   *
   * @returns the player value object with value, value5, and value_remaining.
   */
  public calculatePlayerValue(
    player: ProcessedPlayer,
    gameweeksLapsed: number
  ): PlayerValue {
    const { fixtureData, playerStats, games } = player;

    const lapsed = Math.max(1, gameweeksLapsed);

    return {
      value: this.calculateFormValue(
        playerStats.form,
        games.games_next_gw,
        1,
        fixtureData.fdr1 ?? 0,
        playerStats.total_points,
        lapsed
      ),
      value5: this.calculateFormValue(
        playerStats.form,
        games.games_next_five,
        5,
        fixtureData.fdr5 ?? 0,
        playerStats.total_points,
        lapsed
      ),
      value_remaining: this.calculateFormValue(
        playerStats.form,
        games.total_games_remaining,
        games.total_games_remaining,
        fixtureData.fdr_remaining ?? 0,
        playerStats.total_points,
        gameweeksLapsed
      ),
    };
  }

  /**
   * Calculate form-based value for a player considering FDR and fixture congestion.
   *
   * Returns `null` when `games === 0` (no fixtures in the horizon) to distinguish
   * "no data" from a genuinely low score.
   *
   * @param form - Player form.
   * @param games - Games to be played in the timeframe.
   * @param shouldPlay - Expected games (normally matches the timeframe).
   * @param fdr - Sum of fixture difficulty ratings over the horizon.
   * @param totalPoints - Total points so far.
   * @param gameweeksLapsed - Gameweeks played so far (season progress).
   *
   * @returns the calculated value, or null if no games are scheduled.
   */
  private calculateFormValue(
    form: number,
    games: number,
    shouldPlay: number,
    fdr: number,
    totalPoints: number,
    gameweeksLapsed: number
  ): number | null {
    // Return null if no games remaining in this horizon
    if (games === 0) {
      return null;
    }

    // Historic average performance
    const historyValue = totalPoints / gameweeksLapsed;

    // Calculate fixture congestion factor (positive = more games than expected)
    const gwFactor = games - shouldPlay;
    const multiplier = this.GW_FACTOR[gwFactor] ?? 1;

    // Prevent division by zero for FDR sum
    const safeFdr = fdr === 0 ? 1 : fdr;

    // Combined value: historical performance + form weighted by fixtures and FDR sum
    return (historyValue + (form * games) / safeFdr) * multiplier;
  }
}
