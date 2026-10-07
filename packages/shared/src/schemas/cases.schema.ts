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
