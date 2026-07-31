import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_BUDGET } from '@fpl/contracts/fpl';

export interface SavedPick {
  id: number;
  starting: boolean;
  captain: boolean;
}

interface StoredPayload {
  version: number;
  picks: SavedPick[];
  budget?: number;
  freeTransfers?: number;
  bank?: number;
}

interface SquadState {
  picks: SavedPick[];
  budget: number;
  freeTransfers: number;
  bank: number;
}

const STORAGE_KEY = 'fpl_my_squad_v1';
const SCHEMA_VERSION = 3;

export const useSquadLocalStorage = () => {
  const [squadState, setSquadState] = useState<SquadState>({
    picks: [],
    budget: DEFAULT_BUDGET,
    freeTransfers: 1,
    bank: 0.0,
  });
  const [loaded, setLoaded] = useState(false);

  // Safe localStorage read
  const loadSquad = useCallback(() => {
    try {
      if (typeof window === 'undefined') return { picks: [], budget: DEFAULT_BUDGET, freeTransfers: 1, bank: 0.0 };
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (!data) return { picks: [], budget: DEFAULT_BUDGET, freeTransfers: 1, bank: 0.0 };

      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        const parsedVersion = parsed.version;
        const parsedPicks = Array.isArray(parsed.picks) ? parsed.picks : [];
        const parsedBudget = typeof parsed.budget === 'number' ? parsed.budget : DEFAULT_BUDGET;
        const parsedFreeTransfers = typeof parsed.freeTransfers === 'number' ? parsed.freeTransfers : 1;
        const parsedBank = typeof parsed.bank === 'number' ? parsed.bank : 0.0;

        if (parsedVersion === 1 || parsedVersion === 2 || parsedVersion === 3) {
          return {
            picks: parsedPicks,
            budget: parsedBudget,
            freeTransfers: parsedFreeTransfers,
            bank: parsedBank,
          };
        }
      }
    } catch (e) {
      console.error('Failed to read squad from localStorage:', e);
    }
    return { picks: [], budget: DEFAULT_BUDGET, freeTransfers: 1, bank: 0.0 };
  }, []);

  const saveSquadState = useCallback((newPicks: SavedPick[], newBudget: number, newFreeTransfers = 1, newBank = 0.0) => {
    setSquadState({ picks: newPicks, budget: newBudget, freeTransfers: newFreeTransfers, bank: newBank });
    try {
      if (typeof window !== 'undefined') {
        const payload: StoredPayload = {
          version: SCHEMA_VERSION,
          picks: newPicks,
          budget: newBudget,
          freeTransfers: newFreeTransfers,
          bank: newBank,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (e) {
      console.error('Failed to write squad to localStorage:', e);
    }
  }, []);

  const savePicks = useCallback((newPicks: SavedPick[]) => {
    setSquadState((current) => {
      const payload: StoredPayload = {
        version: SCHEMA_VERSION,
        picks: newPicks,
        budget: current.budget,
        freeTransfers: current.freeTransfers,
        bank: current.bank,
      };
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        }
      } catch (e) {
        console.error('Failed to write squad to localStorage:', e);
      }
      return { ...current, picks: newPicks };
    });
  }, []);

  const saveBudget = useCallback((newBudget: number) => {
    setSquadState((current) => {
      const payload: StoredPayload = {
        version: SCHEMA_VERSION,
        picks: current.picks,
        budget: newBudget,
        freeTransfers: current.freeTransfers,
        bank: current.bank,
      };
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        }
      } catch (e) {
        console.error('Failed to write squad to localStorage:', e);
      }
      return { ...current, budget: newBudget };
    });
  }, []);

  const saveFreeTransfers = useCallback((newFreeTransfers: number) => {
    setSquadState((current) => {
      const payload: StoredPayload = {
        version: SCHEMA_VERSION,
        picks: current.picks,
        budget: current.budget,
        freeTransfers: newFreeTransfers,
        bank: current.bank,
      };
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        }
      } catch (e) {
        console.error('Failed to write squad to localStorage:', e);
      }
      return { ...current, freeTransfers: newFreeTransfers };
    });
  }, []);

  const saveBank = useCallback((newBank: number) => {
    setSquadState((current) => {
      const payload: StoredPayload = {
        version: SCHEMA_VERSION,
        picks: current.picks,
        budget: current.budget,
        freeTransfers: current.freeTransfers,
        bank: newBank,
      };
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        }
      } catch (e) {
        console.error('Failed to write squad to localStorage:', e);
      }
      return { ...current, bank: newBank };
    });
  }, []);

  const clearPicks = useCallback(() => {
    saveSquadState([], DEFAULT_BUDGET, 1, 0.0);
  }, [saveSquadState]);

  // Initial load
  useEffect(() => {
    const initial = loadSquad();
    setSquadState(initial);
    setLoaded(true);
  }, [loadSquad]);

  return {
    picks: squadState.picks,
    budget: squadState.budget,
    freeTransfers: squadState.freeTransfers,
    bank: squadState.bank,
    savePicks,
    saveBudget,
    saveFreeTransfers,
    saveBank,
    clearPicks,
    loaded,
  };
};
