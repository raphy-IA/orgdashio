import { describe, it, expect } from 'vitest';
import { hasScheduleConflict, isEligibleForCertificate } from './training.utils';

describe('Training Schedule Conflict & Certificate Eligibility Utility (FOR-03 & FOR-09)', () => {
  it('should detect schedule overlap for the same trainer', () => {
    const existingOccurrences = [
      {
        trainerPartyId: 'trainer-jean',
        startTime: new Date('2026-10-10T09:00:00Z'),
        endTime: new Date('2026-10-10T12:00:00Z'),
      },
    ];

    // Overlapping occurrence (09:30 to 11:30) for Jean
    const hasConflict = hasScheduleConflict(
      existingOccurrences,
      'trainer-jean',
      new Date('2026-10-10T09:30:00Z'),
      new Date('2026-10-10T11:30:00Z')
    );

    expect(hasConflict).toBe(true);
  });

  it('should allow non-overlapping occurrences for the same trainer', () => {
    const existingOccurrences = [
      {
        trainerPartyId: 'trainer-jean',
        startTime: new Date('2026-10-10T09:00:00Z'),
        endTime: new Date('2026-10-10T12:00:00Z'),
      },
    ];

    // Afternoon occurrence (13:00 to 16:00) for Jean -> No conflict
    const hasConflict = hasScheduleConflict(
      existingOccurrences,
      'trainer-jean',
      new Date('2026-10-10T13:00:00Z'),
      new Date('2026-10-10T16:00:00Z')
    );

    expect(hasConflict).toBe(false);
  });

  it('should allow certificate only if attendance rate >= 80%', () => {
    // 8 out of 10 present (80%) -> Eligible
    expect(isEligibleForCertificate(8, 10)).toBe(true);

    // 7 out of 10 present (70%) -> Ineligible
    expect(isEligibleForCertificate(7, 10)).toBe(false);
  });
});
