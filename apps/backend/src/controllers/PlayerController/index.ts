import { RawPlayer } from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { Decorators } from '@fpl/fpl-express';
import { Method } from '@fpl/network';
import { ApplicationController, Req, Res } from '../../app';
import { DataService } from '../../services/data';

export class PlayerController extends ApplicationController {
  /**
   * Get all players.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.Players)
  public async getPlayers(req: Req, res: Res<RawPlayer[]>): Promise<void> {
    const context = this.getContext();
    const dataService = context.getService(DataService, req);

    const { allData } = await dataService.getData();

    const players = allData.elements;

    res.send(players);
  }
}
