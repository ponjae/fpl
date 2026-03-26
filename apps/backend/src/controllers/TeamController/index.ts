import { TeamData, TeamDataDict } from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { Decorators } from '@fpl/fpl-express';
import { Method } from '@fpl/network';
import { ApplicationController, Req, Res } from '../../app';
import { FPLDataService } from '../../services/data/FPLDataService';
import { TeamService } from '../../services/TeamService';

export class TeamController extends ApplicationController {
  /**
   * Get all teams.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.Teams)
  public async getTeams(req: Req, res: Res<TeamDataDict>): Promise<void> {
    const context = this.getContext();

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const teamService = context.getService(TeamService, req);
    const teams = await teamService.getAllTeams(data);

    res.send(teams);
  }

  /**
   * Get a team by ID.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.Team)
  public async getTeam(req: Req, res: Res<TeamData>): Promise<void> {
    const context = this.getContext();
    const teamId = req.getParamValue('id');

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const teamService = context.getService(TeamService, req);
    const team = await teamService.getTeam(data, Number(teamId));

    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }

    res.send(team);
  }
}
