import crypto from 'node:crypto';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function generateStorageKey(
  tenantId: string,
  entityType: string,
  entityId: string,
  fileName: string
): string {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const randomPrefix = crypto.randomBytes(4).toString('hex');
  return `${tenantId}/${entityType}/${entityId}/${randomPrefix}-${sanitizedFileName}`;
}
