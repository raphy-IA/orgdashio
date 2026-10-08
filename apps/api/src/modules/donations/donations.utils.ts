/**
 * Utility functions for Canadian Tax Receipting (CRA / ARC) and Donation Management
 */

export interface CraReceiptValidationInput {
  charityRegistrationNumber?: string | null;
  locationIssued?: string | null;
  authorizedSignatoryName?: string | null;
  totalEligibleAmount: number;
  donorName?: string | null;
  donorTaxAddress?: string | null;
}

export interface CraReceiptValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Calculates the eligible amount of a gift for Canadian tax receipting purposes.
 * Rule: Eligible Amount = Gross Amount of Gift - Fair Market Value (FMV) of Advantage.
 * Advantage De Minimis rule (CRA): If the advantage does not exceed the lesser of $75 or 10% of the gross gift,
 * the advantage is considered nominal and the full gross amount is eligible.
 */
export function calculateEligibleAmount(grossAmount: number, advantageAmount: number = 0): number {
  const gross = Math.max(0, grossAmount);
  const advantage = Math.max(0, advantageAmount);

  if (gross <= 0) return 0;

  // De minimis threshold: lesser of 75$ or 10% of gross
  const deMinimisThreshold = Math.min(75, gross * 0.1);
  if (advantage > 0 && advantage <= deMinimisThreshold) {
    return Math.round(gross * 100) / 100;
  }

  const eligible = Math.max(0, gross - advantage);
  return Math.round(eligible * 100) / 100;
}

/**
 * Generates an official CRA sequential tax receipt number.
 * Format: REC-YYYY-XXXX (e.g. REC-2026-0042)
 */
export function formatCraReceiptNumber(year: number, sequence: number): string {
  const safeSeq = Math.max(1, sequence);
  const padded = safeSeq.toString().padStart(4, '0');
  return `REC-${year}-${padded}`;
}

/**
 * Generates an internal sequential donation number.
 * Format: DON-YYYY-XXXX (e.g. DON-2026-0015)
 */
export function formatDonationNumber(year: number, sequence: number): string {
  const safeSeq = Math.max(1, sequence);
  const padded = safeSeq.toString().padStart(4, '0');
  return `DON-${year}-${padded}`;
}

/**
 * Validates that all mandatory Canadian Revenue Agency (CRA/ARC) requirements for an official donation receipt are met.
 */
export function validateCraCompliance(input: CraReceiptValidationInput): CraReceiptValidationResult {
  const errors: string[] = [];

  if (!input.charityRegistrationNumber || !input.charityRegistrationNumber.trim()) {
    errors.push('Le numéro d\'enregistrement d\'organisme de bienfaisance ARC (ex: 123456789RR0001) est obligatoire.');
  } else {
    // Check CRA RR format if applicable (9 digits + RR + 4 digits)
    const normalized = input.charityRegistrationNumber.trim().replace(/\s+/g, '');
    const craPattern = /^\d{9}RR\d{4}$/i;
    if (!craPattern.test(normalized) && normalized.length < 5) {
      errors.push('Le format du numéro d\'enregistrement ARC semble invalide (format attendu: 9 chiffres + RR + 4 chiffres).');
    }
  }

  if (!input.locationIssued || !input.locationIssued.trim()) {
    errors.push('Le lieu de délivrance du reçu officiel est obligatoire pour l\'ARC.');
  }

  if (!input.authorizedSignatoryName || !input.authorizedSignatoryName.trim()) {
    errors.push('Le nom du signataire officiel autorisé est obligatoire pour l\'ARC.');
  }

  if (!input.donorName || !input.donorName.trim()) {
    errors.push('Le nom complet du donateur est obligatoire.');
  }

  if (input.totalEligibleAmount <= 0) {
    errors.push('Le montant admissible du don doit être supérieur à 0 $ pour émettre un reçu fiscal.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Aggregates donation KPIs
 */
export function calculateDonationKPIs(
  donations: Array<{
    grossAmount: number | string;
    eligibleAmount: number | string;
    status: string;
    isTaxReceiptEligible: boolean;
    taxReceiptId?: string | null;
  }>
) {
  const receivedList = donations.filter((d) => d.status === 'received');

  const totalGross = receivedList.reduce((sum, d) => sum + Number(d.grossAmount || 0), 0);
  const totalEligible = receivedList.reduce((sum, d) => sum + Number(d.eligibleAmount || 0), 0);
  const count = receivedList.length;
  const averageDonation = count > 0 ? Math.round((totalGross / count) * 100) / 100 : 0;

  const receiptedCount = receivedList.filter((d) => !!d.taxReceiptId).length;
  const pendingReceiptCount = receivedList.filter((d) => d.isTaxReceiptEligible && !d.taxReceiptId).length;

  return {
    totalGross,
    totalEligible,
    receivedCount: count,
    averageDonation,
    receiptedCount,
    pendingReceiptCount,
  };
}
