import { z } from 'zod';

export const ChangePlanSchema = z.object({
  planCode: z.enum(['community', 'starter', 'pro', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
  seatCount: z.number().int().min(1).optional(),
});

export type ChangePlanInput = z.infer<typeof ChangePlanSchema>;

export const UpdatePaymentMethodSchema = z.object({
  paymentMethodLast4: z.string().length(4, 'Doit contenir 4 chiffres'),
  paymentMethodBrand: z.string().min(2, 'Marque requise (Visa, MasterCard, Amex)'),
  billingEmail: z.string().email('Courriel de facturation invalide').optional(),
  billingAddress: z.string().optional(),
  neqNumber: z.string().optional(),
});

export type UpdatePaymentMethodInput = z.infer<typeof UpdatePaymentMethodSchema>;

export const CreatePlanSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  priceMonthly: z.number().min(0),
  priceAnnual: z.number().min(0),
  maxUsers: z.number().int().min(1),
  maxStorageGb: z.number().int().min(1),
  maxProjects: z.number().int().min(1),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;
