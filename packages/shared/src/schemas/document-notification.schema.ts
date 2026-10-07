import { z } from 'zod';

export const UploadDocumentSchema = z.object({
  entityType: z.string().min(1, 'Type d’entité requis'),
  entityId: z.string().min(1, 'ID d’entité requis'),
  fileName: z.string().min(1, 'Nom de fichier requis'),
  mimeType: z.string().min(1, 'Type MIME requis'),
  fileSize: z.number().positive().max(52428800, 'Taille maximale dépassée (50 Mo max)'),
});

export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>;

export const CreateNotificationSchema = z.object({
  userId: z.string().uuid(),
  eventType: z.string(),
  title: z.string().min(1),
  message: z.string().min(1),
  linkUrl: z.string().optional(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

export const GrantSupportAccessSchema = z.object({
  tenantId: z.string().uuid(),
  reason: z.string().min(10, 'Une justification d’au moins 10 caractères est requise'),
  expiresInHours: z.number().int().min(1).max(24).default(2),
});

export type GrantSupportAccessInput = z.infer<typeof GrantSupportAccessSchema>;
