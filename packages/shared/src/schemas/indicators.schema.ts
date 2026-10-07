import { z } from 'zod';

export const DisaggregationDataSchema = z.object({
  gender: z.record(z.string(), z.number()).optional(),
  ageGroup: z.record(z.string(), z.number()).optional(),
  immigrationStatus: z.record(z.string(), z.number()).optional(),
  region: z.record(z.string(), z.number()).optional(),
  custom: z.record(z.string(), z.number()).optional(),
});

export type DisaggregationData = z.infer<typeof DisaggregationDataSchema>;

export const CreateIndicatorSchema = z.object({
  projectId: z.string().uuid().optional(),
  resultNodeId: z.string().uuid().optional(),
  code: z.string().min(2, 'Le code est requis (ex. IND-01)'),
  name: z.string().min(2, 'Le nom est requis'),
  description: z.string().optional(),
  level: z.enum(['impact', 'outcome', 'output', 'activity']).default('output'),
  unit: z.string().default('personnes'),
  baselineValue: z.number().default(0),
  targetValue: z.number().positive('La cible doit être supérieure à 0'),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'total']).default('quarterly'),
  meansOfVerification: z.string().optional(),
  disaggregationDimensions: z.array(z.string()).optional(),
  status: z.enum(['active', 'archived', 'achieved']).default('active'),
});

export type CreateIndicatorInput = z.infer<typeof CreateIndicatorSchema>;

export const UpdateIndicatorSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  level: z.enum(['impact', 'outcome', 'output', 'activity']).optional(),
  unit: z.string().optional(),
  baselineValue: z.number().optional(),
  targetValue: z.number().positive().optional(),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'total']).optional(),
  meansOfVerification: z.string().optional(),
  disaggregationDimensions: z.array(z.string()).optional(),
  status: z.enum(['active', 'archived', 'achieved']).optional(),
});

export type UpdateIndicatorInput = z.infer<typeof UpdateIndicatorSchema>;

export const RecordObservationSchema = z.object({
  periodLabel: z.string().min(2, 'La période est requise (ex. 2026-Q1)'),
  recordedValue: z.number(),
  disaggregationData: DisaggregationDataSchema.optional(),
  notes: z.string().optional(),
  sourceFileUrl: z.string().optional(),
});

export type RecordObservationInput = z.infer<typeof RecordObservationSchema>;

export const CreateResultNodeSchema = z.object({
  projectId: z.string().uuid('Le projet est requis'),
  parentId: z.string().uuid().optional(),
  level: z.enum(['impact', 'outcome', 'output']),
  title: z.string().min(2, 'Le titre est requis'),
  description: z.string().optional(),
});

export type CreateResultNodeInput = z.infer<typeof CreateResultNodeSchema>;

