export interface PersonCandidate {
  firstName: string;
  lastName: string;
  birthDate?: string;
  email?: string;
}

export function calculateDuplicateScore(
  candidate: PersonCandidate,
  existing: PersonCandidate
): number {
  let score = 0;
  const fn1 = candidate.firstName.toLowerCase().trim();
  const fn2 = existing.firstName.toLowerCase().trim();
  const ln1 = candidate.lastName.toLowerCase().trim();
  const ln2 = existing.lastName.toLowerCase().trim();

  if (fn1 === fn2) score += 40;
  if (ln1 === ln2) score += 40;

  if (candidate.birthDate && existing.birthDate && candidate.birthDate === existing.birthDate) {
    score += 20;
  }

  if (candidate.email && existing.email && candidate.email.toLowerCase() === existing.email.toLowerCase()) {
    score = 100; // Exact email match is 100% duplicate
  }

  return score;
}

export function isServiceDeliveryAllowed(consentRecord: { status: string; withdrawnAt?: Date | null } | null): boolean {
  if (!consentRecord) return false;
  if (consentRecord.status === 'withdrawn' || consentRecord.withdrawnAt) return false;
  return consentRecord.status === 'given';
}
