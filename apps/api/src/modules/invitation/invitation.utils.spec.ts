import { describe, it, expect } from 'vitest';
import { hashToken, isTokenExpired } from './invitation.utils';

describe('Invitation Token Security & Expiration Utility (CORE-05)', () => {
  it('should generate deterministic sha256 hash for raw token', () => {
    const token = 'sample-invitation-token-12345';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex length
  });

  it('should detect when an invitation is expired', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours in future

    expect(isTokenExpired(pastDate)).toBe(true);
    expect(isTokenExpired(futureDate)).toBe(false);
  });
});
