import { z } from 'zod';

export const ProvisionTenantSchema = z.object({
  name: z.string().min(2, 'Le nom de l’organisme doit contenir au moins 2 caractères'),
  slug: z.string().min(2, 'Le slug doit contenir au moins 2 caractères').regex(/^[a-z0-9-]+$/, 'Lettres minuscules, chiffres et tirets uniquement'),
  acronym: z.string().optional(),
  orgType: z.string().default('OBNL / NPO (Organisme à but non lucratif)'),
  neqNumber: z.string().optional(),
  email: z.string().email('Courriel invalide'),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  mode: z.enum(['shared', 'dedicated', 'self_hosted']).default('shared'),
  planCode: z.enum(['community', 'starter', 'pro', 'enterprise']).default('starter'),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
  // Initial Admin User
  adminFirstName: z.string().min(1, 'Prénom administrateur requis'),
  adminLastName: z.string().min(1, 'Nom administrateur requis'),
  adminEmail: z.string().email('Courriel administrateur invalide'),
  adminPassword: z.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères'),
  adminJobTitle: z.string().default('Direction Générale / Administrateur'),
  // Privacy / Loi 25
  privacyOfficerName: z.string().optional(),
  privacyOfficerEmail: z.string().email('Courriel PRP invalide').optional().or(z.literal('')),
  dataRetentionMonths: z.number().int().min(12).default(60),
});

export type ProvisionTenantInput = z.infer<typeof ProvisionTenantSchema>;

export const UpdateTenantQuotasSchema = z.object({
  maxUsersOverride: z.number().int().min(1).nullable().optional(),
  maxStorageGbOverride: z.number().int().min(1).nullable().optional(),
  maxProjectsOverride: z.number().int().min(1).nullable().optional(),
  allowedModules: z.array(z.string()).optional(),
});

export type UpdateTenantQuotasInput = z.infer<typeof UpdateTenantQuotasSchema>;

export const CreateSystemAnnouncementSchema = z.object({
  title: z.string().min(3, 'Titre requis'),
  message: z.string().min(5, 'Message requis'),
  severity: z.enum(['info', 'warning', 'critical']).default('info'),
  targetTenantId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

export type CreateSystemAnnouncementInput = z.infer<typeof CreateSystemAnnouncementSchema>;

export const CreateSecurityIncidentSchema = z.object({
  title: z.string().min(3, 'Titre requis'),
  description: z.string().min(10, 'Description détaillée requise'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('high'),
  tenantId: z.string().uuid().nullable().optional(),
  impactedUsersCount: z.number().int().min(0).default(0),
  containmentSteps: z.string().optional(),
  notifiedCai: z.boolean().default(false),
  caiReferenceNumber: z.string().optional(),
});

export type CreateSecurityIncidentInput = z.infer<typeof CreateSecurityIncidentSchema>;
