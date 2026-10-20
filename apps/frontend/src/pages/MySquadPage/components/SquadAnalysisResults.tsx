import React from 'react';
import { ProcessedPlayer, SquadHorizon, UnderPerformer } from '@fpl/contracts/fpl';

import Button from '../../../components/Button';
import ErrorState from '../../../components/ErrorState';
import PositionBadge from '../../../components/PositionBadge';
import TeamBadge from '../../../components/TeamBadge';
import { ApiErrorBody } from '../../../features/api/types';
import { formatValue } from '../../../utils';

type SquadAnalysisResultsProps = {
  horizon: SquadHorizon;
  isLoading: boolean;
  error: ApiErrorBody | undefined;
  underPerformers: UnderPerformer[];
  teamNamesById: Record<number, string>;
  onRetry: () => void;
  onFindReplacements: (player: ProcessedPlayer) => void;
};

export const SquadAnalysisResults: React.FC<SquadAnalysisResultsProps> = ({
  horizon,
  isLoading,
  error,
  underPerformers,
  teamNamesById,
  onRetry,
  onFindReplacements,
}) => {
  return (
    <div className="analysis-results-card">
      <h3 className="analysis-results-card__title">Squad Underperformance Analysis</h3>
      {isLoading ? (
        <div className="analysis-results-card__loading">
          <div className="analysis-spinner" />
          <span>Running optimization algorithms against {horizon} horizon...</span>
        </div>
      ) : error ? (
        <ErrorState
          title="Analysis Error"
          message={error.message || "Could not analyze underperforming slots."}
          onRetry={onRetry}
        />
      ) : underPerformers.length === 0 ? (
        <div className="analysis-results-card__success">
          <span>No underperforming slots found! Your squad is fully optimized for price vs value.</span>
        </div>
      ) : (
        <div className="underperformers-grid">
          {underPerformers.map((up) => {
            const teamName = teamNamesById[up.player.generalInfo.team] || 'Unknown';
            return (
              <div key={up.player.generalInfo.id} className="underperformer-row">
                <div className="underperformer-row__identity">
                  <span className="underperformer-row__name">
                    {up.player.generalInfo.first_name} {up.player.generalInfo.web_name}
                  </span>
                  <div className="underperformer-row__meta">
                    <TeamBadge teamName={teamName} size="sm" showLabel />
                    <PositionBadge elementType={up.player.generalInfo.element_type} short />
                  </div>
                </div>

                <div className="underperformer-row__rank font-tabular">
                  Ranked <strong className="text-danger">{up.positionRank}</strong> of {up.positionCount}
                </div>

                <div className="underperformer-row__value font-tabular">
                  Value: <strong>{formatValue(up.value, 2)}</strong>
                </div>

                <div className="underperformer-row__action">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => onFindReplacements(up.player)}
                  >
                    Find Replacements
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SquadAnalysisResults;
