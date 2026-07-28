import { FixtureEntry } from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { Decorators } from '@fpl/fpl-express';
import { Method } from '@fpl/network';
import { ApplicationController, Req, Res } from '../../app';
import { parseIntParam } from '../../app/params';
import { FPLDataService } from '../../services/data/FPLDataService';
import { FixtureService } from '../../services/FixtureService';

export class FixtureController extends ApplicationController {
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
   * Non-numeric `:gw` → 400.
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
    const gameWeek = parseIntParam(req.getParamValue('gw'), 'gw');

    const dataService = context.getService(FPLDataService, req);
    const data = await dataService.getData();

    const fixtureService = context.getService(FixtureService, req);
    const fixtures = fixtureService.getFixturesByGameweek(data, gameWeek);

    res.send(fixtures);
  }

  /**
   * Get upcoming fixtures for a team.
   *
   * Non-numeric `:teamId` or `:count` → 400.
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
    const teamId = parseIntParam(req.getParamValue('teamId'), 'teamId');
    const count = parseIntParam(req.getParamValue('count'), 'count');

    const dataService = context.getService(FPLDataService, req);
    const data = await dataService.getData();

    const fixtureService = context.getService(FixtureService, req);
    const fixtures = fixtureService.getUpcomingFixtures(data, teamId, count);

    res.send(fixtures);
  }
}
