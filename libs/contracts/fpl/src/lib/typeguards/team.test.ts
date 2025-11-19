import { describe, it, expect } from 'vitest';
import { isTeamData, isTeamDataDict } from './team';

const team = {
  name: 'Liverpool',
  nickname: 'The Reds',
  city: 'Liverpool',
  arena: 'Anfield',
  coach: 'Arne Slot',
  pl_titles: '20',
};

describe('team typeguards', () => {
  describe('isTeamData', () => {
    it('should return true for valid TeamData', () => {
      expect(isTeamData(team)).toBe(true);
    });

    it('should return false for invalid TeamData', () => {
      const invalidTeam = {
        name: 'Liverpool',
        nickname: 'The Reds',
        city: 'Liverpool',
      };
      expect(isTeamData(invalidTeam)).toBe(false);
    });
  });

  describe('isTeamDataDict', () => {
    it('should return true for valid TeamDataDict', () => {
      const teamDict = {
        liverpool: team,
      };
      expect(isTeamDataDict(teamDict)).toBe(true);
    });

    it('should return false for invalid TeamDataDict', () => {
      const invalidTeamDict = {
        liverpool: {
          name: 'Liverpool',
          nickname: 'The Reds',
        },
      };
      expect(isTeamDataDict(invalidTeamDict)).toBe(false);
    });
  });
});
