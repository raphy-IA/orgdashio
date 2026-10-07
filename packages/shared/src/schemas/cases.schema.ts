import { z } from 'zod';

export const CreateCaseSchema = z.object({
  partyId: z.string().uuid('ID bénéficiaire invalide'),
  title: z.string().min(3, 'Titre requis (minimum 3 caractères)'),
  confidentialityLevel: z
    .enum(['standard', 'restricted', 'highly_confidential'])
    .default('restricted'),
});

export type CreateCaseInput = z.infer<typeof CreateCaseSchema>;

export const CreateCaseNoteSchema = z.object({
  noteType: z
    .enum(['meeting', 'phone_call', 'home_visit', 'assessment', 'other'])
    .default('meeting'),
  content: z.string().min(5, 'Le contenu de la note doit comporter au moins 5 caractères'),
  parentNoteId: z.string().uuid().optional(),
});

export type CreateCaseNoteInput = z.infer<typeof CreateCaseNoteSchema>;

export const BreakGlassSchema = z.object({
  reason: z
    .string()
    .min(10, 'Le motif de bris de glace doit comporter au moins 10 caractères'),
});

export type BreakGlassInput = z.infer<typeof BreakGlassSchema>;

export const CreateInterventionPlanSchema = z.object({
  title: z.string().min(3, 'Titre du plan requis (min. 3 caractères)'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).default('active'),
  startDate: z.string().optional(),
  reviewDate: z.string().optional(),
});

export type CreateInterventionPlanInput = z.infer<typeof CreateInterventionPlanSchema>;

export const CreateInterventionGoalSchema = z.object({
  title: z.string().min(3, 'Titre de l’objectif SMART requis'),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'achieved', 'abandoned']).default('in_progress'),
  notes: z.string().optional(),
});

export type CreateInterventionGoalInput = z.infer<typeof CreateInterventionGoalSchema>;

export const UpdateInterventionGoalSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'achieved', 'abandoned']).optional(),
  notes: z.string().optional(),
});

export type UpdateInterventionGoalInput = z.infer<typeof UpdateInterventionGoalSchema>;

export const CreateCaseReferralSchema = z.object({
  organizationName: z.string().min(2, 'Nom de l’organisme requis'),
  serviceType: z.string().min(2, 'Type de service requis'),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  reason: z.string().min(5, 'Motif de référence requis'),
  status: z.enum(['pending', 'accepted', 'rejected', 'completed']).default('pending'),
  outcomeNotes: z.string().optional(),
});

export type CreateCaseReferralInput = z.infer<typeof CreateCaseReferralSchema>;

export const AssignCaseWorkerSchema = z.object({
  userId: z.string().uuid('ID utilisateur requis'),
  role: z.enum(['primary_worker', 'co_worker', 'supervisor']).default('co_worker'),
});

export type AssignCaseWorkerInput = z.infer<typeof AssignCaseWorkerSchema>;
