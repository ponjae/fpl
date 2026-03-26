import { FixtureEntry } from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { Decorators } from '@fpl/fpl-express';
import { Method } from '@fpl/network';
import { ApplicationController, Req, Res } from '../../app';
import { FPLDataService } from '../../services/data/FPLDataService';
import { FixtureService } from '../../services/FixtureService';

export class FixtureController extends ApplicationController {
  @Decorators.Route(Method.Get, Routes.Fixtures)

  /**
   * Get all fixtures across all gameweeks.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.Fixtures)
  public async getFixtures(req: Req, res: Res<FixtureEntry[]>): Promise<void> {
    const context = this.getContext();

    const dataService = context.getService(FPLDataService, req);
    const data = await dataService.getData();

    const fixtureService = context.getService(FixtureService, req);
    const fixtures = fixtureService.getAllFixtures(data);

    res.send(fixtures);
  }

  /**
   * Get fixtures for a specific gameweek.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.FixturesByGameweek)
  public async getFixturesByGameweek(
    req: Req,
    res: Res<FixtureEntry[]>
  ): Promise<void> {
    const context = this.getContext();
    const gameWeek = req.getParamValue('gw');

    const dataService = context.getService(FPLDataService, req);
    const data = await dataService.getData();

    const fixtureService = context.getService(FixtureService, req);
    const fixtures = fixtureService.getFixturesByGameweek(
      data,
      Number(gameWeek)
    );

    res.send(fixtures);
  }

  /**
   * Get upcoming fixtures for a team.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.UpcomingFixturesByTeam)
  public async getUpcomingFixturesByTeam(
    req: Req,
    res: Res<FixtureEntry[]>
  ): Promise<void> {
    const context = this.getContext();
    const teamId = req.getParamValue('teamId');
    const count = req.getParamValue('count');

    const dataService = context.getService(FPLDataService, req);
    const data = await dataService.getData();

    const fixtureService = context.getService(FixtureService, req);
    const fixtures = fixtureService.getUpcomingFixtures(
      data,
      Number(teamId),
      Number(count)
    );

    res.send(fixtures);
  }
}
