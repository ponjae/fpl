import { Routes } from '@fpl/contracts/self-service';
import { Decorators } from '@fpl/fpl-express';
import { Method } from '@fpl/network';
import { ApplicationController, Req, Res } from '../../app';
import { FPLDataService } from '../../services/data/FPLDataService';

export class DataController extends ApplicationController {
  /**
   * Manually trigger data refresh.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Post, Routes.RefreshData)
  public async refreshData(req: Req, res: Res): Promise<void> {
    const context = this.getContext();

    const dataService = context.getService(FPLDataService, req);

    await dataService.refresh();

    res.send(undefined, 204);
  }
}
