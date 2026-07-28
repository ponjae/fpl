import {
  isSquadHorizon,
  OptimalSquad,
  OptimizeSquadOptions,
  SquadHorizons,
  SquadHorizon,
} from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { Decorators } from '@fpl/fpl-express';
import { Method } from '@fpl/network';
import { ApplicationController, Req, Res, toAppError } from '../../app';
import { FPLDataService } from '../../services/data';
import { SquadOptimizerService } from '../../services/SquadOptimizerService';

/**
 * Parse and validate the optional `horizon` value.
 *
 * @param raw - the raw value from a query string or request body.
 *
 * @returns the validated horizon, defaulting to 'value5'.
 */
const parseHorizon = (raw: unknown): SquadHorizon => {
  if (raw === undefined || raw === null || raw === '') {
    return 'value5';
  }
  if (!isSquadHorizon(raw)) {
    throw toAppError(
      `'horizon' must be one of: ${SquadHorizons.join(', ')}`,
      400,
      'validation'
    );
  }
  return raw;
};

/**
 * Parse and validate the optional `budget` value.
 *
 * @param raw - the raw value from a query string or request body.
 *
 * @returns the validated budget in millions, defaulting to 100.
 */
const parseBudget = (raw: unknown): number => {
  if (raw === undefined || raw === null || raw === '') {
    return 100;
  }
  const budget = Number(raw);
  if (!Number.isFinite(budget) || budget <= 0) {
    throw toAppError(
      `'budget' must be a positive number, got '${raw}'`,
      400,
      'validation'
    );
  }
  return budget;
};

/**
 * Parse an optional array of player IDs.
 *
 * @param raw - the raw value from a request body.
 * @param field - the field name, used in error messages.
 *
 * @returns the validated ID list, or an empty array.
 */
const parseIdList = (raw: unknown, field: string): number[] => {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (!Array.isArray(raw) || raw.some((v) => !Number.isInteger(v))) {
    throw toAppError(
      `'${field}' must be an array of integer player IDs`,
      400,
      'validation'
    );
  }
  return raw as number[];
};

export class SquadController extends ApplicationController {
  /**
   * Get the optimal 15-player squad using default settings.
   *
   * Query params:
   *   - `horizon` (optional) 'value' | 'value5' | 'value_remaining'. Default 'value5'.
   *   - `budget`  (optional) positive number in millions. Default 100.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Get, Routes.OptimalSquad)
  public async getOptimalSquad(
    req: Req,
    res: Res<OptimalSquad>
  ): Promise<void> {
    const context = this.getContext();

    const horizon = parseHorizon(req.getQueryParamValue('horizon'));
    const budget = parseBudget(req.getQueryParamValue('budget'));

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const optimizer = context.getService(SquadOptimizerService, req);
    const squad = optimizer.optimize(data, { horizon, budget });

    res.send(squad);
  }

  /**
   * Build an optimal squad with custom constraints.
   *
   * Body (all fields optional):
   *   - `horizon`       'value' | 'value5' | 'value_remaining'
   *   - `budget`        positive number in millions
   *   - `benchWeight`   weight for outfield bench players
   *   - `benchGkWeight` weight for the bench goalkeeper
   *   - `include`       player IDs that must be in the squad
   *   - `exclude`       player IDs that must not be in the squad
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Post, Routes.OptimizeSquad)
  public async optimizeSquad(
    req: Req,
    res: Res<OptimalSquad>
  ): Promise<void> {
    const context = this.getContext();
    const body = (req.getBody() ?? {}) as Record<string, unknown>;

    const options: OptimizeSquadOptions = {
      horizon: parseHorizon(body.horizon),
      budget: parseBudget(body.budget),
      include: parseIdList(body.include, 'include'),
      exclude: parseIdList(body.exclude, 'exclude'),
    };

    if (body.benchWeight !== undefined) {
      const weight = Number(body.benchWeight);
      if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
        throw toAppError(
          `'benchWeight' must be a number between 0 and 1`,
          400,
          'validation'
        );
      }
      options.benchWeight = weight;
    }

    if (body.benchGkWeight !== undefined) {
      const weight = Number(body.benchGkWeight);
      if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
        throw toAppError(
          `'benchGkWeight' must be a number between 0 and 1`,
          400,
          'validation'
        );
      }
      options.benchGkWeight = weight;
    }

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const optimizer = context.getService(SquadOptimizerService, req);
    const squad = optimizer.optimize(data, options);

    res.send(squad);
  }
}
