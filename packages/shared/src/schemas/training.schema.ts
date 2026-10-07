import { z } from 'zod';

export const CreateTrainingProgramSchema = z.object({
  code: z.string().min(2, 'Le code du programme est requis'),
  title: z.string().min(2, 'Le titre du programme est requis'),
  objectives: z.string().optional(),
  prerequisites: z.string().optional(),
  targetAudience: z.string().optional(),
  totalHours: z.number().int().nonnegative().default(0),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
});

export type CreateTrainingProgramInput = z.infer<typeof CreateTrainingProgramSchema>;

export const AddCourseToProgramSchema = z.object({
  courseId: z.string().uuid('ID de cours invalide'),
});

export type AddCourseToProgramInput = z.infer<typeof AddCourseToProgramSchema>;

export const CreateCourseSchema = z.object({
  code: z.string().min(2, 'Le code du cours est requis'),
  title: z.string().min(2, 'Le titre du cours est requis'),
  description: z.string().optional(),
  objectives: z.string().optional(),
  durationHours: z.number().int().positive().default(1),
});

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;

export const CreateTrainingSessionSchema = z.object({
  trainingProgramId: z.string().uuid().optional().nullable(),
  courseId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  title: z.string().min(2, 'Titre de la session requis'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  capacity: z.number().int().positive().default(20),
});

export type CreateTrainingSessionInput = z.infer<typeof CreateTrainingSessionSchema>;

export const CreateOccurrenceSchema = z.object({
  trainerPartyId: z.string().uuid().optional(),
  startTime: z.string().datetime('Date/heure de début invalide (ISO 8601)'),
  endTime: z.string().datetime('Date/heure de fin invalide (ISO 8601)'),
  location: z.string().optional(),
});

export type CreateOccurrenceInput = z.infer<typeof CreateOccurrenceSchema>;

export const EnrollParticipantSchema = z.object({
  partyId: z.string().uuid('ID bénéficiaire invalide'),
  source: z.enum(['agent', 'public_form', 'csv_import']).default('agent'),
});

export type EnrollParticipantInput = z.infer<typeof EnrollParticipantSchema>;

export const RecordAttendanceSchema = z.object({
  occurrenceId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().optional(),
});

export type RecordAttendanceInput = z.infer<typeof RecordAttendanceSchema>;
