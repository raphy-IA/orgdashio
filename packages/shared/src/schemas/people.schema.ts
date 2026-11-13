import { z } from 'zod';

export const CreatePersonSchema = z.object({
  kind: z.enum(['person', 'organization']).default('person'),
  beneficiaryType: z.enum(['individual', 'household', 'community', 'organization', 'institution']).default('individual'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(), // Used for collective entities (household, community, org, institution)
  email: z.string().email('Courriel invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD').optional(),
  genderCode: z.string().optional(),
  preferredLang: z.enum(['fr', 'en']).default('fr'),
  customFields: z.record(z.any()).optional(),
}).refine(
  (data) => {
    if (data.beneficiaryType !== 'individual') {
      return (data.name && data.name.trim().length > 0) || (data.lastName && data.lastName.trim().length > 0);
    }
    return !!(data.lastName && data.lastName.trim().length > 0);
  },
  {
    message: 'Le nom est requis',
    path: ['lastName'],
  }
);

export type CreatePersonInput = z.infer<typeof CreatePersonSchema>;

export const UpdatePersonSchema = z.object({
  kind: z.enum(['person', 'organization']).optional(),
  beneficiaryType: z.enum(['individual', 'household', 'community', 'organization', 'institution']).optional(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email('Courriel invalide').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD').optional().nullable(),
  genderCode: z.string().optional().nullable(),
  preferredLang: z.enum(['fr', 'en']).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  customFields: z.record(z.any()).optional(),
});

export type UpdatePersonInput = z.infer<typeof UpdatePersonSchema>;

export const RecordConsentSchema = z.object({
  purposeCode: z.string().default('loi_25_general'),
  version: z.string().default('1.0'),
  status: z.enum(['granted', 'refused', 'withdrawn', 'given', 'expired']).default('granted'),
  mode: z.enum(['written', 'verbal', 'electronic']).default('written'),
});

export type RecordConsentInput = z.infer<typeof RecordConsentSchema>;

export const CreateHouseholdSchema = z.object({
  name: z.string().min(2, 'Le nom du ménage est requis'),
  address: z.string().optional(),
});

export type CreateHouseholdInput = z.infer<typeof CreateHouseholdSchema>;

export const AddServiceDeliverySchema = z.object({
  serviceType: z.string().min(1, 'Le type de prestation est requis'),
  projectId: z.string().uuid().optional().nullable(),
  deliveredAt: z.string().optional(),
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
  createAccount: z.boolean().optional().default(false),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').optional().or(z.literal('')),
  roleId: z.string().uuid().optional().nullable(),
  sendInviteEmail: z.boolean().optional().default(false),
});

export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;

export const UpdateStaffSchema = CreateStaffSchema.partial();
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;

export const CreateStaffAccountSchema = z.object({
  password: z.string().min(6, 'Le mot de passe doit comporter au moins 6 caractères').optional().or(z.literal('')),
  roleId: z.string().uuid().optional().nullable(),
});
export type CreateStaffAccountInput = z.infer<typeof CreateStaffAccountSchema>;
