import React from 'react';
import { SQUAD_SIZE } from '@fpl/contracts/fpl';

import Button from '../../../components/Button';
import {
  FREE_TRANSFER_OPTIONS,
  getPlannerNote,
} from '../../../features/squad/freeTransfers';
import { SavedPick } from '../../../features/squad/hooks';
import { BANK_MAX, BANK_MIN } from '../utils/money';
import MoneyStepper from './MoneyStepper';

type TransferPlannerCardProps = {
  picks: SavedPick[];
  freeTransfers: number;
  onFreeTransfersChange: (freeTransfers: number) => void;
  bank: number;
  onBankChange: (bank: number) => void;
  isSquadValid: boolean;
  isLoading: boolean;
  isPlanLoading: boolean;
  onPlan: () => void;
};

export const TransferPlannerCard: React.FC<TransferPlannerCardProps> = ({
  picks,
  freeTransfers,
  onFreeTransfersChange,
  bank,
  onBankChange,
  isSquadValid,
  isLoading,
  isPlanLoading,
  onPlan,
}) => {
  return (
    <div className="validation-card">
      <h3 className="validation-card__title">Plan transfers</h3>
      <p className="validation-card__hint">
        Plans all moves together, so selling one player can fund an
        upgrade in another position.
      </p>

      {/* Free transfers */}
      <div className="optimizer-control-group">
        <span
          className="optimizer-control-label"
          id="free-transfers-label"
        >
          Free transfers
        </span>
        <div
          className="free-transfers-picker"
          role="group"
          aria-labelledby="free-transfers-label"
        >
          {FREE_TRANSFER_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={`free-transfers-picker__btn ${
                freeTransfers === n
                  ? 'free-transfers-picker__btn--active'
                  : ''
              }`}
              onClick={() => onFreeTransfersChange(n)}
              disabled={isLoading}
              aria-pressed={freeTransfers === n}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Bank */}
      <div className="optimizer-control-group">
        <label className="optimizer-control-label" htmlFor="bank-input">
          In the bank (£m)
        </label>
        <MoneyStepper
          id="bank-input"
          value={bank}
          min={BANK_MIN}
          max={BANK_MAX}
          disabled={isLoading}
          onChange={onBankChange}
        />
      </div>

      <div className="validation-card__actions" style={{ marginTop: 0 }}>
        <Button
          type="button"
          variant="primary"
          onClick={onPlan}
          disabled={
            !isSquadValid ||
            picks.length !== SQUAD_SIZE ||
            isLoading ||
            isPlanLoading
          }
          loading={isPlanLoading}
          className="analyze-btn"
        >
          Plan transfers
        </Button>
      </div>

      {picks.length !== SQUAD_SIZE && (
        <p className="validation-card__hint">
          Complete your {SQUAD_SIZE}-player squad to plan transfers.
        </p>
      )}

      <p className="validation-card__note">
        {getPlannerNote(freeTransfers)}{' '}
        {picks.some((p) => p.sellingPrice !== undefined)
          ? 'Players without a selling price fall back to their current price.'
          : 'Sale proceeds are estimated from each player\u2019s current price, which may differ from your actual selling price.'}
      </p>
    </div>
  );
};

export default TransferPlannerCard;
