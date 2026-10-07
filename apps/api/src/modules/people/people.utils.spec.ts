import { describe, it, expect } from 'vitest';
import { calculateDuplicateScore, isServiceDeliveryAllowed } from './people.utils';

describe('People Duplicate Detection & Consent Enforcement (PEO-05 & CMP-05)', () => {
  it('should detect identical or highly similar person records (> 80% score)', () => {
    const candidate = {
      firstName: 'Jean',
      lastName: 'Tremblay',
      birthDate: '1985-06-15',
    };

    const existingList = [
      { firstName: 'Jean', lastName: 'Tremblay', birthDate: '1985-06-15' },
      { firstName: 'Marie', lastName: 'Gagnon', birthDate: '1990-01-01' },
    ];

    const duplicates = existingList
      .map((item) => ({
        item,
        score: calculateDuplicateScore(candidate, item),
      }))
      .filter((d) => d.score >= 80);

    expect(duplicates.length).toBe(1);
    expect(duplicates[0].item.firstName).toBe('Jean');
    expect(duplicates[0].score).toBe(100);
  });

  it('should block service delivery when consent is withdrawn (CMP-05)', () => {
    const activeConsent = { status: 'given', withdrawnAt: null };
    const withdrawnConsent = { status: 'withdrawn', withdrawnAt: new Date() };

    expect(isServiceDeliveryAllowed(activeConsent)).toBe(true);
    expect(isServiceDeliveryAllowed(withdrawnConsent)).toBe(false);
    expect(isServiceDeliveryAllowed(null)).toBe(false);
  });
});
