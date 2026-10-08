import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  withTenantContext,
  membership,
  userHrProfile,
  timesheet,
  timesheetEntry,
  userAccount,
  project,
  grantRecord,
  CreateUserHrProfileInput,
  UpdateUserHrProfileInput,
  CreateTimesheetInput,
  UpdateTimesheetStatusInput,
  CreateTimesheetEntryInput,
  UpdateTimesheetEntryInput,
  BatchUpsertTimesheetEntriesInput,
} from '@orgdashio/shared';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import {
  getMondayOfWeek,
  getSundayOfWeek,
  calculateTimesheetTotals,
  validateWeeklyHours,
  calculateTimesheetKPIs,
} from './timesheets.utils';

@Injectable()
export class TimesheetsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  // ---------------------------------------------------------------------------
  // HR PROFILES & HOURLY RATES
  // ---------------------------------------------------------------------------
  async findAllHrProfiles(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const members = await tx
        .select({
          membership: membership,
          user: {
            id: userAccount.id,
            email: userAccount.email,
            firstName: userAccount.firstName,
            lastName: userAccount.lastName,
            jobTitle: userAccount.jobTitle,
          },
          profile: userHrProfile,
        })
        .from(membership)
        .innerJoin(userAccount, eq(membership.userId, userAccount.id))
        .leftJoin(
          userHrProfile,
          and(eq(userHrProfile.userId, userAccount.id), eq(userHrProfile.tenantId, tenantId))
        )
        .where(eq(membership.tenantId, tenantId))
        .orderBy(userAccount.lastName, userAccount.firstName);

      return members.map((m: any) => {
        const p = m.profile || {};
        return {
          id: p.id || `virtual-${m.user.id}`,
          userId: m.user.id,
          employeeNumber: p.employeeNumber || null,
          jobTitle: p.jobTitle || m.user.jobTitle || 'Collaborateur',
          department: p.department || 'Général',
          contractType: p.contractType || 'full_time',
          standardWeeklyHours: p.standardWeeklyHours ? Number(p.standardWeeklyHours) : 35,
          defaultHourlyRate: p.defaultHourlyRate ? Number(p.defaultHourlyRate) : 30,
          volunteerImputedRate: p.volunteerImputedRate ? Number(p.volunteerImputedRate) : 25,
          active: p.active !== undefined ? p.active : true,
          user: m.user,
          displayName:
            `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim() || m.user?.email || 'Collaborateur',
        };
      });
    });
  }

  async getUserHrProfile(tenantId: string, userId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(userHrProfile)
        .where(and(eq(userHrProfile.tenantId, tenantId), eq(userHrProfile.userId, userId)));

      if (existing) {
        return {
          ...existing,
          standardWeeklyHours: Number(existing.standardWeeklyHours),
          defaultHourlyRate: Number(existing.defaultHourlyRate),
          volunteerImputedRate: Number(existing.volunteerImputedRate),
        };
      }

      // Auto-create default profile if missing
      const [user] = await tx
        .select()
        .from(userAccount)
        .where(eq(userAccount.id, userId));

      const [created] = await tx
        .insert(userHrProfile)
        .values({
          tenantId,
          userId,
          jobTitle: user?.jobTitle || 'Collaborateur',
          department: 'Opérations',
          contractType: 'full_time',
          standardWeeklyHours: '35.00',
          defaultHourlyRate: '30.00',
          volunteerImputedRate: '25.00',
          active: true,
        })
        .returning();

      return {
        ...created,
        standardWeeklyHours: Number(created.standardWeeklyHours),
        defaultHourlyRate: Number(created.defaultHourlyRate),
        volunteerImputedRate: Number(created.volunteerImputedRate),
      };
    });
  }

  async updateUserHrProfile(tenantId: string, userId: string, input: UpdateUserHrProfileInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      // Ensure exists
      await this.getUserHrProfile(tenantId, userId);

      const [updated] = await tx
        .update(userHrProfile)
        .set({
          ...(input.employeeNumber !== undefined ? { employeeNumber: input.employeeNumber } : {}),
          ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle } : {}),
          ...(input.department !== undefined ? { department: input.department } : {}),
          ...(input.contractType ? { contractType: input.contractType } : {}),
          ...(input.standardWeeklyHours !== undefined ? { standardWeeklyHours: input.standardWeeklyHours.toString() } : {}),
          ...(input.defaultHourlyRate !== undefined ? { defaultHourlyRate: input.defaultHourlyRate.toString() } : {}),
          ...(input.volunteerImputedRate !== undefined ? { volunteerImputedRate: input.volunteerImputedRate.toString() } : {}),
          ...(input.active !== undefined ? { active: input.active } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(userHrProfile.tenantId, tenantId), eq(userHrProfile.userId, userId)))
        .returning();

      return {
        ...updated,
        standardWeeklyHours: Number(updated.standardWeeklyHours),
        defaultHourlyRate: Number(updated.defaultHourlyRate),
        volunteerImputedRate: Number(updated.volunteerImputedRate),
      };
    });
  }

  // ---------------------------------------------------------------------------
  // TIMESHEETS & WEEKLY PERIODS
  // ---------------------------------------------------------------------------
  async getOrCreateWeekTimesheet(tenantId: string, userId: string, targetDateStr?: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const refDate = targetDateStr ? new Date(targetDateStr) : new Date();
      const mondayStr = getMondayOfWeek(refDate);
      const sundayStr = getSundayOfWeek(mondayStr);

      let [ts] = await tx
        .select()
        .from(timesheet)
        .where(
          and(
            eq(timesheet.tenantId, tenantId),
            eq(timesheet.userId, userId),
            eq(timesheet.periodStartDate, mondayStr)
          )
        );

      if (!ts) {
        const [created] = await tx
          .insert(timesheet)
          .values({
            tenantId,
            userId,
            periodStartDate: mondayStr,
            periodEndDate: sundayStr,
            status: 'draft',
            totalHours: '0.00',
            totalCost: '0.00',
          })
          .returning();
        ts = created;
      }

      // Fetch entries with project and grant names
      const entries = await tx
        .select({
          entry: timesheetEntry,
          projectName: project.name,
          projectCode: project.code,
          grantTitle: grantRecord.title,
          grantCode: grantRecord.code,
        })
        .from(timesheetEntry)
        .leftJoin(project, eq(timesheetEntry.projectId, project.id))
        .leftJoin(grantRecord, eq(timesheetEntry.grantId, grantRecord.id))
        .where(and(eq(timesheetEntry.tenantId, tenantId), eq(timesheetEntry.timesheetId, ts.id)))
        .orderBy(timesheetEntry.entryDate);

      const profile = await this.getUserHrProfile(tenantId, userId);

      return {
        ...ts,
        totalHours: Number(ts.totalHours),
        totalCost: Number(ts.totalCost),
        userProfile: profile,
        entries: entries.map((e: any) => ({
          ...e.entry,
          hours: Number(e.entry.hours),
          hourlyRate: Number(e.entry.hourlyRate),
          calculatedCost: Number(e.entry.calculatedCost),
          projectName: e.projectName,
          projectCode: e.projectCode,
          grantTitle: e.grantTitle,
          grantCode: e.grantCode,
        })),
      };
    });
  }

  async findAllTimesheets(
    tenantId: string,
    filters?: { userId?: string; status?: string; startDate?: string; endDate?: string }
  ) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const conditions = [eq(timesheet.tenantId, tenantId)];

      if (filters?.userId) conditions.push(eq(timesheet.userId, filters.userId));
      if (filters?.status) conditions.push(eq(timesheet.status, filters.status as any));
      if (filters?.startDate) conditions.push(gte(timesheet.periodStartDate, filters.startDate));
      if (filters?.endDate) conditions.push(lte(timesheet.periodEndDate, filters.endDate));

      const list = await tx
        .select({
          timesheet: timesheet,
          user: {
            id: userAccount.id,
            email: userAccount.email,
            firstName: userAccount.firstName,
            lastName: userAccount.lastName,
          },
          reviewer: {
            id: userAccount.id,
            firstName: userAccount.firstName,
            lastName: userAccount.lastName,
          },
        })
        .from(timesheet)
        .leftJoin(userAccount, eq(timesheet.userId, userAccount.id))
        .where(and(...conditions))
        .orderBy(desc(timesheet.periodStartDate));

      return list.map((item: any) => ({
        ...item.timesheet,
        totalHours: Number(item.timesheet.totalHours),
        totalCost: Number(item.timesheet.totalCost),
        userName: `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim() || item.user?.email || 'Collaborateur',
        userEmail: item.user?.email,
      }));
    });
  }

  async findTimesheetById(tenantId: string, timesheetId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [ts] = await tx
        .select({
          timesheet: timesheet,
          user: {
            id: userAccount.id,
            email: userAccount.email,
            firstName: userAccount.firstName,
            lastName: userAccount.lastName,
          },
        })
        .from(timesheet)
        .leftJoin(userAccount, eq(timesheet.userId, userAccount.id))
        .where(and(eq(timesheet.tenantId, tenantId), eq(timesheet.id, timesheetId)));

      if (!ts) throw new NotFoundException('Feuille de temps introuvable.');

      const entries = await tx
        .select({
          entry: timesheetEntry,
          projectName: project.name,
          projectCode: project.code,
          grantTitle: grantRecord.title,
          grantCode: grantRecord.code,
        })
        .from(timesheetEntry)
        .leftJoin(project, eq(timesheetEntry.projectId, project.id))
        .leftJoin(grantRecord, eq(timesheetEntry.grantId, grantRecord.id))
        .where(and(eq(timesheetEntry.tenantId, tenantId), eq(timesheetEntry.timesheetId, timesheetId)))
        .orderBy(timesheetEntry.entryDate);

      const profile = await this.getUserHrProfile(tenantId, ts.timesheet.userId);

      return {
        ...ts.timesheet,
        totalHours: Number(ts.timesheet.totalHours),
        totalCost: Number(ts.timesheet.totalCost),
        userName: `${ts.user?.firstName || ''} ${ts.user?.lastName || ''}`.trim() || ts.user?.email || 'Collaborateur',
        userProfile: profile,
        entries: entries.map((e: any) => ({
          ...e.entry,
          hours: Number(e.entry.hours),
          hourlyRate: Number(e.entry.hourlyRate),
          calculatedCost: Number(e.entry.calculatedCost),
          projectName: e.projectName,
          projectCode: e.projectCode,
          grantTitle: e.grantTitle,
          grantCode: e.grantCode,
        })),
      };
    });
  }

  async batchUpsertEntries(
    tenantId: string,
    timesheetId: string,
    userId: string,
    input: BatchUpsertTimesheetEntriesInput
  ) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [ts] = await tx
        .select()
        .from(timesheet)
        .where(and(eq(timesheet.tenantId, tenantId), eq(timesheet.id, timesheetId)));

      if (!ts) throw new NotFoundException('Feuille de temps introuvable.');
      if (ts.status === 'submitted' || ts.status === 'approved') {
        throw new BadRequestException('Impossible de modifier une feuille de temps déjà soumise ou approuvée.');
      }

      // Validate daily limit
      const validation = validateWeeklyHours(input.entries);
      if (!validation.valid) {
        throw new BadRequestException('Le total d\'heures travaillées ne peut pas dépasser 24 heures pour une même journée.');
      }

      // Get user profile for hourly rate fallback
      const hrProfile = await this.getUserHrProfile(tenantId, ts.userId);
      const defaultRate = hrProfile.defaultHourlyRate || 30;

      // Delete existing entries for this timesheet
      await tx
        .delete(timesheetEntry)
        .where(and(eq(timesheetEntry.tenantId, tenantId), eq(timesheetEntry.timesheetId, timesheetId)));

      // Insert new non-zero entries
      const validEntries = input.entries.filter((e) => Number(e.hours) > 0);

      for (const e of validEntries) {
        const rate = e.hourlyRate !== undefined && e.hourlyRate !== null ? Number(e.hourlyRate) : defaultRate;
        const hours = Number(e.hours);
        const cost = Math.round(hours * rate * 100) / 100;

        await tx.insert(timesheetEntry).values({
          tenantId,
          timesheetId,
          projectId: e.projectId || null,
          grantId: e.grantId || null,
          planItemId: e.planItemId || null,
          activityType: e.activityType || 'direct_program',
          entryDate: e.entryDate,
          hours: hours.toString(),
          hourlyRate: rate.toString(),
          calculatedCost: cost.toString(),
          description: e.description || null,
          isBillable: e.isBillable ?? true,
        });
      }

      // Recalculate and update timesheet totals
      const totals = calculateTimesheetTotals(
        validEntries.map((e) => ({
          hours: e.hours,
          hourlyRate: e.hourlyRate !== undefined ? e.hourlyRate : defaultRate,
        }))
      );

      const [updatedTs] = await tx
        .update(timesheet)
        .set({
          totalHours: totals.totalHours.toString(),
          totalCost: totals.totalCost.toString(),
          updatedAt: new Date(),
        })
        .where(and(eq(timesheet.tenantId, tenantId), eq(timesheet.id, timesheetId)))
        .returning();

      return {
        ...updatedTs,
        totalHours: Number(updatedTs.totalHours),
        totalCost: Number(updatedTs.totalCost),
        entriesCount: validEntries.length,
      };
    });
  }

  async submitTimesheet(tenantId: string, timesheetId: string, userId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [ts] = await tx
        .select()
        .from(timesheet)
        .where(and(eq(timesheet.tenantId, tenantId), eq(timesheet.id, timesheetId)));

      if (!ts) throw new NotFoundException('Feuille de temps introuvable.');
      if (ts.status === 'approved') {
        throw new BadRequestException('Cette feuille de temps est déjà approuvée.');
      }
      if (Number(ts.totalHours) <= 0) {
        throw new BadRequestException('Impossible de soumettre une feuille de temps vide (0 heure enregistrée).');
      }

      const [updated] = await tx
        .update(timesheet)
        .set({
          status: 'submitted',
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(timesheet.tenantId, tenantId), eq(timesheet.id, timesheetId)))
        .returning();

      return updated;
    });
  }

  async reviewTimesheet(
    tenantId: string,
    timesheetId: string,
    reviewerUserId: string,
    input: UpdateTimesheetStatusInput
  ) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [ts] = await tx
        .select()
        .from(timesheet)
        .where(and(eq(timesheet.tenantId, tenantId), eq(timesheet.id, timesheetId)));

      if (!ts) throw new NotFoundException('Feuille de temps introuvable.');

      const [updated] = await tx
        .update(timesheet)
        .set({
          status: input.status,
          reviewedByUserId: reviewerUserId,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes || null,
          updatedAt: new Date(),
        })
        .where(and(eq(timesheet.tenantId, tenantId), eq(timesheet.id, timesheetId)))
        .returning();

      return updated;
    });
  }

  // ---------------------------------------------------------------------------
  // ANALYTIC ALLOCATIONS (BY PROJECT & BY GRANT)
  // ---------------------------------------------------------------------------
  async getAnalyticAllocationByProject(tenantId: string, projectId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const entries = await tx
        .select({
          entry: timesheetEntry,
          user: {
            id: userAccount.id,
            firstName: userAccount.firstName,
            lastName: userAccount.lastName,
            email: userAccount.email,
          },
          timesheetStatus: timesheet.status,
        })
        .from(timesheetEntry)
        .innerJoin(timesheet, eq(timesheetEntry.timesheetId, timesheet.id))
        .leftJoin(userAccount, eq(timesheet.userId, userAccount.id))
        .where(and(eq(timesheetEntry.tenantId, tenantId), eq(timesheetEntry.projectId, projectId)))
        .orderBy(desc(timesheetEntry.entryDate));

      const totalHours = entries.reduce((sum: number, e: any) => sum + Number(e.entry.hours), 0);
      const totalCost = entries.reduce((sum: number, e: any) => sum + Number(e.entry.calculatedCost), 0);

      const byActivity = entries.reduce((acc: Record<string, { hours: number; cost: number }>, e: any) => {
        const act = e.entry.activityType;
        if (!acc[act]) acc[act] = { hours: 0, cost: 0 };
        acc[act].hours += Number(e.entry.hours);
        acc[act].cost += Number(e.entry.calculatedCost);
        return acc;
      }, {});

      return {
        projectId,
        totalHours: Math.round(totalHours * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        activityBreakdown: byActivity,
        entriesCount: entries.length,
      };
    });
  }

  async getAnalyticAllocationByGrant(tenantId: string, grantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const entries = await tx
        .select({
          entry: timesheetEntry,
          user: {
            id: userAccount.id,
            firstName: userAccount.firstName,
            lastName: userAccount.lastName,
          },
        })
        .from(timesheetEntry)
        .innerJoin(timesheet, eq(timesheetEntry.timesheetId, timesheet.id))
        .leftJoin(userAccount, eq(timesheet.userId, userAccount.id))
        .where(and(eq(timesheetEntry.tenantId, tenantId), eq(timesheetEntry.grantId, grantId)))
        .orderBy(desc(timesheetEntry.entryDate));

      const totalHours = entries.reduce((sum: number, e: any) => sum + Number(e.entry.hours), 0);
      const totalCost = entries.reduce((sum: number, e: any) => sum + Number(e.entry.calculatedCost), 0);

      return {
        grantId,
        totalHours: Math.round(totalHours * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        entriesCount: entries.length,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD KPI METRICS
  // ---------------------------------------------------------------------------
  async getDashboardMetrics(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const timesheets = await tx
        .select({
          status: timesheet.status,
          totalHours: timesheet.totalHours,
          totalCost: timesheet.totalCost,
        })
        .from(timesheet)
        .where(eq(timesheet.tenantId, tenantId));

      const entries = await tx
        .select({
          activityType: timesheetEntry.activityType,
          hours: timesheetEntry.hours,
          calculatedCost: timesheetEntry.calculatedCost,
          projectId: timesheetEntry.projectId,
        })
        .from(timesheetEntry)
        .where(eq(timesheetEntry.tenantId, tenantId));

      const kpis = calculateTimesheetKPIs(timesheets);

      const activityBreakdown = entries.reduce((acc: Record<string, number>, e: any) => {
        acc[e.activityType] = (acc[e.activityType] || 0) + Number(e.hours);
        return acc;
      }, {});

      return {
        ...kpis,
        totalTimesheets: timesheets.length,
        activityBreakdown,
      };
    });
  }
}
