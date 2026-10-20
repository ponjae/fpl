import React from 'react';
import { ProcessedPlayer } from '@fpl/contracts/fpl';

import Button from '../../../components/Button';
import PositionBadge from '../../../components/PositionBadge';
import { SavedPick } from '../../../features/squad/hooks';
import { formatPrice } from '../../../utils';

type SellingPricesAccordionProps = {
  isOpen: boolean;
  onToggle: () => void;
  picks: SavedPick[];
  playersMap: Record<number, ProcessedPlayer>;
  onSellingPriceChange: (playerId: number, raw: string) => void;
  onReset: () => void;
};

export const SellingPricesAccordion: React.FC<SellingPricesAccordionProps> = ({
  isOpen,
  onToggle,
  picks,
  playersMap,
  onSellingPriceChange,
  onReset,
}) => {
  const knownPicks = picks.filter((p) => !!playersMap[p.id]);

  return (
    <div className="selling-prices-accordion">
      <button
        type="button"
        className="selling-prices-accordion__toggle"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>Selling prices (optional)</span>
        <span className="selling-prices-accordion__chevron">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && (
        <div className="selling-prices-accordion__body">
          <p className="selling-prices-accordion__desc">
            FPL refunds only part of a price rise, so your selling
            price can be lower than the current price. Leave a
            player blank to use their current price.
          </p>
          {knownPicks.length > 0 && (
            <>
              <p className="selling-prices-accordion__count">
                {picks.filter((p) => p.sellingPrice !== undefined).length} of{' '}
                {picks.length} set
              </p>
              <div className="selling-prices-list">
                {knownPicks.map((p) => {
                  const player = playersMap[p.id];
                  return (
                    <div key={p.id} className="selling-prices-list__row">
                      <PositionBadge
                        elementType={player.generalInfo.element_type}
                        short
                      />
                      <span className="selling-prices-list__name">
                        {player.generalInfo.web_name}
                      </span>
                      <span className="selling-prices-list__current">
                        {formatPrice(player.generalInfo.now_cost)}
                      </span>
                      <input
                        type="number"
                        className="selling-prices-list__input"
                        step={0.1}
                        min={0.1}
                        max={20}
                        placeholder={String(player.generalInfo.now_cost / 10)}
                        value={p.sellingPrice ?? ''}
                        onChange={(e) =>
                          onSellingPriceChange(p.id, e.target.value)
                        }
                      />
                    </div>
                  );
                })}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={onReset}
                disabled={picks.every((p) => p.sellingPrice === undefined)}
              >
                Reset to current prices
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SellingPricesAccordion;
