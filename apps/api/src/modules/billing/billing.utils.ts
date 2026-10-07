export interface CanadianTaxes {
  subtotal: number;
  taxTps: number; // 5% TPS Fédérale
  taxTvq: number; // 9.975% TVQ Québec
  total: number;
}

export function calculateCanadianTaxes(subtotal: number): CanadianTaxes {
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const taxTps = Math.round(roundedSubtotal * 0.05 * 100) / 100;
  const taxTvq = Math.round(roundedSubtotal * 0.09975 * 100) / 100;
  const total = Math.round((roundedSubtotal + taxTps + taxTvq) * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    taxTps,
    taxTvq,
    total,
  };
}

export function calculateQuotaUsage(
  current: number,
  limit: number
): { usagePct: number; isWarning: boolean; isExceeded: boolean } {
  if (limit <= 0 || limit >= 9999) {
    return { usagePct: 0, isWarning: false, isExceeded: false };
  }
  const usagePct = Math.round((current / limit) * 100);
  return {
    usagePct,
    isWarning: usagePct >= 80 && usagePct < 100,
    isExceeded: usagePct >= 100,
  };
}

export function calculateMrr(
  subscriptions: { planCode: string; billingCycle: string; status: string }[],
  planPrices: Record<string, { monthly: number; annual: number }>
): number {
  let mrr = 0;
  for (const sub of subscriptions) {
    if (sub.status !== 'active' && sub.status !== 'trialing') continue;
    const prices = planPrices[sub.planCode];
    if (!prices) continue;

    if (sub.billingCycle === 'annual') {
      mrr += prices.annual / 12;
    } else {
      mrr += prices.monthly;
    }
  }
  return Math.round(mrr * 100) / 100;
}
