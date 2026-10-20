import React, { useEffect } from 'react';
import { ProcessedPlayer, TransferSuggestion } from '@fpl/contracts/fpl';
import Button from '../../../../components/Button';
import ErrorState from '../../../../components/ErrorState';
import PositionBadge from '../../../../components/PositionBadge';
import TeamBadge from '../../../../components/TeamBadge';
import { formatPrice, formatValue } from '../../../../utils';
import './index.scss';

export type TransferSuggestionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  playerOut: ProcessedPlayer | null;
  suggestions: TransferSuggestion[];
  isLoading: boolean;
  error: { message?: string } | undefined;
  budgetRemaining: number;
  teamNamesById: Record<number, string>;
  onApplyTransfer: (playerIn: ProcessedPlayer) => void;
};

export const TransferSuggestionsModal: React.FC<
  TransferSuggestionsModalProps
> = ({
  isOpen,
  onClose,
  playerOut,
  suggestions,
  isLoading,
  error,
  budgetRemaining,
  teamNamesById,
  onApplyTransfer,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !playerOut) return null;

  const playerOutTeam = teamNamesById[playerOut.generalInfo.team] || 'Unknown';

  return (
    <div
      className="transfer-suggestions-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="transfer-suggestions-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="transfer-suggestions-modal__header">
          <div className="transfer-suggestions-modal__title-row">
            <h3 className="transfer-suggestions-modal__title">
              Suggested Replacements
            </h3>
            <span className="transfer-suggestions-modal__subtitle">
              For {playerOut.generalInfo.web_name}
            </span>
          </div>
          <button
            type="button"
            className="transfer-suggestions-modal__close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <div className="transfer-suggestions-modal__body">
          {/* Player Out Details Card */}
          <div className="player-out-card">
            <div className="player-out-card__label">Transferring Out:</div>
            <div className="player-out-card__main">
              <div className="player-out-card__identity">
                <span className="player-out-card__name">
                  {playerOut.generalInfo.first_name}{' '}
                  {playerOut.generalInfo.web_name}
                </span>
                <div className="player-out-card__meta">
                  <TeamBadge teamName={playerOutTeam} size="sm" showLabel />
                  <PositionBadge
                    elementType={playerOut.generalInfo.element_type}
                    short
                  />
                </div>
              </div>
              <div className="player-out-card__stats">
                <div className="player-out-card__stat">
                  <span className="player-out-card__stat-lbl">Price</span>
                  <span className="player-out-card__stat-val font-tabular">
                    {formatPrice(playerOut.generalInfo.now_cost)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Results section */}
          <div className="transfer-suggestions-modal__results">
            {isLoading ? (
              <div className="suggestions-loading">
                <div className="suggestions-shimmer" />
                <div className="suggestions-shimmer" />
                <div className="suggestions-shimmer" />
              </div>
            ) : error ? (
              <ErrorState
                title="Failed to Load Suggestions"
                message={
                  error.message ||
                  'An unexpected error occurred while fetching replacements.'
                }
              />
            ) : suggestions.length === 0 ? (
              <div className="transfer-suggestions-modal__empty">
                No suitable replacement candidates found within budget limit.
              </div>
            ) : (
              <div className="suggestions-list">
                {suggestions.map((suggestion) => {
                  const playerIn = suggestion.playerIn;
                  const playerInTeam =
                    teamNamesById[playerIn.generalInfo.team] || 'Unknown';
                  const costDelta = suggestion.costDelta;
                  const isAffordable = costDelta <= budgetRemaining;
                  const valueGain = suggestion.valueGain;

                  return (
                    <div
                      key={playerIn.generalInfo.id}
                      className="suggestion-row"
                    >
                      <div className="suggestion-row__identity">
                        <span className="suggestion-row__name">
                          {playerIn.generalInfo.first_name}{' '}
                          {playerIn.generalInfo.web_name}
                        </span>
                        <div className="suggestion-row__meta">
                          <TeamBadge
                            teamName={playerInTeam}
                            size="sm"
                            showLabel
                          />
                          <PositionBadge
                            elementType={playerIn.generalInfo.element_type}
                            short
                          />
                        </div>
                      </div>

                      <div className="suggestion-row__metrics">
                        {/* Value Gain */}
                        <div className="suggestion-row__metric">
                          <span className="suggestion-row__metric-lbl">
                            Value Gain
                          </span>
                          <span
                            className={`suggestion-row__metric-val font-tabular ${
                              valueGain > 0
                                ? 'text-success'
                                : valueGain < 0
                                ? 'text-danger'
                                : ''
                            }`}
                          >
                            {valueGain > 0 ? '+' : ''}
                            {formatValue(valueGain, 2)}
                          </span>
                        </div>

                        {/* Cost & Delta */}
                        <div className="suggestion-row__metric">
                          <span className="suggestion-row__metric-lbl">
                            Cost / Delta
                          </span>
                          <span className="suggestion-row__metric-val font-tabular">
                            {formatPrice(playerIn.generalInfo.now_cost)}
                            <span
                              className={`suggestion-row__cost-delta ${
                                costDelta > 0 ? 'text-warning' : 'text-success'
                              }`}
                            >
                              ({costDelta > 0 ? '+' : ''}
                              {formatPrice(costDelta)})
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="suggestion-row__action">
                        <Button
                          type="button"
                          variant={isAffordable ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => onApplyTransfer(playerIn)}
                          disabled={!isAffordable}
                        >
                          {isAffordable ? 'Swap Player' : 'No Budget'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferSuggestionsModal;
