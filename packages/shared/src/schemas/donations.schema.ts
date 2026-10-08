import { z } from 'zod';

// Donor Schemas
export const CreateDonorSchema = z.object({
  type: z.enum(['individual', 'organization', 'anonymous']).default('individual'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email('Courriel invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  taxAddress: z.string().optional(),
  taxCity: z.string().optional(),
  taxStateProvince: z.string().default('QC'),
  taxPostalCode: z.string().optional(),
  taxCountry: z.string().default('Canada'),
  notes: z.string().optional(),
});

export type CreateDonorInput = z.infer<typeof CreateDonorSchema>;

export const UpdateDonorSchema = CreateDonorSchema.partial();
export type UpdateDonorInput = z.infer<typeof UpdateDonorSchema>;

// Campaign Schemas
export const CreateDonationCampaignSchema = z.object({
  code: z.string().min(2, 'Le code de campagne est requis (ex. CAMP-2026)'),
  name: z.string().min(2, 'Le nom de la campagne est requis'),
  description: z.string().optional(),
  targetAmount: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).default('active'),
  projectId: z.string().uuid().optional(),
});

export type CreateDonationCampaignInput = z.infer<typeof CreateDonationCampaignSchema>;

export const UpdateDonationCampaignSchema = CreateDonationCampaignSchema.partial();
export type UpdateDonationCampaignInput = z.infer<typeof UpdateDonationCampaignSchema>;

// Donation Schemas
export const CreateDonationSchema = z.object({
  donorId: z.string().uuid('Identifiant donateur requis'),
  campaignId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  donationDate: z.string().optional(),
  grossAmount: z.number().positive('Le montant brut du don doit être supérieur à zéro'),
  advantageAmount: z.number().min(0).default(0),
  currency: z.string().default('CAD'),
  paymentMethod: z.enum(['interac', 'credit_card', 'cheque', 'cash', 'bank_transfer', 'other']).default('interac'),
  paymentReference: z.string().optional(),
  recurrence: z.enum(['one_time', 'monthly', 'annual']).default('one_time'),
  status: z.enum(['received', 'pledged', 'refunded', 'failed']).default('received'),
  isTaxReceiptEligible: z.boolean().default(true),
  notes: z.string().optional(),
  generateReceiptNow: z.boolean().default(false),
  locationIssued: z.string().optional(),
  authorizedSignatoryName: z.string().optional(),
});

export type CreateDonationInput = z.infer<typeof CreateDonationSchema>;

export const UpdateDonationSchema = z.object({
  campaignId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  donationDate: z.string().optional(),
  grossAmount: z.number().positive().optional(),
  advantageAmount: z.number().min(0).optional(),
  paymentMethod: z.enum(['interac', 'credit_card', 'cheque', 'cash', 'bank_transfer', 'other']).optional(),
  paymentReference: z.string().nullable().optional(),
  recurrence: z.enum(['one_time', 'monthly', 'annual']).optional(),
  status: z.enum(['received', 'pledged', 'refunded', 'failed']).optional(),
  isTaxReceiptEligible: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateDonationInput = z.infer<typeof UpdateDonationSchema>;

// Tax Receipt Schemas
export const IssueSingleTaxReceiptSchema = z.object({
  donationId: z.string().uuid('Identifiant de don requis'),
  locationIssued: z.string().min(2).default('Montréal, QC'),
  authorizedSignatoryName: z.string().min(2, 'Le nom du signataire autorisé est obligatoire pour l\'ARC'),
});

export type IssueSingleTaxReceiptInput = z.infer<typeof IssueSingleTaxReceiptSchema>;

export const IssueAnnualConsolidatedTaxReceiptSchema = z.object({
  donorId: z.string().uuid('Identifiant donateur requis'),
  taxYear: z.number().int().min(2000).max(2100),
  locationIssued: z.string().min(2).default('Montréal, QC'),
  authorizedSignatoryName: z.string().min(2, 'Le nom du signataire autorisé est obligatoire pour l\'ARC'),
});

export type IssueAnnualConsolidatedTaxReceiptInput = z.infer<typeof IssueAnnualConsolidatedTaxReceiptSchema>;

export const CancelTaxReceiptSchema = z.object({
  reason: z.string().min(3, 'La raison d\'annulation ou remplacement est requise par les normes ARC'),
  replaceWithNew: z.boolean().default(false),
  locationIssued: z.string().optional(),
  authorizedSignatoryName: z.string().optional(),
});

export type CancelTaxReceiptInput = z.infer<typeof CancelTaxReceiptSchema>;
