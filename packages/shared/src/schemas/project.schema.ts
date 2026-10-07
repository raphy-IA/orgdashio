import { z } from 'zod';

export const CreateProgramSchema = z.object({
  code: z
    .string()
    .min(2, 'Le code doit comporter au moins 2 caractères')
    .max(20, 'Le code ne peut dépasser 20 caractères')
    .regex(/^[A-Z0-9_-]+$/i, 'Le code doit contenir uniquement des lettres, chiffres, tirets ou soulignés'),
  name: z
    .string()
    .min(2, 'Le nom du programme doit comporter au moins 2 caractères')
    .max(100),
  description: z.string().optional(),
  status: z.enum(['planned', 'active', 'suspended', 'closed']).default('active'),
});

export type CreateProgramInput = z.infer<typeof CreateProgramSchema>;

export const UpdateProgramSchema = CreateProgramSchema.partial();
export type UpdateProgramInput = z.infer<typeof UpdateProgramSchema>;

export const AddProjectToProgramSchema = z.object({
  projectId: z.string().uuid('ID de projet invalide'),
});

export type AddProjectToProgramInput = z.infer<typeof AddProjectToProgramSchema>;

export const CreateProjectSchema = z.object({
  programId: z.string().uuid().optional().nullable(),
  code: z
    .string()
    .min(2, 'Le code doit comporter au moins 2 caractères')
    .max(20, 'Le code ne peut dépasser 20 caractères')
    .regex(/^[A-Z0-9_-]+$/i, 'Le code doit contenir uniquement des lettres, chiffres, tirets ou soulignés'),
  name: z
    .string()
    .min(2, 'Le nom du projet doit comporter au moins 2 caractères')
    .max(100),
  status: z
    .enum(['planned', 'active', 'suspended', 'closed', 'cancelled'])
    .default('planned'),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = CreateProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
