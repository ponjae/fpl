import {
  isPlayerSortKey,
  isSortDirection,
  PlayerSortKeys,
  ProcessedPlayer,
} from '@fpl/contracts/fpl';
import {
  normalizePosition,
  Routes,
} from '@fpl/contracts/self-service';
import { Decorators } from '@fpl/fpl-express';
import { Method } from '@fpl/network';
import { ApplicationController, Req, Res, toAppError } from '../../app';
import { parseIntParam } from '../../app/params';
import { FPLDataService } from '../../services/data';
import { GroupedPlayers, PlayerService } from '../../services/PlayerService';
import { TeamService } from '../../services/TeamService';

export class PlayerController extends ApplicationController {
  /**
   * Get all grouped players.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.Players)
  public async getPlayers(req: Req, res: Res<GroupedPlayers>): Promise<void> {
    const context = this.getContext();

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const playerService = context.getService(PlayerService, req);
    const groupedPlayers = await playerService.getPlayers(data);

    res.send(groupedPlayers);
  }

  /**
   * Get players by position.
   *
   * Accepts case-insensitive singular or plural position names, e.g.
   * `goalkeeper`, `Goalkeepers`, `mid`, `Midfielders`.
   *
   * Unknown position → 400.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.PlayersByPosition)
  public async getPlayersByPosition(
    req: Req,
    res: Res<ProcessedPlayer[]>
  ): Promise<void> {
    const context = this.getContext();
    const rawPosition = req.getParamValue('position');

    const canonicalPosition = normalizePosition(rawPosition);
    if (!canonicalPosition) {
      throw toAppError(
        `Unknown position '${rawPosition}'. Accepted values (case-insensitive): goalkeeper, defender, midfielder, forward (singular or plural).`,
        400,
        'validation'
      );
    }

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const playerService = context.getService(PlayerService, req);
    const players = await playerService.getPlayersByPosition(
      data,
      canonicalPosition
    );

    res.send(players ?? []);
  }

  /**
   * Get players by team.
   *
   * Unknown team ID → empty array (team has no players), non-numeric → 400.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.PlayersByTeam)
  public async getPlayersByTeam(
    req: Req,
    res: Res<ProcessedPlayer[]>
  ): Promise<void> {
    const context = this.getContext();
    const teamId = parseIntParam(req.getParamValue('teamId'), 'teamId');

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const teamService = context.getService(TeamService, req);
    const players = await teamService.getPlayersByTeam(data, teamId);

    res.send(players);
  }

  /**
   * Get the top N players ranked by a numeric field.
   *
   * Query params:
   *   - `sortKey`   (required) one of PlayerSortKeys, e.g. 'total_points', 'value5'.
   *   - `limit`     (optional) positive integer, defaults to 10.
   *   - `direction` (optional) 'asc' | 'desc', defaults to 'desc'.
   *
   * Players whose value is null for the chosen key (no fixtures in that
   * horizon) always rank last in descending order rather than as zero.
   *
   * Invalid sortKey/direction/limit → 400.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.TopPlayers)
  public async getTopPlayers(
    req: Req,
    res: Res<ProcessedPlayer[]>
  ): Promise<void> {
    const context = this.getContext();

    const sortKey = req.getQueryParamValue('sortKey');
    if (!isPlayerSortKey(sortKey)) {
      throw toAppError(
        `Query param 'sortKey' must be one of: ${PlayerSortKeys.join(', ')}`,
        400,
        'validation'
      );
    }

    const rawDirection = req.getQueryParamValue('direction') ?? 'desc';
    if (!isSortDirection(rawDirection)) {
      throw toAppError(
        `Query param 'direction' must be 'asc' or 'desc', got '${rawDirection}'`,
        400,
        'validation'
      );
    }

    const rawLimit = req.getQueryParamValue('limit');
    const limit = rawLimit === undefined ? 10 : parseIntParam(rawLimit, 'limit');
    if (limit <= 0) {
      throw toAppError(
        `Query param 'limit' must be a positive integer, got '${rawLimit}'`,
        400,
        'validation'
      );
    }

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const playerService = context.getService(PlayerService, req);
    const players = await playerService.getTopPlayers(
      data,
      sortKey,
      limit,
      rawDirection
    );

    res.send(players);
  }

  /**
   * Get specific player by ID.
   *
   * Non-numeric ID → 400. Unknown ID → 404.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.Player)
  public async getPlayer(req: Req, res: Res<ProcessedPlayer>): Promise<void> {
    const context = this.getContext();
    const id = parseIntParam(req.getParamValue('id'), 'id');

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const playerService = context.getService(PlayerService, req);
    const player = await playerService.getPlayer(data, id);

    if (!player) {
      throw toAppError(`Player with id ${id} not found`, 404, 'not_found');
    }

    res.send(player);
  }
}
