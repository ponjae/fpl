import {
  isSquadHorizon,
  SquadHorizon,
  SquadHorizons,
  TransferSuggestion,
  UnderPerformer,
} from '@fpl/contracts/fpl';
import { Routes } from '@fpl/contracts/self-service';
import { Decorators } from '@fpl/fpl-express';
import { Method } from '@fpl/network';
import { ApplicationController, Req, Res, toAppError } from '../../app';
import { FPLDataService } from '../../services/data';
import { TransferService } from '../../services/TransferService';

/**
 * Parse and validate the optional `horizon` field.
 *
 * @param raw - the raw value from a request body.
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

export class TransferController extends ApplicationController {
  /**
   * Suggest replacements for a player being transferred out.
   *
   * Body:
   *   - `playerOutId` (required) integer player ID.
   *   - `budget`      (optional) money in the bank, in millions. Default 0.
   *   - `horizon`     (optional) value horizon. Default 'value5'.
   *   - `limit`       (optional) max suggestions. Default 5.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Post, Routes.TransferSuggestions)
  public async suggestTransfers(
    req: Req,
    res: Res<TransferSuggestion[]>
  ): Promise<void> {
    const context = this.getContext();
    const body = (req.getBody() ?? {}) as Record<string, unknown>;

    if (!Number.isInteger(body.playerOutId)) {
      throw toAppError(
        `'playerOutId' is required and must be an integer player ID`,
        400,
        'validation'
      );
    }
    const playerOutId = body.playerOutId as number;

    const budget = body.budget === undefined ? 0 : Number(body.budget);
    if (!Number.isFinite(budget) || budget < 0) {
      throw toAppError(
        `'budget' must be a non-negative number`,
        400,
        'validation'
      );
    }

    const limit = body.limit === undefined ? 5 : Number(body.limit);
    if (!Number.isInteger(limit) || limit <= 0) {
      throw toAppError(
        `'limit' must be a positive integer`,
        400,
        'validation'
      );
    }

    const horizon = parseHorizon(body.horizon);

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    if (!data.players.byId[playerOutId]) {
      throw toAppError(
        `Player with id ${playerOutId} not found`,
        404,
        'not_found'
      );
    }

    const transferService = context.getService(TransferService, req);
    const suggestions = transferService.suggestTransfers(data, {
      playerOutId,
      budget,
      horizon,
      limit,
    });

    res.send(suggestions);
  }

  /**
   * Identify underperformers in a squad.
   *
   * Body:
   *   - `playerIds` (required) array of integer player IDs.
   *   - `horizon`   (optional) value horizon. Default 'value5'.
   *
   * @param req - the request object.
   * @param res - the response object.
   */
  @Decorators.Route(Method.Post, Routes.UnderPerformers)
  public async getUnderPerformers(
    req: Req,
    res: Res<UnderPerformer[]>
  ): Promise<void> {
    const context = this.getContext();
    const body = (req.getBody() ?? {}) as Record<string, unknown>;

    if (
      !Array.isArray(body.playerIds) ||
      body.playerIds.some((v) => !Number.isInteger(v))
    ) {
      throw toAppError(
        `'playerIds' is required and must be an array of integer player IDs`,
        400,
        'validation'
      );
    }

    const horizon = parseHorizon(body.horizon);

    const fplDataService = context.getService(FPLDataService, req);
    const data = await fplDataService.getData();

    const transferService = context.getService(TransferService, req);
    const underPerformers = transferService.findUnderPerformers(
      data,
      body.playerIds as number[],
      horizon
    );

    res.send(underPerformers);
  }
}
