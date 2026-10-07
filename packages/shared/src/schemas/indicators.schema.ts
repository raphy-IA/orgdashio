import { z } from 'zod';

export const CreateIndicatorSchema = z.object({
  projectId: z.string().uuid().optional(),
  resultNodeId: z.string().uuid().optional(),
  code: z.string().min(2, 'Le code est requis'),
  name: z.string().min(2, 'Le nom est requis'),
  level: z.enum(['impact', 'outcome', 'output', 'activity']).default('output'),
  unit: z.string().default('count'),
  baselineValue: z.number().default(0),
  targetValue: z.number().positive('La cible doit être supérieure à 0'),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'total']).default('quarterly'),
});

export type CreateIndicatorInput = z.infer<typeof CreateIndicatorSchema>;

export const RecordObservationSchema = z.object({
  periodLabel: z.string().min(2, 'La période est requise (ex. 2026-Q1)'),
  recordedValue: z.number(),
  notes: z.string().optional(),
});

export type RecordObservationInput = z.infer<typeof RecordObservationSchema>;
