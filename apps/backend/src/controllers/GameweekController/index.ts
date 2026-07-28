import { GameweekData, GameweekDataEntry } from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { Decorators } from '@fpl/fpl-express';
import { Method } from '@fpl/network';
import { ApplicationController, Req, Res, toAppError } from '../../app';
import { parseIntParam } from '../../app/params';
import { FPLDataService } from '../../services/data/FPLDataService';
import { GameweekService } from '../../services/GameweekService';

export class GameweekController extends ApplicationController {
  /**
   * Get all gameweeks.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.Gameweeks)
  public async getGameweeks(req: Req, res: Res<GameweekData>): Promise<void> {
    const context = this.getContext();

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const gameweekService = context.getService(GameweekService, req);
    const gameweeks = gameweekService.getAllGameweeks(data.gameweeks);

    res.send(gameweeks);
  }

  /**
   * Get the current gameweek.
   *
   * This route MUST be registered before `/gameweeks/:id` in Express so that
   * the literal segment `current` is not swallowed by the `:id` wildcard.
   * Method order in this class guarantees that — decorators are applied
   * top-to-bottom, and the Map preserves insertion order.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.CurrentGameweek)
  public async getCurrentGameweek(
    req: Req,
    res: Res<GameweekDataEntry>
  ): Promise<void> {
    const context = this.getContext();

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const gameweekService = context.getService(GameweekService, req);
    const gameweek = gameweekService.getCurrentGameweek(
      data.gameweeks,
      data.currentGameweek
    );

    if (!gameweek) {
      throw toAppError('Current gameweek data is unavailable', 404, 'not_found');
    }

    res.send(gameweek);
  }

  /**
   * Get a single gameweek by ID.
   *
   * Non-numeric `:id` → 400. Unknown gameweek → 404.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.Gameweek)
  public async getGameweek(
    req: Req,
    res: Res<GameweekDataEntry>
  ): Promise<void> {
    const context = this.getContext();
    const id = parseIntParam(req.getParamValue('id'), 'id');

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const gameweekService = context.getService(GameweekService, req);
    const gameweek = gameweekService.getGameweek(data.gameweeks, id);

    if (!gameweek) {
      throw toAppError(`Gameweek ${id} not found`, 404, 'not_found');
    }

    res.send(gameweek);
  }
}
