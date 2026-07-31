import React, { useEffect } from 'react';
import { ProcessedPlayer } from '@fpl/contracts/fpl';
import Button from '../../../../components/Button';
import TeamBadge from '../../../../components/TeamBadge';
import PositionBadge from '../../../../components/PositionBadge';
import { formatPrice } from '../../../../utils';
import './index.scss';

export type PlayerActionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  player: ProcessedPlayer | null;
  isStarting: boolean;
  isCaptain: boolean;
  onMakeCaptain: () => void;
  onToggleStarting: () => void;
  onReplace: () => void;
  onRemove: () => void;
  teamName: string;
};

export const PlayerActionsModal: React.FC<PlayerActionsModalProps> = ({
  isOpen,
  onClose,
  player,
  isStarting,
  isCaptain,
  onMakeCaptain,
  onToggleStarting,
  onReplace,
  onRemove,
  teamName,
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

  if (!isOpen || !player) return null;

  return (
    <div className="player-actions-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="player-actions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="player-actions-modal__header">
          <div className="player-actions-modal__identity">
            <h3 className="player-actions-modal__name">
              {player.generalInfo.first_name} {player.generalInfo.web_name}
            </h3>
            <div className="player-actions-modal__badges">
              <TeamBadge teamName={teamName} size="sm" showLabel />
              <PositionBadge elementType={player.generalInfo.element_type} short />
              <span className="player-actions-modal__price font-tabular">
                {formatPrice(player.generalInfo.now_cost)}
              </span>
            </div>
          </div>
          <button type="button" className="player-actions-modal__close-btn" onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </div>

        <div className="player-actions-modal__body">
          <div className="player-actions-grid">
            {/* Action 1: Make Captain */}
            {isStarting && (
              <div className="player-actions-card">
                <div className="player-actions-card__content">
                  <h4 className="player-actions-card__title">Captaincy</h4>
                  <p className="player-actions-card__desc">
                    {isCaptain 
                      ? 'This player is currently your squad captain.' 
                      : 'Appoint this player as your captain. They will receive double objective score.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={isCaptain ? 'ghost' : 'primary'}
                  size="md"
                  onClick={onMakeCaptain}
                  disabled={isCaptain}
                >
                  {isCaptain ? 'Active Captain' : 'Make Captain'}
                </Button>
              </div>
            )}

            {/* Action 2: Toggle Starting vs Bench */}
            <div className="player-actions-card">
              <div className="player-actions-card__content">
                <h4 className="player-actions-card__title">Squad Role</h4>
                <p className="player-actions-card__desc">
                  {isStarting
                    ? 'Move this player to the substitutes bench.'
                    : 'Promote this player to the active starting XI.'}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onToggleStarting}
              >
                {isStarting ? 'Move to Bench' : 'Move to Starting XI'}
              </Button>
            </div>

            {/* Action 3: Replace */}
            <div className="player-actions-card">
              <div className="player-actions-card__content">
                <h4 className="player-actions-card__title">Transfer Replacement</h4>
                <p className="player-actions-card__desc">
                  Find alternative same-position players and swap this player out.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onReplace}
              >
                Search Replacements
              </Button>
            </div>

            {/* Action 4: Remove */}
            <div className="player-actions-card player-actions-card--danger">
              <div className="player-actions-card__content">
                <h4 className="player-actions-card__title">Release Player</h4>
                <p className="player-actions-card__desc">
                  Release this player from your squad and leave their slot empty.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onRemove}
                className="btn--danger"
              >
                Remove from Squad
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerActionsModal;
