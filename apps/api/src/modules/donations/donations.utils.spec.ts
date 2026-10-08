import { describe, it, expect } from 'vitest';
import {
  calculateEligibleAmount,
  formatCraReceiptNumber,
  formatDonationNumber,
  validateCraCompliance,
  calculateDonationKPIs,
} from './donations.utils';

describe('donations.utils', () => {
  describe('calculateEligibleAmount', () => {
    it('returns full amount if no advantage is provided', () => {
      expect(calculateEligibleAmount(150, 0)).toBe(150);
    });

    it('applies CRA de minimis rule when advantage <= min(75$, 10% of gross)', () => {
      // 10% of 500$ = 50$, advantage is 30$ -> less than 50$, so eligible = 500$
      expect(calculateEligibleAmount(500, 30)).toBe(500);
      // 10% of 1000$ = 100$, de minimis max is 75$. If advantage is 60$ (<= 75$), eligible = 1000$
      expect(calculateEligibleAmount(1000, 60)).toBe(1000);
    });

    it('deducts advantage when above de minimis threshold', () => {
      // 100$ gift, advantage of 25$ (exceeds 10% which is 10$) -> eligible = 75$
      expect(calculateEligibleAmount(100, 25)).toBe(75);
      // 1000$ gift, advantage of 100$ (exceeds 75$) -> eligible = 900$
      expect(calculateEligibleAmount(1000, 100)).toBe(900);
    });

    it('returns 0 if advantage exceeds gross amount', () => {
      expect(calculateEligibleAmount(50, 60)).toBe(0);
    });
  });

  describe('formatCraReceiptNumber', () => {
    it('formats sequential CRA receipt number correctly', () => {
      expect(formatCraReceiptNumber(2026, 1)).toBe('REC-2026-0001');
      expect(formatCraReceiptNumber(2026, 42)).toBe('REC-2026-0042');
      expect(formatCraReceiptNumber(2026, 1234)).toBe('REC-2026-1234');
    });
  });

  describe('formatDonationNumber', () => {
    it('formats sequential donation number correctly', () => {
      expect(formatDonationNumber(2026, 7)).toBe('DON-2026-0007');
    });
  });

  describe('validateCraCompliance', () => {
    it('validates a compliant CRA tax receipt input', () => {
      const result = validateCraCompliance({
        charityRegistrationNumber: '123456789RR0001',
        locationIssued: 'Montréal, QC',
        authorizedSignatoryName: 'Marie Tremblay',
        totalEligibleAmount: 250,
        donorName: 'Jean Dupont',
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects missing CRA mandatory requirements', () => {
      const result = validateCraCompliance({
        charityRegistrationNumber: '',
        locationIssued: '',
        authorizedSignatoryName: '',
        totalEligibleAmount: 0,
        donorName: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('calculateDonationKPIs', () => {
    it('computes correct donation statistics and receipt status', () => {
      const donations = [
        { grossAmount: 100, eligibleAmount: 100, status: 'received', isTaxReceiptEligible: true, taxReceiptId: 'rec-1' },
        { grossAmount: 200, eligibleAmount: 180, status: 'received', isTaxReceiptEligible: true, taxReceiptId: null },
        { grossAmount: 50, eligibleAmount: 50, status: 'received', isTaxReceiptEligible: false, taxReceiptId: null },
        { grossAmount: 500, eligibleAmount: 500, status: 'pledged', isTaxReceiptEligible: true, taxReceiptId: null },
      ];

      const kpis = calculateDonationKPIs(donations);
      expect(kpis.totalGross).toBe(350);
      expect(kpis.totalEligible).toBe(330);
      expect(kpis.receivedCount).toBe(3);
      expect(kpis.averageDonation).toBe(116.67);
      expect(kpis.receiptedCount).toBe(1);
      expect(kpis.pendingReceiptCount).toBe(1);
    });
  });
});
