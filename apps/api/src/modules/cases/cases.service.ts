import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  withTenantContext,
  caseFile,
  caseAssignment,
  caseNote,
  breakGlassLog,
  interventionPlan,
  interventionGoal,
  caseReferral,
  party,
  beneficiaryProfile,
  userAccount,
  CreateCaseInput,
  CreateCaseNoteInput,
  BreakGlassInput,
  CreateInterventionPlanInput,
  CreateInterventionGoalInput,
  UpdateInterventionGoalInput,
  CreateCaseReferralInput,
  AssignCaseWorkerInput,
} from '@orgdashio/shared';
import { eq, and, desc } from 'drizzle-orm';
import { canUserAccessCase, isNoteEditable } from './cases.utils';

@Injectable()
export class CasesService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async createCase(tenantId: string, primaryWorkerUserId: string, input: CreateCaseInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const caseNumber = `CAS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const [newCase] = await tx
        .insert(caseFile)
        .values({
          tenantId,
          partyId: input.partyId,
          caseNumber,
          title: input.title,
          confidentialityLevel: input.confidentialityLevel || 'restricted',
          primaryWorkerUserId,
          status: 'open',
        })
        .returning();

      // Assign primary worker
      await tx.insert(caseAssignment).values({
        tenantId,
        caseFileId: newCase.id,
        userId: primaryWorkerUserId,
        role: 'primary_worker',
      });

      return newCase;
    });
  }

  async findAllCases(tenantId: string, userId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const cases = await tx.select().from(caseFile).orderBy(desc(caseFile.openedAt));
      const assignments = await tx.select().from(caseAssignment);
      const parties = await tx.select().from(party).where(eq(party.tenantId, tenantId));
      const partyMap = new Map<string, any>(parties.map((p: any) => [p.id, p]));

      const users = await this.db.select().from(userAccount);
      const userMap = new Map<string, any>(users.map((u: any) => [u.id, u]));

      const breakGlasses = await tx
        .select()
        .from(breakGlassLog)
        .where(eq(breakGlassLog.userId, userId));

      const activeBreakGlassCaseIds = new Set(breakGlasses.map((b: any) => b.caseFileId));

      const accessibleCases = cases.filter((c: any) => {
        const assignedUserIds = assignments
          .filter((a: any) => a.caseFileId === c.id)
          .map((a: any) => a.userId);

        return canUserAccessCase({
          confidentialityLevel: c.confidentialityLevel,
          primaryWorkerUserId: c.primaryWorkerUserId,
          assignedUserIds,
          userId,
          hasActiveBreakGlass: activeBreakGlassCaseIds.has(c.id),
        });
      });

      return accessibleCases.map((c: any) => {
        const beneficiary = partyMap.get(c.partyId) || null;
        const primaryWorker = userMap.get(c.primaryWorkerUserId) || null;
        const caseAssigns = assignments.filter((a: any) => a.caseFileId === c.id);

        return {
          ...c,
          beneficiary: beneficiary
            ? {
                id: beneficiary.id,
                firstName: beneficiary.firstName,
                lastName: beneficiary.lastName,
                email: beneficiary.email,
                phone: beneficiary.phone,
              }
            : null,
          primaryWorker: primaryWorker
            ? {
                id: primaryWorker.id,
                firstName: primaryWorker.firstName,
                lastName: primaryWorker.lastName,
                email: primaryWorker.email,
              }
            : null,
          teamCount: caseAssigns.length,
        };
      });
    });
  }

  async findOneCase(tenantId: string, userId: string, caseId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [c] = await tx.select().from(caseFile).where(eq(caseFile.id, caseId));
      if (!c) throw new NotFoundException('Dossier introuvable');

      const assignments = await tx
        .select()
        .from(caseAssignment)
        .where(eq(caseAssignment.caseFileId, caseId));

      const assignedUserIds = assignments.map((a: any) => a.userId);

      const breakGlasses = await tx
        .select()
        .from(breakGlassLog)
        .where(and(eq(breakGlassLog.caseFileId, caseId), eq(breakGlassLog.userId, userId)));

      const hasActiveBreakGlass = breakGlasses.length > 0;

      const hasAccess = canUserAccessCase({
        confidentialityLevel: c.confidentialityLevel,
        primaryWorkerUserId: c.primaryWorkerUserId,
        assignedUserIds,
        userId,
        hasActiveBreakGlass,
      });

      if (!hasAccess) {
        throw new ForbiddenException({
          message: 'Accès restreint au dossier confidentiel',
          requiresBreakGlass: true,
        });
      }

      // Fetch Beneficiary info
      const [beneficiary] = await tx.select().from(party).where(eq(party.id, c.partyId));
      const [profile] = await tx.select().from(beneficiaryProfile).where(eq(beneficiaryProfile.partyId, c.partyId));

      // Fetch Team user accounts
      const allUsers = await this.db.select().from(userAccount);
      const userMap = new Map(allUsers.map((u: any) => [u.id, u]));

      const teamWithDetails = assignments.map((a: any) => {
        const u = userMap.get(a.userId);
        return {
          ...a,
          user: u
            ? {
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                jobTitle: u.jobTitle,
              }
            : null,
        };
      });

      // Notes & Addenda
      const notes = await tx
        .select()
        .from(caseNote)
        .where(eq(caseNote.caseFileId, caseId))
        .orderBy(desc(caseNote.createdAt));

      const formattedNotes = notes.map((n: any) => {
        const author = userMap.get(n.authorUserId);
        return {
          ...n,
          author: author
            ? {
                id: author.id,
                firstName: author.firstName,
                lastName: author.lastName,
                email: author.email,
              }
            : null,
          isEditable: isNoteEditable(new Date(n.createdAt)),
        };
      });

      // Intervention Plans & Goals
      const plans = await tx
        .select()
        .from(interventionPlan)
        .where(eq(interventionPlan.caseFileId, caseId))
        .orderBy(desc(interventionPlan.createdAt));

      const goals = await tx.select().from(interventionGoal);
      const goalsByPlan = new Map<string, any[]>();
      goals.forEach((g: any) => {
        if (!goalsByPlan.has(g.planId)) goalsByPlan.set(g.planId, []);
        goalsByPlan.get(g.planId)!.push(g);
      });

      const plansWithGoals = plans.map((p: any) => ({
        ...p,
        creator: userMap.get(p.createdByUserId)
          ? {
              firstName: userMap.get(p.createdByUserId)?.firstName,
              lastName: userMap.get(p.createdByUserId)?.lastName,
            }
          : null,
        goals: goalsByPlan.get(p.id) || [],
      }));

      // External Referrals
      const referrals = await tx
        .select()
        .from(caseReferral)
        .where(eq(caseReferral.caseFileId, caseId))
        .orderBy(desc(caseReferral.referredAt));

      // All Break Glass Logs for Audit
      const allAuditLogs = await tx
        .select()
        .from(breakGlassLog)
        .where(eq(breakGlassLog.caseFileId, caseId))
        .orderBy(desc(breakGlassLog.accessedAt));

      const auditLogsWithUsers = allAuditLogs.map((l: any) => {
        const u = userMap.get(l.userId);
        return {
          ...l,
          user: u ? { firstName: u.firstName, lastName: u.lastName, email: u.email } : null,
        };
      });

      return {
        caseFile: c,
        beneficiary: beneficiary ? { ...beneficiary, profile } : null,
        assignments: teamWithDetails,
        notes: formattedNotes,
        interventionPlans: plansWithGoals,
        referrals,
        breakGlassLogs: auditLogsWithUsers,
      };
    });
  }

  async updateCase(
    tenantId: string,
    caseId: string,
    input: { title?: string; status?: 'open' | 'active' | 'under_review' | 'closed'; confidentialityLevel?: 'standard' | 'restricted' | 'highly_confidential' }
  ) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [updated] = await tx
        .update(caseFile)
        .set({
          ...(input.title !== undefined && { title: input.title }),
          ...(input.status !== undefined && {
            status: input.status,
            closedAt: input.status === 'closed' ? new Date() : null,
          }),
          ...(input.confidentialityLevel !== undefined && { confidentialityLevel: input.confidentialityLevel }),
        })
        .where(and(eq(caseFile.id, caseId), eq(caseFile.tenantId, tenantId)))
        .returning();

      if (!updated) throw new NotFoundException('Dossier introuvable');
      return updated;
    });
  }

  async addNote(tenantId: string, authorUserId: string, caseId: string, input: CreateCaseNoteInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [c] = await tx.select().from(caseFile).where(eq(caseFile.id, caseId));
      if (!c) throw new NotFoundException('Dossier introuvable');

      if (input.parentNoteId) {
        const [parent] = await tx.select().from(caseNote).where(eq(caseNote.id, input.parentNoteId));
        if (!parent) throw new NotFoundException('Note parente introuvable');
      }

      const [newNote] = await tx
        .insert(caseNote)
        .values({
          tenantId,
          caseFileId: caseId,
          authorUserId,
          noteType: input.noteType,
          content: input.content,
          parentNoteId: input.parentNoteId || null,
        })
        .returning();

      return newNote;
    });
  }

  async assignWorker(tenantId: string, caseId: string, input: AssignCaseWorkerInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [c] = await tx.select().from(caseFile).where(eq(caseFile.id, caseId));
      if (!c) throw new NotFoundException('Dossier introuvable');

      const [existing] = await tx
        .select()
        .from(caseAssignment)
        .where(
          and(
            eq(caseAssignment.tenantId, tenantId),
            eq(caseAssignment.caseFileId, caseId),
            eq(caseAssignment.userId, input.userId)
          )
        );

      if (existing) {
        const [updated] = await tx
          .update(caseAssignment)
          .set({ role: input.role })
          .where(eq(caseAssignment.id, existing.id))
          .returning();
        return updated;
      }

      const [created] = await tx
        .insert(caseAssignment)
        .values({
          tenantId,
          caseFileId: caseId,
          userId: input.userId,
          role: input.role,
        })
        .returning();

      return created;
    });
  }

  async removeWorker(tenantId: string, caseId: string, assignmentId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      await tx
        .delete(caseAssignment)
        .where(
          and(
            eq(caseAssignment.tenantId, tenantId),
            eq(caseAssignment.caseFileId, caseId),
            eq(caseAssignment.id, assignmentId)
          )
        );
      return { success: true };
    });
  }

  // --- Intervention Plans & Goals ---
  async createInterventionPlan(tenantId: string, userId: string, caseId: string, input: CreateInterventionPlanInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [c] = await tx.select().from(caseFile).where(eq(caseFile.id, caseId));
      if (!c) throw new NotFoundException('Dossier introuvable');

      const [newPlan] = await tx
        .insert(interventionPlan)
        .values({
          tenantId,
          caseFileId: caseId,
          title: input.title,
          description: input.description,
          status: input.status || 'active',
          startDate: input.startDate || null,
          reviewDate: input.reviewDate || null,
          createdByUserId: userId,
        })
        .returning();

      return newPlan;
    });
  }

  async updateInterventionPlan(tenantId: string, caseId: string, planId: string, input: Partial<CreateInterventionPlanInput>) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [updated] = await tx
        .update(interventionPlan)
        .set({
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.startDate !== undefined && { startDate: input.startDate }),
          ...(input.reviewDate !== undefined && { reviewDate: input.reviewDate }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(interventionPlan.id, planId),
            eq(interventionPlan.caseFileId, caseId),
            eq(interventionPlan.tenantId, tenantId)
          )
        )
        .returning();

      if (!updated) throw new NotFoundException('Plan d’intervention introuvable');
      return updated;
    });
  }

  async addInterventionGoal(tenantId: string, caseId: string, planId: string, input: CreateInterventionGoalInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [plan] = await tx
        .select()
        .from(interventionPlan)
        .where(
          and(
            eq(interventionPlan.id, planId),
            eq(interventionPlan.caseFileId, caseId),
            eq(interventionPlan.tenantId, tenantId)
          )
        );

      if (!plan) throw new NotFoundException('Plan d’intervention introuvable');

      const [newGoal] = await tx
        .insert(interventionGoal)
        .values({
          tenantId,
          planId,
          title: input.title,
          description: input.description,
          targetDate: input.targetDate || null,
          status: input.status || 'in_progress',
          notes: input.notes,
        })
        .returning();

      return newGoal;
    });
  }

  async updateInterventionGoal(tenantId: string, caseId: string, goalId: string, input: UpdateInterventionGoalInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [updated] = await tx
        .update(interventionGoal)
        .set({
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.targetDate !== undefined && { targetDate: input.targetDate }),
          ...(input.status !== undefined && {
            status: input.status,
            achievedAt: input.status === 'achieved' ? new Date() : null,
          }),
          ...(input.notes !== undefined && { notes: input.notes }),
        })
        .where(and(eq(interventionGoal.id, goalId), eq(interventionGoal.tenantId, tenantId)))
        .returning();

      if (!updated) throw new NotFoundException('Objectif introuvable');
      return updated;
    });
  }

  async deleteInterventionGoal(tenantId: string, caseId: string, goalId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      await tx
        .delete(interventionGoal)
        .where(and(eq(interventionGoal.id, goalId), eq(interventionGoal.tenantId, tenantId)));
      return { success: true };
    });
  }

  // --- External Referrals ---
  async createReferral(tenantId: string, caseId: string, input: CreateCaseReferralInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [c] = await tx.select().from(caseFile).where(eq(caseFile.id, caseId));
      if (!c) throw new NotFoundException('Dossier introuvable');

      const [newRef] = await tx
        .insert(caseReferral)
        .values({
          tenantId,
          caseFileId: caseId,
          organizationName: input.organizationName,
          serviceType: input.serviceType,
          contactPerson: input.contactPerson,
          contactPhone: input.contactPhone,
          contactEmail: input.contactEmail || null,
          reason: input.reason,
          status: input.status || 'pending',
          outcomeNotes: input.outcomeNotes,
        })
        .returning();

      return newRef;
    });
  }

  async updateReferral(
    tenantId: string,
    caseId: string,
    referralId: string,
    input: Partial<CreateCaseReferralInput>
  ) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [updated] = await tx
        .update(caseReferral)
        .set({
          ...(input.organizationName !== undefined && { organizationName: input.organizationName }),
          ...(input.serviceType !== undefined && { serviceType: input.serviceType }),
          ...(input.contactPerson !== undefined && { contactPerson: input.contactPerson }),
          ...(input.contactPhone !== undefined && { contactPhone: input.contactPhone }),
          ...(input.contactEmail !== undefined && { contactEmail: input.contactEmail || null }),
          ...(input.reason !== undefined && { reason: input.reason }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.outcomeNotes !== undefined && { outcomeNotes: input.outcomeNotes }),
        })
        .where(
          and(
            eq(caseReferral.id, referralId),
            eq(caseReferral.caseFileId, caseId),
            eq(caseReferral.tenantId, tenantId)
          )
        )
        .returning();

      if (!updated) throw new NotFoundException('Référence introuvable');
      return updated;
    });
  }

  async breakGlass(tenantId: string, userId: string, caseId: string, input: BreakGlassInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [c] = await tx.select().from(caseFile).where(eq(caseFile.id, caseId));
      if (!c) throw new NotFoundException('Dossier introuvable');

      const [log] = await tx
        .insert(breakGlassLog)
        .values({
          tenantId,
          caseFileId: caseId,
          userId,
          reason: input.reason,
        })
        .returning();

      return {
        success: true,
        message: 'Accès exceptionnel accordé. L’événement a été consigné au journal d’audit.',
        log,
      };
    });
  }
}
