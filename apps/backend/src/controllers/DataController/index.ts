import { Routes } from '@fpl/contracts/self-service';
import { Decorators } from '@fpl/fpl-express';
import { Method } from '@fpl/network';
import { ApplicationController, Req, Res } from '../../app';
import { FPLDataService } from '../../services/data/FPLDataService';

/** Response body for POST /api/data/refresh */
export type RefreshDataResponse = {
  /** ISO-8601 timestamp of when the data was refreshed. */
  refreshedAt: string;
};

export class DataController extends ApplicationController {
  /**
   * Manually trigger data refresh.
   *
   * Returns 200 with `{ refreshedAt: <ISO string> }` so the client can
   * display when the data was last refreshed.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Post, Routes.RefreshData)
  public async refreshData(
    req: Req,
    res: Res<RefreshDataResponse>
  ): Promise<void> {
    const context = this.getContext();

    const dataService = context.getService(FPLDataService, req);
    await dataService.refresh();

    res.send({ refreshedAt: new Date().toISOString() });
  }
}
