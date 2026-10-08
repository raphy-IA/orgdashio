import { z } from 'zod';

// HR Profile Schema
export const CreateUserHrProfileSchema = z.object({
  userId: z.string().uuid('Identifiant utilisateur requis'),
  employeeNumber: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  contractType: z.enum(['full_time', 'part_time', 'contractor', 'volunteer', 'intern']).default('full_time'),
  standardWeeklyHours: z.number().min(0).max(100).default(35),
  defaultHourlyRate: z.number().min(0).default(30),
  volunteerImputedRate: z.number().min(0).default(25),
  active: z.boolean().default(true),
});

export type CreateUserHrProfileInput = z.infer<typeof CreateUserHrProfileSchema>;

export const UpdateUserHrProfileSchema = CreateUserHrProfileSchema.partial();
export type UpdateUserHrProfileInput = z.infer<typeof UpdateUserHrProfileSchema>;

// Timesheet Period Schema
export const CreateTimesheetSchema = z.object({
  userId: z.string().uuid('Identifiant utilisateur requis').optional(),
  periodStartDate: z.string().min(4, 'Date de début de période requise (AAAA-MM-JJ)'),
  periodEndDate: z.string().min(4, 'Date de fin de période requise (AAAA-MM-JJ)'),
});

export type CreateTimesheetInput = z.infer<typeof CreateTimesheetSchema>;

export const UpdateTimesheetStatusSchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']),
  reviewNotes: z.string().optional(),
});

export type UpdateTimesheetStatusInput = z.infer<typeof UpdateTimesheetStatusSchema>;

// Timesheet Entry Schema
export const CreateTimesheetEntrySchema = z.object({
  timesheetId: z.string().uuid('Identifiant feuille de temps requis'),
  projectId: z.string().uuid().optional(),
  grantId: z.string().uuid().optional(),
  planItemId: z.string().uuid().optional(),
  activityType: z
    .enum([
      'direct_program',
      'management_admin',
      'fundraising',
      'training_delivery',
      'case_work',
      'statutory_holiday',
      'pto_vacation',
      'sick_leave',
      'other',
    ])
    .default('direct_program'),
  entryDate: z.string().min(4, 'Date requise (AAAA-MM-JJ)'),
  hours: z.number().positive('Le nombre d\'heures doit être supérieur à zéro').max(24, 'Maximum 24 heures par jour'),
  hourlyRate: z.number().min(0).optional(),
  description: z.string().optional(),
  isBillable: z.boolean().default(true),
});

export type CreateTimesheetEntryInput = z.infer<typeof CreateTimesheetEntrySchema>;

export const UpdateTimesheetEntrySchema = CreateTimesheetEntrySchema.partial();
export type UpdateTimesheetEntryInput = z.infer<typeof UpdateTimesheetEntrySchema>;

export const BatchUpsertTimesheetEntriesSchema = z.object({
  timesheetId: z.string().uuid(),
  entries: z.array(
    z.object({
      id: z.string().uuid().optional(),
      projectId: z.string().uuid().nullable().optional(),
      grantId: z.string().uuid().nullable().optional(),
      planItemId: z.string().uuid().nullable().optional(),
      activityType: z
        .enum([
          'direct_program',
          'management_admin',
          'fundraising',
          'training_delivery',
          'case_work',
          'statutory_holiday',
          'pto_vacation',
          'sick_leave',
          'other',
        ])
        .default('direct_program'),
      entryDate: z.string(),
      hours: z.number().min(0).max(24),
      hourlyRate: z.number().min(0).optional(),
      description: z.string().nullable().optional(),
      isBillable: z.boolean().default(true),
    })
  ),
});

export type BatchUpsertTimesheetEntriesInput = z.infer<typeof BatchUpsertTimesheetEntriesSchema>;
