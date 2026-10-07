import { z } from 'zod';

export const SendInvitationSchema = z.object({
  email: z.string().email('Adresse courriel invalide'),
  roleId: z.string().uuid('ID de rôle invalide'),
});

export type SendInvitationInput = z.infer<typeof SendInvitationSchema>;

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, 'Jeton d’invitation requis'),
  password: z
    .string()
    .min(12, 'Le mot de passe doit comporter au moins 12 caractères'),
});

export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>;

export const OnboardingStepProfileSchema = z.object({
  legalName: z.string().min(2, 'Nom légal requis'),
  registrationNo: z.string().optional(),
  charityNo: z.string().optional(),
});

export type OnboardingStepProfileInput = z.infer<typeof OnboardingStepProfileSchema>;

export const OnboardingStepPreferencesSchema = z.object({
  locale: z.enum(['fr-CA', 'en-CA']).default('fr-CA'),
  currency: z.string().length(3).default('CAD'),
  timezone: z.string().default('America/Toronto'),
});

export type OnboardingStepPreferencesInput = z.infer<typeof OnboardingStepPreferencesSchema>;

export const OnboardingStepSectorSchema = z.object({
  sectorPack: z.enum(['training_insertion', 'humanitarian_social', 'community']),
});

export type OnboardingStepSectorInput = z.infer<typeof OnboardingStepSectorSchema>;

export const CreateOrgUnitSchema = z.object({
  parentId: z.string().uuid().optional(),
  name: z.string().min(2, 'Le nom de l’unité est requis'),
  code: z.string().optional(),
});

export type CreateOrgUnitInput = z.infer<typeof CreateOrgUnitSchema>;
