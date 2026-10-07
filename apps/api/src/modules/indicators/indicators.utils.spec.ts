import { describe, it, expect } from 'vitest';
import {
  calculateIndicatorProgress,
  calculateIndicatorVariance,
  calculateIndicatorHealth,
  countUniqueParties,
  aggregateDisaggregations,
  generateDonorLogframeCsv,
} from './indicators.utils';

describe('Indicators Utils (IND-01 to IND-05)', () => {
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

  describe('calculateIndicatorVariance & calculateIndicatorHealth', () => {
    it('should compute variance and percentage', () => {
      const v1 = calculateIndicatorVariance(120, 100);
      expect(v1.varianceValue).toBe(20);
      expect(v1.variancePct).toBe(20);

      const v2 = calculateIndicatorVariance(80, 100);
      expect(v2.varianceValue).toBe(-20);
      expect(v2.variancePct).toBe(-20);
    });

    it('should assign health status appropriately', () => {
      expect(calculateIndicatorHealth(120, 100)).toBe('exceeded');
      expect(calculateIndicatorHealth(95, 100)).toBe('on_track');
      expect(calculateIndicatorHealth(75, 100)).toBe('warning');
      expect(calculateIndicatorHealth(50, 100)).toBe('off_track');
    });
  });

  describe('countUniqueParties (IND-05)', () => {
    it('should eliminate duplicate party IDs across multiple sources', () => {
      const serviceParties = ['party-1', 'party-2', 'party-3'];
      const enrollmentParties = ['party-2', 'party-4'];
      const caseParties = ['party-1', 'party-5'];

      const totalUnique = countUniqueParties(serviceParties, enrollmentParties, caseParties);
      expect(totalUnique).toBe(5);
    });

    it('should ignore null or undefined IDs', () => {
      const list1 = ['party-1', null as any];
      const list2 = [undefined as any, 'party-2'];

      expect(countUniqueParties(list1, list2)).toBe(2);
    });
  });

  describe('aggregateDisaggregations (IND-02)', () => {
    it('should sum disaggregation breakdown values across multiple observations', () => {
      const obs1 = {
        disaggregationData: {
          gender: { femme: 10, homme: 5 },
          ageGroup: { '18_29': 8, '30_49': 7 },
        },
      };
      const obs2 = {
        disaggregationData: {
          gender: { femme: 15, homme: 10, non_binaire: 2 },
          ageGroup: { '18_29': 12, '50_64': 13 },
        },
      };

      const agg = aggregateDisaggregations([obs1, obs2]);
      expect(agg.gender.femme).toBe(25);
      expect(agg.gender.homme).toBe(15);
      expect(agg.gender.non_binaire).toBe(2);
      expect(agg.ageGroup['18_29']).toBe(20);
      expect(agg.ageGroup['30_49']).toBe(7);
      expect(agg.ageGroup['50_64']).toBe(13);
    });
  });

  describe('generateDonorLogframeCsv (IND-04)', () => {
    it('should generate properly formatted CSV string', () => {
      const csv = generateDonorLogframeCsv('Projet Intégration', [
        {
          level: 'output',
          objectiveTitle: 'Ateliers d insertion',
          indicatorCode: 'IND-01',
          indicatorName: 'Participants formés',
          baseline: 0,
          target: 100,
          actual: 90,
          variancePct: -10,
          health: 'on_track',
          meansOfVerification: 'Feuilles d émargement',
          unit: 'personnes',
        },
      ]);

      expect(csv).toContain('RAPPORT DU CADRE LOGIQUE');
      expect(csv).toContain('"IND-01"');
      expect(csv).toContain('"Participants formés"');
      expect(csv).toContain('"-10%"');
    });
  });
});
