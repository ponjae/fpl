import { useState } from 'react';
import { ProcessedPlayer } from '@fpl/contracts/fpl';

import { SavedPick } from '../../../features/squad/hooks';

/**
 * Open/closed state for the three squad modals: the player picker, the
 * player actions menu and the transfer suggestions.
 */
export const useSquadModals = (picks: SavedPick[]) => {
  // Player picker
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerElementType, setPickerElementType] = useState<number>(1);
  const [pickerReplaceIndex, setPickerReplaceIndex] = useState<number | null>(null);

  // Player actions
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [activePlayer, setActivePlayer] = useState<ProcessedPlayer | null>(null);

  // Transfer suggestions
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [suggestPlayerOut, setSuggestPlayerOut] = useState<ProcessedPlayer | null>(null);

  const openPickerForSlot = (elementType: number) => {
    setPickerElementType(elementType);
    setPickerReplaceIndex(null);
    setIsPickerOpen(true);
  };

  const closePicker = () => {
    setIsPickerOpen(false);
    setPickerReplaceIndex(null);
  };

  const openActions = (player: ProcessedPlayer) => {
    setActivePlayer(player);
    setIsActionsOpen(true);
  };

  const closeActions = () => {
    setIsActionsOpen(false);
  };

  // Swap the actions menu for the picker, replacing the active player
  const replaceActivePlayer = () => {
    if (activePlayer) {
      setPickerElementType(activePlayer.generalInfo.element_type);
      const idx = picks.findIndex((p) => p.id === activePlayer.generalInfo.id);
      setPickerReplaceIndex(idx !== -1 ? idx : null);
      setIsActionsOpen(false);
      setIsPickerOpen(true);
    }
  };

  const openSuggestions = (player: ProcessedPlayer) => {
    setSuggestPlayerOut(player);
    setIsSuggestionsOpen(true);
  };

  const closeSuggestions = () => {
    setIsSuggestionsOpen(false);
    setSuggestPlayerOut(null);
  };

  return {
    isPickerOpen,
    pickerElementType,
    pickerReplaceIndex,
    openPickerForSlot,
    closePicker,
    isActionsOpen,
    activePlayer,
    openActions,
    closeActions,
    replaceActivePlayer,
    isSuggestionsOpen,
    suggestPlayerOut,
    openSuggestions,
    closeSuggestions,
  };
};
