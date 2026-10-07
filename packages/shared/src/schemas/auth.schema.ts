import { z } from 'zod';

export const RegisterTenantSchema = z.object({
  tenantName: z
    .string()
    .min(2, 'Le nom de l’association doit comporter au moins 2 caractères')
    .max(100),
  adminEmail: z
    .string()
    .email('Adresse courriel invalide'),
  adminFirstName: z.string().max(50).optional().nullable(),
  adminLastName: z.string().max(50).optional().nullable(),
  password: z
    .string()
    .min(12, 'Le mot de passe doit comporter au moins 12 caractères')
    .max(100),
  locale: z.enum(['fr-CA', 'en-CA']).default('fr-CA'),
});

export type RegisterTenantInput = z.infer<typeof RegisterTenantSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Adresse courriel invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const SwitchTenantSchema = z.object({
  tenantId: z.string().uuid('ID d’association invalide'),
});

export type SwitchTenantInput = z.infer<typeof SwitchTenantSchema>;

export const UpdateTenantSchema = z.object({
  name: z.string().min(2, "Le nom de l'organisme doit comporter au moins 2 caractères").max(100),
  logoUrl: z.string().optional().nullable().or(z.literal('')),
  acronym: z.string().max(20).optional().nullable().or(z.literal('')),
  description: z.string().max(1000).optional().nullable().or(z.literal('')),
  orgType: z.string().max(100).optional().nullable(),
  neqNumber: z.string().max(50).optional().nullable().or(z.literal('')),
  address: z.string().max(255).optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable().or(z.literal('')),
  email: z.string().email('Adresse courriel invalide').optional().nullable().or(z.literal('')),
  website: z.string().url('URL du site web invalide').optional().nullable().or(z.literal('')),
  privacyOfficerName: z.string().max(100).optional().nullable().or(z.literal('')),
  privacyOfficerEmail: z.string().email('Courriel du responsable PRP invalide').optional().nullable().or(z.literal('')),
  dataRetentionMonths: z.number().int().min(1).max(360).optional().nullable(),
});

export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;

export const UpdateUserProfileSchema = z.object({
  firstName: z.string().max(50).optional().nullable().or(z.literal('')),
  lastName: z.string().max(50).optional().nullable().or(z.literal('')),
  avatarUrl: z.string().optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable().or(z.literal('')),
  jobTitle: z.string().max(100).optional().nullable().or(z.literal('')),
  locale: z.enum(['fr-CA', 'en-CA']).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(12, 'Le nouveau mot de passe doit comporter au moins 12 caractères').optional(),
});

export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;

