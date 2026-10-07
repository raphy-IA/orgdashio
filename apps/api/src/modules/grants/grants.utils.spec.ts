import { describe, it, expect } from 'vitest';
import {
  calculateGrantWinRate,
  calculateInstallmentProgress,
  evaluateDeliverableUrgency,
} from './grants.utils';

describe('Grants Utils (R2.1 Subventions & Bailleurs)', () => {
  describe('calculateGrantWinRate', () => {
    it('should compute win rate accurately on decided grants', () => {
      const grants = [
        { status: 'approved' },
        { status: 'approved' },
        { status: 'rejected' },
        { status: 'drafting' },
        { status: 'submitted' },
      ];

      const res = calculateGrantWinRate(grants);
      expect(res.wonCount).toBe(2);
      expect(res.rejectedCount).toBe(1);
      expect(res.totalDecided).toBe(3);
      expect(res.winRatePct).toBe(66.7);
    });

    it('should return 0 if no decided grants yet', () => {
      const grants = [{ status: 'drafting' }, { status: 'submitted' }];
      const res = calculateGrantWinRate(grants);
      expect(res.winRatePct).toBe(0);
      expect(res.totalDecided).toBe(0);
    });
  });

  describe('calculateInstallmentProgress', () => {
    it('should compute collection rate and totals correctly', () => {
      const installments = [
        { amount: '50000', status: 'received', receivedAmount: '50000' },
        { amount: '25000', status: 'scheduled' },
        { amount: '25000', status: 'scheduled' },
      ];

      const res = calculateInstallmentProgress(installments);
      expect(res.totalExpected).toBe(100000);
      expect(res.totalReceived).toBe(50000);
      expect(res.collectionRatePct).toBe(50);
    });
  });

  describe('evaluateDeliverableUrgency', () => {
    const fixedNow = new Date('2026-06-01T00:00:00.000Z');

    it('should detect overdue deliverable', () => {
      expect(evaluateDeliverableUrgency('2026-05-15', 'pending', fixedNow)).toBe('overdue');
    });

    it('should detect due_soon deliverable within 30 days', () => {
      expect(evaluateDeliverableUrgency('2026-06-20', 'pending', fixedNow)).toBe('due_soon');
    });

    it('should detect on_track deliverable beyond 30 days', () => {
      expect(evaluateDeliverableUrgency('2026-09-01', 'pending', fixedNow)).toBe('on_track');
    });

    it('should mark submitted or approved deliverable as completed', () => {
      expect(evaluateDeliverableUrgency('2026-05-15', 'submitted', fixedNow)).toBe('completed');
      expect(evaluateDeliverableUrgency('2026-05-15', 'approved', fixedNow)).toBe('completed');
    });
  });
});
