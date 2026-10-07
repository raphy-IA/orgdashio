import { describe, it, expect } from 'vitest';
import { calculateIndicatorProgress, countUniqueParties } from './indicators.utils';

describe('Indicators Utils (IND-01 & IND-05)', () => {
  describe('calculateIndicatorProgress', () => {
    it('should calculate progress percentage accurately', () => {
      expect(calculateIndicatorProgress(50, 100)).toBe(50);
      expect(calculateIndicatorProgress(75, 100)).toBe(75);
      expect(calculateIndicatorProgress(1, 3)).toBe(33.3);
    });

    it('should return 0 if target value is zero or negative', () => {
      expect(calculateIndicatorProgress(50, 0)).toBe(0);
      expect(calculateIndicatorProgress(50, -10)).toBe(0);
    });
  });

  describe('countUniqueParties (IND-05)', () => {
    it('should eliminate duplicate party IDs across multiple sources', () => {
      const serviceParties = ['party-1', 'party-2', 'party-3'];
      const enrollmentParties = ['party-2', 'party-4'];
      const caseParties = ['party-1', 'party-5'];

      const totalUnique = countUniqueParties(serviceParties, enrollmentParties, caseParties);
      expect(totalUnique).toBe(5); // party-1, party-2, party-3, party-4, party-5
    });

    it('should ignore null or undefined IDs', () => {
      const list1 = ['party-1', null as any];
      const list2 = [undefined as any, 'party-2'];

      expect(countUniqueParties(list1, list2)).toBe(2);
    });
  });
});
