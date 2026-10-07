import { z } from 'zod';

export const CreatePersonSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Courriel invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD').optional(),
  genderCode: z.string().optional(),
  preferredLang: z.enum(['fr', 'en']).default('fr'),
});

export type CreatePersonInput = z.infer<typeof CreatePersonSchema>;

export const RecordConsentSchema = z.object({
  purposeId: z.string().uuid(),
  version: z.string().default('1.0'),
  status: z.enum(['given', 'withdrawn', 'expired']).default('given'),
  mode: z.enum(['written', 'verbal', 'electronic']).default('written'),
});

export type RecordConsentInput = z.infer<typeof RecordConsentSchema>;

export const CreateHouseholdSchema = z.object({
  name: z.string().min(2, 'Le nom du ménage est requis'),
  address: z.string().optional(),
});

export type CreateHouseholdInput = z.infer<typeof CreateHouseholdSchema>;

export const AddServiceDeliverySchema = z.object({
  serviceTypeId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  deliveredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
});

export type AddServiceDeliveryInput = z.infer<typeof AddServiceDeliverySchema>;

export const CreateStaffSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Courriel invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  jobTitle: z.string().min(2, 'Le titre du poste est requis'),
  departmentId: z.string().uuid().optional().nullable(),
  employmentType: z.enum(['employee', 'volunteer', 'board_member', 'contractor', 'intern']).default('employee'),
  status: z.enum(['active', 'on_leave', 'inactive', 'archived']).default('active'),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD').optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  sendInviteEmail: z.boolean().optional().default(false),
  roleId: z.string().uuid().optional(),
});

export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;

export const UpdateStaffSchema = CreateStaffSchema.partial();
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;
