import { ProcessedPlayer } from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { Decorators } from '@fpl/fpl-express';
import { Method } from '@fpl/network';
import { ApplicationController, Req, Res } from '../../app';
import { FPLDataService } from '../../services/data';
import { GroupedPlayers, PlayerService } from '../../services/PlayerService';

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
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.PlayersByPosition)
  public async getPlayersByPosition(
    req: Req,
    res: Res<ProcessedPlayer[]>
  ): Promise<void> {
    const context = this.getContext();
    const position = req.getParamValue('position');

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const playerService = context.getService(PlayerService, req);
    const players = await playerService.getPlayersByPosition(data, position);

    res.send(players);
  }

  /**
   * Get players by team.
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
    const teamId = req.getParamValue('teamId');

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const playerService = context.getService(PlayerService, req);
    const players = await playerService.getPlayersByTeam(data, teamId);

    res.send(players);
  }

  /**
   * Get specific player by ID.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.Player)
  public async getPlayer(req: Req, res: Res<ProcessedPlayer>): Promise<void> {
    const context = this.getContext();
    const id = req.getParamValue('id');

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const playerService = context.getService(PlayerService, req);
    const player = await playerService.getPlayer(data, Number(id));

    res.send(player);
  }
}
