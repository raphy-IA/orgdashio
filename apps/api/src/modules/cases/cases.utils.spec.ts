import { describe, it, expect } from 'vitest';
import { isNoteEditable, canUserAccessCase } from './cases.utils';

describe('Cases Utils (CAS-05 & CAS-08)', () => {
  describe('isNoteEditable', () => {
    it('should allow editing notes created less than 7 days ago', () => {
      const now = new Date('2026-10-10T12:00:00Z');
      const createdAt = new Date('2026-10-05T12:00:00Z'); // 5 days ago
      expect(isNoteEditable(createdAt, now)).toBe(true);
    });

    it('should disallow editing notes created more than 7 days ago', () => {
      const now = new Date('2026-10-10T12:00:00Z');
      const createdAt = new Date('2026-10-01T12:00:00Z'); // 9 days ago
      expect(isNoteEditable(createdAt, now)).toBe(false);
    });
  });

  describe('canUserAccessCase', () => {
    it('should allow assigned worker access to restricted case', () => {
      const result = canUserAccessCase({
        confidentialityLevel: 'restricted',
        primaryWorkerUserId: 'user-1',
        assignedUserIds: ['user-2'],
        userId: 'user-2',
      });
      expect(result).toBe(true);
    });

    it('should deny unassigned user access to restricted case without break glass', () => {
      const result = canUserAccessCase({
        confidentialityLevel: 'restricted',
        primaryWorkerUserId: 'user-1',
        assignedUserIds: ['user-2'],
        userId: 'user-99',
        hasActiveBreakGlass: false,
      });
      expect(result).toBe(false);
    });

    it('should allow unassigned user access to restricted case with active break glass', () => {
      const result = canUserAccessCase({
        confidentialityLevel: 'restricted',
        primaryWorkerUserId: 'user-1',
        assignedUserIds: ['user-2'],
        userId: 'user-99',
        hasActiveBreakGlass: true,
      });
      expect(result).toBe(true);
    });
  });
});
