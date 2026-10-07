import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  withTenantContext,
  trainingProgram,
  course,
  trainingProgramCourse,
  trainingSession,
  sessionOccurrence,
  enrollment,
  attendance,
  certificate,
  CreateTrainingProgramInput,
  CreateCourseInput,
  CreateTrainingSessionInput,
  CreateOccurrenceInput,
  EnrollParticipantInput,
  RecordAttendanceInput,
} from '@orgdashio/shared';
import { eq, and } from 'drizzle-orm';
import { hasScheduleConflict, isEligibleForCertificate } from './training.utils';

@Injectable()
export class TrainingService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  // --- Training Program Methods ---
  async createTrainingProgram(tenantId: string, input: CreateTrainingProgramInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [newProg] = await tx
        .insert(trainingProgram)
        .values({
          tenantId,
          code: input.code,
          title: input.title,
          objectives: input.objectives,
          prerequisites: input.prerequisites,
          targetAudience: input.targetAudience,
          totalHours: input.totalHours,
          status: input.status || 'published',
        })
        .returning();
      return newProg;
    });
  }

  async addCourseToProgram(tenantId: string, programId: string, courseId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      // Check existing link
      const [existing] = await tx
        .select()
        .from(trainingProgramCourse)
        .where(
          and(
            eq(trainingProgramCourse.tenantId, tenantId),
            eq(trainingProgramCourse.trainingProgramId, programId),
            eq(trainingProgramCourse.courseId, courseId)
          )
        );

      if (existing) return existing;

      const [link] = await tx
        .insert(trainingProgramCourse)
        .values({
          tenantId,
          trainingProgramId: programId,
          courseId,
        })
        .returning();

      return link;
    });
  }

  async removeCourseFromProgram(tenantId: string, programId: string, courseId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      await tx
        .delete(trainingProgramCourse)
        .where(
          and(
            eq(trainingProgramCourse.tenantId, tenantId),
            eq(trainingProgramCourse.trainingProgramId, programId),
            eq(trainingProgramCourse.courseId, courseId)
          )
        );
      return { success: true };
    });
  }

  async findAllTrainingPrograms(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const progs = await tx.select().from(trainingProgram);
      const coursesList = await tx.select().from(course);
      const links = await tx.select().from(trainingProgramCourse);

      return progs.map((p: any) => {
        const progLinks = links.filter((l: any) => l.trainingProgramId === p.id);
        const linkedCourseIds = new Set(progLinks.map((l: any) => l.courseId));
        const progCourses = coursesList.filter((c: any) => linkedCourseIds.has(c.id));

        return {
          ...p,
          courses: progCourses,
        };
      });
    });
  }

  // --- Course Methods (Autonomes) ---
  async createCourse(tenantId: string, input: CreateCourseInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [newCourse] = await tx
        .insert(course)
        .values({
          tenantId,
          code: input.code,
          title: input.title,
          description: input.description,
          objectives: input.objectives,
          durationHours: input.durationHours,
        })
        .returning();
      return newCourse;
    });
  }

  async findAllCourses(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      return tx.select().from(course);
    });
  }

  // --- Session Methods ---
  async createSession(tenantId: string, input: CreateTrainingSessionInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [newSession] = await tx
        .insert(trainingSession)
        .values({
          tenantId,
          trainingProgramId: input.trainingProgramId || null,
          courseId: input.courseId || null,
          projectId: input.projectId || null,
          title: input.title,
          startDate: input.startDate ? new Date(input.startDate).toISOString().split('T')[0] : null,
          endDate: input.endDate ? new Date(input.endDate).toISOString().split('T')[0] : null,
          capacity: input.capacity,
          status: 'planned',
        })
        .returning();
      return newSession;
    });
  }

  async findAllSessions(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      return tx.select().from(trainingSession);
    });
  }

  async findSessionOne(tenantId: string, sessionId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [sess] = await tx
        .select()
        .from(trainingSession)
        .where(eq(trainingSession.id, sessionId));

      if (!sess) throw new NotFoundException('Session de formation introuvable');

      const occurrences = await tx
        .select()
        .from(sessionOccurrence)
        .where(eq(sessionOccurrence.sessionId, sessionId));

      const enrollments = await tx
        .select()
        .from(enrollment)
        .where(eq(enrollment.sessionId, sessionId));

      return {
        session: sess,
        occurrences,
        enrollments,
      };
    });
  }

  async addOccurrence(tenantId: string, sessionId: string, input: CreateOccurrenceInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [sess] = await tx
        .select()
        .from(trainingSession)
        .where(eq(trainingSession.id, sessionId));

      if (!sess) throw new NotFoundException('Session de formation introuvable');

      const newStart = new Date(input.startTime);
      const newEnd = new Date(input.endTime);

      if (input.trainerPartyId) {
        // Fetch all existing occurrences for this trainer across all sessions
        const existingOccurrences = await tx
          .select()
          .from(sessionOccurrence)
          .where(eq(sessionOccurrence.trainerPartyId, input.trainerPartyId));

        const formatted = existingOccurrences.map((o: any) => ({
          trainerPartyId: o.trainerPartyId,
          startTime: new Date(o.startTime),
          endTime: new Date(o.endTime),
        }));

        if (hasScheduleConflict(formatted, input.trainerPartyId, newStart, newEnd)) {
          throw new BadRequestException('Conflit d’horaire détecté pour ce formateur');
        }
      }

      const [occ] = await tx
        .insert(sessionOccurrence)
        .values({
          tenantId,
          sessionId,
          trainerPartyId: input.trainerPartyId,
          startTime: newStart,
          endTime: newEnd,
          location: input.location,
        })
        .returning();

      return occ;
    });
  }

  async enrollParticipant(tenantId: string, sessionId: string, input: EnrollParticipantInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [sess] = await tx
        .select()
        .from(trainingSession)
        .where(eq(trainingSession.id, sessionId));

      if (!sess) throw new NotFoundException('Session de formation introuvable');

      const existingEnrollments = await tx
        .select()
        .from(enrollment)
        .where(eq(enrollment.sessionId, sessionId));

      const isWaitlist = existingEnrollments.length >= sess.capacity;
      const status = isWaitlist ? 'waitlist' : 'confirmed';

      const [enr] = await tx
        .insert(enrollment)
        .values({
          tenantId,
          sessionId,
          partyId: input.partyId,
          source: input.source || 'agent',
          status,
        })
        .returning();

      return enr;
    });
  }

  async recordAttendance(tenantId: string, input: RecordAttendanceInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [att] = await tx
        .insert(attendance)
        .values({
          tenantId,
          occurrenceId: input.occurrenceId,
          enrollmentId: input.enrollmentId,
          status: input.status,
          notes: input.notes,
        })
        .onConflictDoUpdate({
          target: [attendance.tenantId, attendance.occurrenceId, attendance.enrollmentId],
          set: {
            status: input.status,
            notes: input.notes,
          },
        })
        .returning();

      return att;
    });
  }

  async issueCertificate(tenantId: string, enrollmentId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [enr] = await tx
        .select()
        .from(enrollment)
        .where(eq(enrollment.id, enrollmentId));

      if (!enr) throw new NotFoundException('Inscription introuvable');

      // Get session occurrences count
      const occurrences = await tx
        .select()
        .from(sessionOccurrence)
        .where(eq(sessionOccurrence.sessionId, enr.sessionId));

      const totalOccurrences = occurrences.length;

      // Get attendances for this enrollment with status 'present' or 'late'
      const attendances = await tx
        .select()
        .from(attendance)
        .where(eq(attendance.enrollmentId, enrollmentId));

      const presentCount = attendances.filter(
        (a: any) => a.status === 'present' || a.status === 'late'
      ).length;

      if (!isEligibleForCertificate(presentCount, totalOccurrences)) {
        throw new BadRequestException(
          `Taux de présence insuffisant (${presentCount}/${totalOccurrences}) pour délivrer un certificat (80% requis)`
        );
      }

      const certNum = `CERT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const [cert] = await tx
        .insert(certificate)
        .values({
          tenantId,
          enrollmentId,
          certNumber: certNum,
          status: 'valid',
        })
        .returning();

      return cert;
    });
  }
}
