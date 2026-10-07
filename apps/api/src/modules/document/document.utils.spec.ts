import { describe, it, expect } from 'vitest';
import { generateStorageKey, validateMimeType } from './document.utils';

describe('Document Security & Storage Key Utility (CORE-14 / TEC-DOC-01)', () => {
  it('should format storage key prefixed with tenantId', () => {
    const tenantId = '11111111-2222-3333-4444-555555555555';
    const entityType = 'project';
    const entityId = 'proj-99';
    const fileName = 'Rapport-Projet.pdf';

    const key = generateStorageKey(tenantId, entityType, entityId, fileName);

    expect(key.startsWith('11111111-2222-3333-4444-555555555555/project/proj-99/')).toBe(true);
    expect(key).toContain('Rapport-Projet.pdf');
  });

  it('should validate allowed MIME types (PDF, PNG, JPEG, CSV, XLSX)', () => {
    expect(validateMimeType('application/pdf')).toBe(true);
    expect(validateMimeType('image/png')).toBe(true);
    expect(validateMimeType('text/csv')).toBe(true);

    // Forbidden executable types
    expect(validateMimeType('application/x-msdownload')).toBe(false);
    expect(validateMimeType('application/x-sh')).toBe(false);
  });
});
