import { z } from 'zod';

export const FundingSourceSchema = z.object({
  donorName: z.string().min(2, 'Le nom du bailleur doit comporter au moins 2 caractères'),
  fundingType: z.enum(['grant', 'restricted_donation', 'unrestricted', 'other']),
  amount: z.number().positive('Le montant doit être supérieur à 0'),
  currency: z.string().length(3).default('CAD'),
  reportDueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date requis: YYYY-MM-DD').optional(),
  notes: z.string().optional(),
});

export type FundingSourceInput = z.infer<typeof FundingSourceSchema>;

export const ResultNodeSchema = z.object({
  parentId: z.string().uuid().optional(),
  level: z.enum(['impact', 'outcome', 'output']),
  title: z.string().min(2, 'Le titre doit comporter au moins 2 caractères'),
  description: z.string().optional(),
});

export type ResultNodeInput = z.infer<typeof ResultNodeSchema>;

export const CreatePlanItemSchema = z.object({
  parentId: z.string().uuid().optional(),
  resultNodeId: z.string().uuid().optional(),
  type: z.enum(['phase', 'activity', 'task', 'milestone', 'deliverable']),
  wbs: z.string().optional(),
  title: z.string().min(2, 'Le titre de la tâche est requis'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  durationDays: z.number().int().min(1).default(1),
  estimatedCost: z.number().nonnegative().optional().default(0),
  optimisticDays: z.number().int().min(1).optional().nullable(),
  mostLikelyDays: z.number().int().min(1).optional().nullable(),
  pessimisticDays: z.number().int().min(1).optional().nullable(),
  assigneePartyId: z.string().uuid().optional(),
});

export type CreatePlanItemInput = z.infer<typeof CreatePlanItemSchema>;

export const CreateDependencySchema = z.object({
  predecessorId: z.string().uuid('ID prédécesseur invalide'),
  successorId: z.string().uuid('ID successeur invalide'),
  type: z.enum(['FS', 'SS', 'FF', 'SF']).default('FS'),
  lagDays: z.number().int().default(0),
});

export type CreateDependencyInput = z.infer<typeof CreateDependencySchema>;

export const CreateBudgetLineSchema = z.object({
  categoryCode: z.enum([
    'personnel',
    'material',
    'transport',
    'premises',
    'communication',
    'training',
    'subcontracting',
    'administrative',
    'direct_aid',
  ]),
  description: z.string().min(2, 'Description requise'),
  amount: z.number().nonnegative('Le montant doit être positif ou nul'),
});

export type CreateBudgetLineInput = z.infer<typeof CreateBudgetLineSchema>;

export const UpdateBudgetLineSchema = CreateBudgetLineSchema.partial();
export type UpdateBudgetLineInput = z.infer<typeof UpdateBudgetLineSchema>;

export const CreateExpenseSchema = z.object({
  budgetLineId: z.string().uuid('ID ligne budgétaire invalide'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date YYYY-MM-DD'),
  vendor: z.string().min(2, 'Le fournisseur est requis'),
  amount: z.number().positive('Le montant doit être supérieur à 0'),
  taxTps: z.number().nonnegative().default(0),
  taxTvq: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

export const CreateRaidItemSchema = z.object({
  type: z.enum(['risk', 'issue', 'assumption', 'dependency']),
  title: z.string().min(2, 'Le titre est requis'),
  description: z.string().optional(),
  probability: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  ownerName: z.string().optional(),
});

export type CreateRaidItemInput = z.infer<typeof CreateRaidItemSchema>;

export const UpdatePlanItemSchema = z.object({
  title: z.string().min(2).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  durationDays: z.number().int().min(1).optional(),
  estimatedCost: z.number().nonnegative().optional(),
  optimisticDays: z.number().int().min(1).optional().nullable(),
  mostLikelyDays: z.number().int().min(1).optional().nullable(),
  pessimisticDays: z.number().int().min(1).optional().nullable(),
  progressPct: z.number().int().min(0).max(100).optional(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'completed', 'cancelled']).optional(),
  assigneePartyId: z.string().uuid().nullable().optional(),
});

export type UpdatePlanItemInput = z.infer<typeof UpdatePlanItemSchema>;

export const UpdateRaidItemSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  probability: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  ownerName: z.string().optional(),
  status: z.string().optional(),
});

export type UpdateRaidItemInput = z.infer<typeof UpdateRaidItemSchema>;

export const CreateProjectMemberSchema = z.object({
  userId: z.string().uuid().optional(),
  partyId: z.string().uuid().optional(),
  name: z.string().min(2, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  role: z.enum(['manager', 'coordinator', 'contributor', 'stakeholder', 'expert', 'beneficiary_rep']).default('contributor'),
  raciRole: z.enum(['R', 'A', 'C', 'I']).default('R'),
  allocationPct: z.number().int().min(1).max(100).default(100),
});

export type CreateProjectMemberInput = z.infer<typeof CreateProjectMemberSchema>;

export const SetPlanItemRaciSchema = z.object({
  planItemId: z.string().uuid('ID tâche / élément de plan requis'),
  projectMemberId: z.string().uuid('ID membre du projet requis'),
  raciRole: z.enum(['R', 'A', 'C', 'I']).nullable().optional(),
});

export type SetPlanItemRaciInput = z.infer<typeof SetPlanItemRaciSchema>;

export const CreatePlanItemUpdateSchema = z.object({
  authorName: z.string().min(2, "Nom de l'auteur requis"),
  progressPct: z.number().int().min(0).max(100).optional(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'completed', 'cancelled']).optional(),
  comment: z.string().min(2, 'Le commentaire est requis'),
  blockerReason: z.string().optional(),
});

export type CreatePlanItemUpdateInput = z.infer<typeof CreatePlanItemUpdateSchema>;

export const CreatePlanItemDeliverableSchema = z.object({
  title: z.string().min(2, 'Le titre du livrable est requis'),
  description: z.string().optional(),
  fileUrl: z.string().url('URL invalide').optional().or(z.literal('')),
});

export type CreatePlanItemDeliverableInput = z.infer<typeof CreatePlanItemDeliverableSchema>;

export const VerifyDeliverableSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  verifiedBy: z.string().min(2, 'Nom du vérificateur requis'),
});

export type VerifyDeliverableInput = z.infer<typeof VerifyDeliverableSchema>;
