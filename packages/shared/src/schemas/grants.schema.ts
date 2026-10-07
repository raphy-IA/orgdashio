import { z } from 'zod';

export const CreateGrantSchema = z.object({
  code: z.string().min(2, 'Le code de subvention est requis (ex. SUBV-2026-001)'),
  title: z.string().min(2, 'Le titre du projet subventionné est requis'),
  funderName: z.string().min(2, 'Le nom du bailleur de fonds est requis'),
  funderType: z.enum(['federal', 'provincial', 'municipal', 'foundation', 'corporate', 'other']).default('foundation'),
  programName: z.string().optional(),
  projectId: z.string().uuid().optional(),
  status: z.enum(['prospect', 'drafting', 'submitted', 'approved', 'rejected', 'closed']).default('prospect'),
  requestedAmount: z.number().min(0, 'Le montant demandé doit être positif'),
  awardedAmount: z.number().min(0).optional(),
  currency: z.string().default('CAD'),
  submissionDeadline: z.string().optional(),
  submittedAt: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  managerUserId: z.string().uuid().optional(),
  notes: z.string().optional(),
  contractUrl: z.string().optional(),
});

export type CreateGrantInput = z.infer<typeof CreateGrantSchema>;

export const UpdateGrantSchema = z.object({
  title: z.string().min(2).optional(),
  funderName: z.string().min(2).optional(),
  funderType: z.enum(['federal', 'provincial', 'municipal', 'foundation', 'corporate', 'other']).optional(),
  programName: z.string().optional(),
  projectId: z.string().uuid().nullable().optional(),
  status: z.enum(['prospect', 'drafting', 'submitted', 'approved', 'rejected', 'closed']).optional(),
  requestedAmount: z.number().min(0).optional(),
  awardedAmount: z.number().min(0).optional(),
  currency: z.string().optional(),
  submissionDeadline: z.string().nullable().optional(),
  submittedAt: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  managerUserId: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
  contractUrl: z.string().optional(),
});

export type UpdateGrantInput = z.infer<typeof UpdateGrantSchema>;

export const CreateGrantInstallmentSchema = z.object({
  installmentNumber: z.number().int().min(1).default(1),
  expectedDate: z.string().min(4, 'Date prévue requise (AAAA-MM-JJ)'),
  amount: z.number().positive('Le montant doit être positif'),
  status: z.enum(['scheduled', 'received', 'delayed', 'cancelled']).default('scheduled'),
  receivedAt: z.string().optional(),
  receivedAmount: z.number().min(0).optional(),
  conditions: z.string().optional(),
});

export type CreateGrantInstallmentInput = z.infer<typeof CreateGrantInstallmentSchema>;

export const UpdateGrantInstallmentSchema = z.object({
  installmentNumber: z.number().int().min(1).optional(),
  expectedDate: z.string().optional(),
  amount: z.number().positive().optional(),
  status: z.enum(['scheduled', 'received', 'delayed', 'cancelled']).optional(),
  receivedAt: z.string().nullable().optional(),
  receivedAmount: z.number().min(0).nullable().optional(),
  conditions: z.string().optional(),
});

export type UpdateGrantInstallmentInput = z.infer<typeof UpdateGrantInstallmentSchema>;

export const CreateGrantDeliverableSchema = z.object({
  title: z.string().min(2, 'Le titre du livrable ou rapport est requis'),
  deliverableType: z.enum(['narrative_report', 'financial_report', 'audit', 'evaluation', 'other']).default('narrative_report'),
  dueDate: z.string().min(4, 'Date d échéance requise (AAAA-MM-JJ)'),
  status: z.enum(['pending', 'in_progress', 'submitted', 'approved', 'overdue']).default('pending'),
  submittedAt: z.string().optional(),
  notes: z.string().optional(),
  fileUrl: z.string().optional(),
});

export type CreateGrantDeliverableInput = z.infer<typeof CreateGrantDeliverableSchema>;

export const UpdateGrantDeliverableSchema = z.object({
  title: z.string().min(2).optional(),
  deliverableType: z.enum(['narrative_report', 'financial_report', 'audit', 'evaluation', 'other']).optional(),
  dueDate: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'submitted', 'approved', 'overdue']).optional(),
  submittedAt: z.string().nullable().optional(),
  notes: z.string().optional(),
  fileUrl: z.string().optional(),
});

export type UpdateGrantDeliverableInput = z.infer<typeof UpdateGrantDeliverableSchema>;
