import { ProcessedPlayer, PlayerValue } from '@fpl/contracts/fpl';
import { ApplicationService } from '../../../app';

export class PlayerEvaluator extends ApplicationService {
  private readonly GAMEWEEKS_IN_SEASON = 38;

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
   * @param player - the processed player to evaluate.
   *
   * @returns the player value object with value, value5, and value_remaining.
   */
  public calculatePlayerValue(player: ProcessedPlayer): PlayerValue {
    const { fixtureData, playerStats, games, generalInfo } = player;

    const gameweeksLapsed = Math.max(
      1,
      this.GAMEWEEKS_IN_SEASON - games.total_games_remaining
    );

    const position = generalInfo.element_type;

    let value: number;
    let value5: number;
    let valueRemaining: number;

    // Position-specific evaluation
    switch (position) {
      case 1: // Goalkeeper
        [value, value5, valueRemaining] = this.evaluateGoalkeeper(
          fixtureData.fdr1 ?? 0,
          fixtureData.fdr5 ?? 0,
          fixtureData.fdr_remaining ?? 0,
          games.games_next_gw,
          games.games_next_five,
          games.total_games_remaining,
          gameweeksLapsed,
          playerStats.total_points,
          playerStats.form,
          playerStats.clean_sheets,
          playerStats.saves,
          playerStats.penalties_saved,
          playerStats.assists,
          playerStats.goals_scored
        );
        break;

      case 2: // Defender
        [value, value5, valueRemaining] = this.evaluateDefender(
          fixtureData.fdr1 ?? 0,
          fixtureData.fdr5 ?? 0,
          fixtureData.fdr_remaining ?? 0,
          games.games_next_gw,
          games.games_next_five,
          games.total_games_remaining,
          gameweeksLapsed,
          playerStats.total_points,
          playerStats.form,
          playerStats.clean_sheets,
          playerStats.goals_scored,
          playerStats.assists
        );
        break;

      case 3: // Midfielder
        [value, value5, valueRemaining] = this.evaluateMidfielder(
          fixtureData.fdr1 ?? 0,
          fixtureData.fdr5 ?? 0,
          fixtureData.fdr_remaining ?? 0,
          games.games_next_gw,
          games.games_next_five,
          games.total_games_remaining,
          gameweeksLapsed,
          playerStats.total_points,
          playerStats.form,
          playerStats.clean_sheets,
          playerStats.goals_scored,
          playerStats.assists
        );
        break;

      case 4: // Forward
        [value, value5, valueRemaining] = this.evaluateForward(
          fixtureData.fdr1 ?? 0,
          fixtureData.fdr5 ?? 0,
          fixtureData.fdr_remaining ?? 0,
          games.games_next_gw,
          games.games_next_five,
          games.total_games_remaining,
          gameweeksLapsed,
          playerStats.total_points,
          playerStats.form,
          playerStats.goals_scored,
          playerStats.assists
        );
        break;

      default:
        // Unknown position, return neutral values
        value = 0;
        value5 = 0;
        valueRemaining = 0;
    }

    return {
      value,
      value5,
      value_remaining: valueRemaining,
    };
  }

  /**
   * Evaluate a goalkeeper's value.
   *
   * @param fdr1 - FDR rating for next gameweek.
   * @param fdr5 - FDR rating for next 5 gameweeks.
   * @param fdrRemaining - FDR rating for remaining gameweeks.
   * @param gamesNextGw - Games in next gameweek.
   * @param gamesNextFive - Games in next five gameweeks.
   * @param totalGamesRemaining - Total remaining games.
   * @param gameweeksLapsed - Gameweeks played so far.
   * @param totalPoints - Total points accumulated.
   * @param form - Player form.
   * @param cleanSheets - Number of clean sheets.
   * @param saves - Number of saves made.
   * @param penaltiesSaved - Penalties saved.
   * @param assists - Assists made.
   * @param goalsScored - Goals scored.
   *
   * @returns tuple of [value1, value5, valueRemaining].
   */
  private evaluateGoalkeeper(
    fdr1: number,
    fdr5: number,
    fdrRemaining: number,
    gamesNextGw: number,
    gamesNextFive: number,
    totalGamesRemaining: number,
    gameweeksLapsed: number,
    totalPoints: number,
    form: number,
    cleanSheets: number,
    saves: number,
    penaltiesSaved: number,
    assists: number,
    goalsScored: number
  ): [number, number, number] {
    // Goalkeeper-specific value calculation
    // saves % 3 (point per 3 saves) + cleanSheets * 4 + penalties * 5 + assists * 3 + goals * 6
    const goalkeeperValue =
      (Math.floor(saves / 3) +
        cleanSheets * 4 +
        penaltiesSaved * 5 +
        assists * 3 +
        goalsScored * 6) /
      gameweeksLapsed;

    // Next gameweek
    const value1 = this.calculateFormValue(
      form,
      gamesNextGw,
      1,
      fdr1,
      totalPoints,
      gameweeksLapsed,
      goalkeeperValue
    );

    // Next five gameweeks
    const value5 = this.calculateFormValue(
      form,
      gamesNextFive,
      5,
      fdr5,
      totalPoints,
      gameweeksLapsed,
      goalkeeperValue
    );

    // Remaining games
    const valueRemaining = this.calculateFormValue(
      form,
      totalGamesRemaining,
      totalGamesRemaining,
      fdrRemaining,
      totalPoints,
      gameweeksLapsed,
      goalkeeperValue
    );

    return [value1, value5, valueRemaining];
  }

  /**
   * Evaluate a defender's value.
   *
   * @param fdr1 - FDR rating for next gameweek.
   * @param fdr5 - FDR rating for next 5 gameweeks.
   * @param fdrRemaining - FDR rating for remaining gameweeks.
   * @param gamesNextGw - Games in next gameweek.
   * @param gamesNextFive - Games in next five gameweeks.
   * @param totalGamesRemaining - Total remaining games.
   * @param gameweeksLapsed - Gameweeks played so far.
   * @param totalPoints - Total points accumulated.
   * @param form - Player form.
   * @param cleanSheets - Number of clean sheets.
   * @param goalsScored - Goals scored.
   * @param assists - Assists made.
   *
   * @returns tuple of [value1, value5, valueRemaining].
   */
  private evaluateDefender(
    fdr1: number,
    fdr5: number,
    fdrRemaining: number,
    gamesNextGw: number,
    gamesNextFive: number,
    totalGamesRemaining: number,
    gameweeksLapsed: number,
    totalPoints: number,
    form: number,
    cleanSheets: number,
    goalsScored: number,
    assists: number
  ): [number, number, number] {
    // Defender-specific value calculation goals * 6 + cleanSheets * 4 + assists * 3
    const defenderValue =
      (goalsScored * 6 + cleanSheets * 4 + assists * 3) / gameweeksLapsed;

    // Next gameweek
    const value1 = this.calculateFormValue(
      form,
      gamesNextGw,
      1,
      fdr1,
      totalPoints,
      gameweeksLapsed,
      defenderValue
    );

    // Next five gameweeks
    const value5 = this.calculateFormValue(
      form,
      gamesNextFive,
      5,
      fdr5,
      totalPoints,
      gameweeksLapsed,
      defenderValue
    );

    // Remaining games
    const valueRemaining = this.calculateFormValue(
      form,
      totalGamesRemaining,
      totalGamesRemaining,
      fdrRemaining,
      totalPoints,
      gameweeksLapsed,
      defenderValue
    );

    return [value1, value5, valueRemaining];
  }

  /**
   * Evaluate a midfielder's value.
   *
   * @param fdr1 - FDR rating for next gameweek.
   * @param fdr5 - FDR rating for next 5 gameweeks.
   * @param fdrRemaining - FDR rating for remaining gameweeks.
   * @param gamesNextGw - Games in next gameweek.
   * @param gamesNextFive - Games in next five gameweeks.
   * @param totalGamesRemaining - Total remaining games.
   * @param gameweeksLapsed - Gameweeks played so far.
   * @param totalPoints - Total points accumulated.
   * @param form - Player form.
   * @param cleanSheets - Number of clean sheets.
   * @param goalsScored - Goals scored.
   * @param assists - Assists made.
   *
   * @returns tuple of [value1, value5, valueRemaining].
   */
  private evaluateMidfielder(
    fdr1: number,
    fdr5: number,
    fdrRemaining: number,
    gamesNextGw: number,
    gamesNextFive: number,
    totalGamesRemaining: number,
    gameweeksLapsed: number,
    totalPoints: number,
    form: number,
    cleanSheets: number,
    goalsScored: number,
    assists: number
  ): [number, number, number] {
    // Midfielder-specific value calculation goals * 5 + cleanSheets * 1 + assists * 3
    const midfielderValue =
      (goalsScored * 5 + cleanSheets * 1 + assists * 3) / gameweeksLapsed;

    // Next gameweek
    const value1 = this.calculateFormValue(
      form,
      gamesNextGw,
      1,
      fdr1,
      totalPoints,
      gameweeksLapsed,
      midfielderValue
    );

    // Next five gameweeks
    const value5 = this.calculateFormValue(
      form,
      gamesNextFive,
      5,
      fdr5,
      totalPoints,
      gameweeksLapsed,
      midfielderValue
    );

    // Remaining games
    const valueRemaining = this.calculateFormValue(
      form,
      totalGamesRemaining,
      totalGamesRemaining,
      fdrRemaining,
      totalPoints,
      gameweeksLapsed,
      midfielderValue
    );

    return [value1, value5, valueRemaining];
  }

  /**
   * Evaluate a forward's value.
   *
   * @param fdr1 - FDR rating for next gameweek.
   * @param fdr5 - FDR rating for next 5 gameweeks.
   * @param fdrRemaining - FDR rating for remaining gameweeks.
   * @param gamesNextGw - Games in next gameweek.
   * @param gamesNextFive - Games in next five gameweeks.
   * @param totalGamesRemaining - Total remaining games.
   * @param gameweeksLapsed - Gameweeks played so far.
   * @param totalPoints - Total points accumulated.
   * @param form - Player form.
   * @param goalsScored - Goals scored.
   * @param assists - Assists made.
   *
   * @returns tuple of [value1, value5, valueRemaining].
   */
  private evaluateForward(
    fdr1: number,
    fdr5: number,
    fdrRemaining: number,
    gamesNextGw: number,
    gamesNextFive: number,
    totalGamesRemaining: number,
    gameweeksLapsed: number,
    totalPoints: number,
    form: number,
    goalsScored: number,
    assists: number
  ): [number, number, number] {
    // Forward-specific value calculation goals * 4 + assists * 3
    const forwardValue = (goalsScored * 4 + assists * 3) / gameweeksLapsed;

    // Next gameweek
    const value1 = this.calculateFormValue(
      form,
      gamesNextGw,
      1,
      fdr1,
      totalPoints,
      gameweeksLapsed,
      forwardValue
    );

    // Next five gameweeks
    const value5 = this.calculateFormValue(
      form,
      gamesNextFive,
      5,
      fdr5,
      totalPoints,
      gameweeksLapsed,
      forwardValue
    );

    // Remaining games
    const valueRemaining = this.calculateFormValue(
      form,
      totalGamesRemaining,
      totalGamesRemaining,
      fdrRemaining,
      totalPoints,
      gameweeksLapsed,
      forwardValue
    );

    return [value1, value5, valueRemaining];
  }

  /**
   * Calculate form-based value for a player considering FDR and fixture congestion.
   *
   * @param form - Player form.
   * @param games - Games to be played in the timeframe.
   * @param shouldPlay - Expected games (normally matches the timeframe).
   * @param fdr - Fixture difficulty rating.
   * @param totalPoints - Total points so far.
   * @param gameweeksLapsed - Gameweeks played so far.
   * @param positionValue - Position-specific calculated value.
   *
   * @returns the calculated value, or -1 if no games remaining.
   */
  private calculateFormValue(
    form: number,
    games: number,
    shouldPlay: number,
    fdr: number,
    totalPoints: number,
    gameweeksLapsed: number,
    _positionValue: number
  ): number {
    // Return -1 if no games remaining
    if (games === 0) {
      return -1;
    }

    // Historic average performance
    const historyValue = totalPoints / gameweeksLapsed;

    // Calculate fixture congestion factor (positive = more games than expected)
    const gwFactor = games - shouldPlay;
    const multiplier = this.GW_FACTOR[gwFactor] ?? 1;

    // Prevent division by zero for FDR
    const safeFdr = fdr === 0 ? 1 : fdr;

    // Combined value: historical performance + form weighted by fixtures and FDR
    return (historyValue + (form * games) / safeFdr) * multiplier;
  }
}
