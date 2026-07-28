import { GameweekData } from '@fpl/contracts/fpl';
import { describe, it, expect } from 'vitest';
import { GameweekService } from '../../services/GameweekService';

// Minimal stub — ApplicationService only needs getContext() which we won't call.
class FakeContext {
  getService() {
    return this;
  }
}

function makeService(): GameweekService {
  const svc = new GameweekService();
  svc._init(new FakeContext() as never);
  return svc;
}

const mockGameweeks: GameweekData = {
  1: {
    id: 1,
    average_entry_score: 45,
    finished: true,
    highest_score: 120,
    top_element_info: { id: 1, points: 20 },
    most_captained: 5,
    chip_plays: [],
  },
  2: {
    id: 2,
    average_entry_score: 50,
    finished: false,
    highest_score: 130,
    top_element_info: { id: 2, points: 22 },
    most_captained: 3,
    chip_plays: [],
  },
};

describe('GameweekService', () => {
  describe('getAllGameweeks', () => {
    it('returns all gameweeks', () => {
      const svc = makeService();
      expect(svc.getAllGameweeks(mockGameweeks)).toEqual(mockGameweeks);
    });
  });

  describe('getGameweek', () => {
    it('returns the correct gameweek by id', () => {
      const svc = makeService();
      expect(svc.getGameweek(mockGameweeks, 1)).toEqual(mockGameweeks[1]);
    });

    it('returns undefined for unknown id', () => {
      const svc = makeService();
      expect(svc.getGameweek(mockGameweeks, 99)).toBeUndefined();
    });
  });

  describe('getCurrentGameweek', () => {
    it('returns the gameweek matching currentGameweek', () => {
      const svc = makeService();
      expect(svc.getCurrentGameweek(mockGameweeks, 2)).toEqual(
        mockGameweeks[2]
      );
    });

    it('returns undefined when currentGameweek has no data', () => {
      const svc = makeService();
      expect(svc.getCurrentGameweek(mockGameweeks, 38)).toBeUndefined();
    });
  });
});
