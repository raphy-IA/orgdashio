import { describe, it, expect } from 'vitest';
import { calculateCanadianTaxes, calculateQuotaUsage, calculateMrr } from './billing.utils';

describe('Billing Utils (R1B.3 SaaS Billing)', () => {
  describe('calculateCanadianTaxes', () => {
    it('should compute 5% TPS and 9.975% TVQ accurately on $100.00 CAD', () => {
      const taxes = calculateCanadianTaxes(100);
      expect(taxes.subtotal).toBe(100);
      expect(taxes.taxTps).toBe(5.0);
      expect(taxes.taxTvq).toBe(9.98); // 9.975 rounded
      expect(taxes.total).toBe(114.98);
    });

    it('should handle $49.00 CAD (Starter plan)', () => {
      const taxes = calculateCanadianTaxes(49);
      expect(taxes.subtotal).toBe(49);
      expect(taxes.taxTps).toBe(2.45);
      expect(taxes.taxTvq).toBe(4.89);
      expect(taxes.total).toBe(56.34);
    });

    it('should handle zero subtotal for community plan', () => {
      const taxes = calculateCanadianTaxes(0);
      expect(taxes.subtotal).toBe(0);
      expect(taxes.taxTps).toBe(0);
      expect(taxes.taxTvq).toBe(0);
      expect(taxes.total).toBe(0);
    });
  });

  describe('calculateQuotaUsage', () => {
    it('should detect normal, warning and exceeded status', () => {
      const normal = calculateQuotaUsage(5, 10);
      expect(normal.usagePct).toBe(50);
      expect(normal.isWarning).toBe(false);
      expect(normal.isExceeded).toBe(false);

      const warning = calculateQuotaUsage(8, 10);
      expect(warning.usagePct).toBe(80);
      expect(warning.isWarning).toBe(true);
      expect(warning.isExceeded).toBe(false);

      const exceeded = calculateQuotaUsage(11, 10);
      expect(exceeded.usagePct).toBe(110);
      expect(exceeded.isWarning).toBe(false);
      expect(exceeded.isExceeded).toBe(true);
    });

    it('should handle unlimited plans (9999 limit)', () => {
      const unlimited = calculateQuotaUsage(500, 9999);
      expect(unlimited.usagePct).toBe(0);
      expect(unlimited.isWarning).toBe(false);
      expect(unlimited.isExceeded).toBe(false);
    });
  });

  describe('calculateMrr', () => {
    it('should sum monthly and normalized annual subscriptions', () => {
      const subs = [
        { planCode: 'starter', billingCycle: 'monthly', status: 'active' },
        { planCode: 'pro', billingCycle: 'annual', status: 'active' },
        { planCode: 'community', billingCycle: 'monthly', status: 'active' },
        { planCode: 'pro', billingCycle: 'monthly', status: 'canceled' },
      ];
      const planPrices = {
        community: { monthly: 0, annual: 0 },
        starter: { monthly: 49, annual: 490 },
        pro: { monthly: 149, annual: 1490 },
      };

      // starter monthly: 49
      // pro annual: 1490 / 12 = 124.166...
      // Total MRR: 49 + 124.17 = 173.17
      const mrr = calculateMrr(subs, planPrices);
      expect(mrr).toBe(173.17);
    });
  });
});
