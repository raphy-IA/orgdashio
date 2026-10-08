import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  withTenantContext,
  funderOrganization,
  grantRecord,
  grantInstallment,
  grantDeliverable,
  project,
  userAccount,
  CreateFunderInput,
  UpdateFunderInput,
  CreateGrantInput,
  UpdateGrantInput,
  CreateGrantInstallmentInput,
  UpdateGrantInstallmentInput,
  CreateGrantDeliverableInput,
  UpdateGrantDeliverableInput,
} from '@orgdashio/shared';
import { eq, desc, and } from 'drizzle-orm';
import {
  calculateGrantWinRate,
  calculateInstallmentProgress,
  evaluateDeliverableUrgency,
} from './grants.utils';

@Injectable()
export class GrantsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  // --- Funder Organizations CRUD (Bailleurs de fonds) ---
  async findAllFunders(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const fundersList = await tx
        .select()
        .from(funderOrganization)
        .where(eq(funderOrganization.tenantId, tenantId))
        .orderBy(desc(funderOrganization.createdAt));

      const allGrants = await tx
        .select()
        .from(grantRecord)
        .where(eq(grantRecord.tenantId, tenantId));

      return fundersList.map((funder: any) => {
        const funderGrants = allGrants.filter(
          (g: any) =>
            g.funderId === funder.id ||
            g.funderName.trim().toLowerCase() === funder.name.trim().toLowerCase()
        );
        const activeGrants = funderGrants.filter(
          (g: any) => g.status === 'approved' || g.status === 'submitted'
        );
        const totalAwarded = funderGrants
          .filter((g: any) => g.status === 'approved')
          .reduce((sum: number, g: any) => sum + (parseFloat(g.awardedAmount as any) || 0), 0);
        const totalRequested = funderGrants.reduce(
          (sum: number, g: any) => sum + (parseFloat(g.requestedAmount as any) || 0),
          0
        );

        return {
          ...funder,
          stats: {
            totalGrantsCount: funderGrants.length,
            activeGrantsCount: activeGrants.length,
            totalAwardedAmount: totalAwarded,
            totalRequestedAmount: totalRequested,
          },
          grants: funderGrants.map((g: any) => ({
            id: g.id,
            code: g.code,
            title: g.title,
            status: g.status,
            awardedAmount: g.awardedAmount,
            requestedAmount: g.requestedAmount,
            startDate: g.startDate,
            endDate: g.endDate,
          })),
        };
      });
    });
  }

  async findOneFunder(tenantId: string, id: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [funder] = await tx
        .select()
        .from(funderOrganization)
        .where(and(eq(funderOrganization.tenantId, tenantId), eq(funderOrganization.id, id)));

      if (!funder) {
        throw new NotFoundException('Bailleur de fonds non trouvé');
      }

      const funderGrants = await tx
        .select()
        .from(grantRecord)
        .where(and(eq(grantRecord.tenantId, tenantId), eq(grantRecord.funderId, id)));

      return {
        ...funder,
        grants: funderGrants,
      };
    });
  }

  async createFunder(tenantId: string, input: CreateFunderInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(funderOrganization)
        .where(and(eq(funderOrganization.tenantId, tenantId), eq(funderOrganization.code, input.code)));

      if (existing) {
        throw new BadRequestException(`Un bailleur avec le code "${input.code}" existe déjà.`);
      }

      const [newFunder] = await tx
        .insert(funderOrganization)
        .values({
          tenantId,
          code: input.code.trim().toUpperCase(),
          name: input.name.trim(),
          type: input.type,
          contactPerson: input.contactPerson?.trim() || null,
          contactEmail: input.contactEmail?.trim() || null,
          contactPhone: input.contactPhone?.trim() || null,
          website: input.website?.trim() || null,
          address: input.address?.trim() || null,
          city: input.city?.trim() || null,
          stateProvince: input.stateProvince || 'QC',
          postalCode: input.postalCode?.trim() || null,
          country: input.country || 'Canada',
          notes: input.notes?.trim() || null,
        })
        .returning();

      return newFunder;
    });
  }

  async updateFunder(tenantId: string, id: string, input: UpdateFunderInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [updated] = await tx
        .update(funderOrganization)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(and(eq(funderOrganization.tenantId, tenantId), eq(funderOrganization.id, id)))
        .returning();

      if (!updated) {
        throw new NotFoundException('Bailleur de fonds non trouvé');
      }
      return updated;
    });
  }

  async deleteFunder(tenantId: string, id: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      await tx
        .delete(funderOrganization)
        .where(and(eq(funderOrganization.tenantId, tenantId), eq(funderOrganization.id, id)));
      return { success: true };
    });
  }

  // --- Grant Records CRUD ---
  async createGrant(tenantId: string, input: CreateGrantInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      let resolvedFunderId = input.funderId || null;
      let resolvedFunderName = input.funderName;
      let resolvedFunderType = input.funderType;

      if (resolvedFunderId) {
        const [funder] = await tx
          .select()
          .from(funderOrganization)
          .where(and(eq(funderOrganization.tenantId, tenantId), eq(funderOrganization.id, resolvedFunderId)));
        if (funder) {
          resolvedFunderName = funder.name;
          resolvedFunderType = funder.type as any;
        }
      }

      const [newGrant] = await tx
        .insert(grantRecord)
        .values({
          tenantId,
          funderId: resolvedFunderId,
          code: input.code,
          title: input.title,
          funderName: resolvedFunderName,
          funderType: resolvedFunderType,
          programName: input.programName,
          projectId: input.projectId,
          status: input.status,
          requestedAmount: String(input.requestedAmount),
          awardedAmount: input.awardedAmount !== undefined ? String(input.awardedAmount) : '0',
          currency: input.currency || 'CAD',
          submissionDeadline: input.submissionDeadline,
          submittedAt: input.submittedAt,
          startDate: input.startDate,
          endDate: input.endDate,
          managerUserId: input.managerUserId,
          notes: input.notes,
          contractUrl: input.contractUrl,
        })
        .returning();

      return newGrant;
    });
  }

  async findAllGrants(
    tenantId: string,
    filters?: { status?: string; projectId?: string; funderType?: string }
  ) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const list = await tx.select().from(grantRecord).orderBy(desc(grantRecord.createdAt));
      const projects = await tx.select().from(project);
      const projectMap = new Map<string, any>(projects.map((p: any) => [p.id, p]));

      const users = await this.db.select().from(userAccount);
      const userMap = new Map<string, any>(users.map((u: any) => [u.id, u]));

      const allInstallments = await tx.select().from(grantInstallment);
      const allDeliverables = await tx.select().from(grantDeliverable);

      let filtered = list;
      if (filters?.status) filtered = filtered.filter((g: any) => g.status === filters.status);
      if (filters?.projectId) filtered = filtered.filter((g: any) => g.projectId === filters.projectId);
      if (filters?.funderType) filtered = filtered.filter((g: any) => g.funderType === filters.funderType);

      return filtered.map((grant: any) => {
        const proj = grant.projectId ? projectMap.get(grant.projectId) : null;
        const manager = grant.managerUserId ? userMap.get(grant.managerUserId) : null;
        const installments = allInstallments.filter((i: any) => i.grantId === grant.id);
        const deliverables = allDeliverables.filter((d: any) => d.grantId === grant.id);

        const installmentProgress = calculateInstallmentProgress(installments);
        const pendingDeliverables = deliverables.filter(
          (d: any) => d.status !== 'approved' && d.status !== 'submitted'
        ).length;

        return {
          ...grant,
          project: proj ? { id: proj.id, name: proj.name, code: proj.code } : null,
          manager: manager
            ? { id: manager.id, firstName: manager.firstName, lastName: manager.lastName, email: manager.email }
            : null,
          installmentProgress,
          totalInstallments: installments.length,
          totalDeliverables: deliverables.length,
          pendingDeliverables,
        };
      });
    });
  }

  async findOneGrant(tenantId: string, grantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [grant] = await tx.select().from(grantRecord).where(eq(grantRecord.id, grantId));
      if (!grant) throw new NotFoundException('Subvention introuvable');

      const installments = await tx
        .select()
        .from(grantInstallment)
        .where(eq(grantInstallment.grantId, grantId))
        .orderBy(grantInstallment.installmentNumber);

      const deliverables = await tx
        .select()
        .from(grantDeliverable)
        .where(eq(grantDeliverable.grantId, grantId))
        .orderBy(grantDeliverable.dueDate);

      let proj = null;
      if (grant.projectId) {
        const [p] = await tx.select().from(project).where(eq(project.id, grant.projectId));
        proj = p || null;
      }

      let manager = null;
      if (grant.managerUserId) {
        const [u] = await this.db.select().from(userAccount).where(eq(userAccount.id, grant.managerUserId));
        manager = u || null;
      }

      const installmentProgress = calculateInstallmentProgress(installments);
      const enrichedDeliverables = deliverables.map((d: any) => ({
        ...d,
        urgency: evaluateDeliverableUrgency(d.dueDate, d.status),
      }));

      return {
        ...grant,
        project: proj,
        manager,
        installments,
        deliverables: enrichedDeliverables,
        installmentProgress,
      };
    });
  }

  async updateGrant(tenantId: string, grantId: string, input: UpdateGrantInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx.select().from(grantRecord).where(eq(grantRecord.id, grantId));
      if (!existing) throw new NotFoundException('Subvention introuvable');

      const updateData: any = { updatedAt: new Date() };
      if (input.title !== undefined) updateData.title = input.title;
      if (input.funderName !== undefined) updateData.funderName = input.funderName;
      if (input.funderType !== undefined) updateData.funderType = input.funderType;
      if (input.programName !== undefined) updateData.programName = input.programName;
      if (input.projectId !== undefined) updateData.projectId = input.projectId;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.requestedAmount !== undefined) updateData.requestedAmount = String(input.requestedAmount);
      if (input.awardedAmount !== undefined) updateData.awardedAmount = String(input.awardedAmount);
      if (input.currency !== undefined) updateData.currency = input.currency;
      if (input.submissionDeadline !== undefined) updateData.submissionDeadline = input.submissionDeadline;
      if (input.submittedAt !== undefined) updateData.submittedAt = input.submittedAt;
      if (input.startDate !== undefined) updateData.startDate = input.startDate;
      if (input.endDate !== undefined) updateData.endDate = input.endDate;
      if (input.managerUserId !== undefined) updateData.managerUserId = input.managerUserId;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.contractUrl !== undefined) updateData.contractUrl = input.contractUrl;

      const [updated] = await tx
        .update(grantRecord)
        .set(updateData)
        .where(eq(grantRecord.id, grantId))
        .returning();

      return updated;
    });
  }

  async deleteGrant(tenantId: string, grantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx.select().from(grantRecord).where(eq(grantRecord.id, grantId));
      if (!existing) throw new NotFoundException('Subvention introuvable');

      await tx.delete(grantRecord).where(eq(grantRecord.id, grantId));
      return { success: true, message: 'Dossier de subvention supprimé' };
    });
  }

  // ---------------------------------------------------------------------------
  // Installments CRUD
  // ---------------------------------------------------------------------------
  async addInstallment(tenantId: string, grantId: string, input: CreateGrantInstallmentInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [grant] = await tx.select().from(grantRecord).where(eq(grantRecord.id, grantId));
      if (!grant) throw new NotFoundException('Subvention introuvable');

      const [inst] = await tx
        .insert(grantInstallment)
        .values({
          tenantId,
          grantId,
          installmentNumber: input.installmentNumber,
          expectedDate: input.expectedDate,
          amount: String(input.amount),
          status: input.status,
          receivedAt: input.receivedAt,
          receivedAmount: input.receivedAmount !== undefined ? String(input.receivedAmount) : undefined,
          conditions: input.conditions,
        })
        .returning();

      return inst;
    });
  }

  async updateInstallment(tenantId: string, installmentId: string, input: UpdateGrantInstallmentInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(grantInstallment)
        .where(eq(grantInstallment.id, installmentId));
      if (!existing) throw new NotFoundException('Tranche de versement introuvable');

      const updateData: any = {};
      if (input.installmentNumber !== undefined) updateData.installmentNumber = input.installmentNumber;
      if (input.expectedDate !== undefined) updateData.expectedDate = input.expectedDate;
      if (input.amount !== undefined) updateData.amount = String(input.amount);
      if (input.status !== undefined) updateData.status = input.status;
      if (input.receivedAt !== undefined) updateData.receivedAt = input.receivedAt;
      if (input.receivedAmount !== undefined)
        updateData.receivedAmount = input.receivedAmount !== null ? String(input.receivedAmount) : null;
      if (input.conditions !== undefined) updateData.conditions = input.conditions;

      const [updated] = await tx
        .update(grantInstallment)
        .set(updateData)
        .where(eq(grantInstallment.id, installmentId))
        .returning();

      return updated;
    });
  }

  async deleteInstallment(tenantId: string, installmentId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(grantInstallment)
        .where(eq(grantInstallment.id, installmentId));
      if (!existing) throw new NotFoundException('Tranche introuvable');

      await tx.delete(grantInstallment).where(eq(grantInstallment.id, installmentId));
      return { success: true };
    });
  }

  // ---------------------------------------------------------------------------
  // Deliverables CRUD
  // ---------------------------------------------------------------------------
  async addDeliverable(tenantId: string, grantId: string, input: CreateGrantDeliverableInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [grant] = await tx.select().from(grantRecord).where(eq(grantRecord.id, grantId));
      if (!grant) throw new NotFoundException('Subvention introuvable');

      const [deliv] = await tx
        .insert(grantDeliverable)
        .values({
          tenantId,
          grantId,
          title: input.title,
          deliverableType: input.deliverableType,
          dueDate: input.dueDate,
          status: input.status,
          submittedAt: input.submittedAt,
          notes: input.notes,
          fileUrl: input.fileUrl,
        })
        .returning();

      return deliv;
    });
  }

  async updateDeliverable(tenantId: string, deliverableId: string, input: UpdateGrantDeliverableInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(grantDeliverable)
        .where(eq(grantDeliverable.id, deliverableId));
      if (!existing) throw new NotFoundException('Livrable introuvable');

      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.deliverableType !== undefined) updateData.deliverableType = input.deliverableType;
      if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.submittedAt !== undefined) updateData.submittedAt = input.submittedAt;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.fileUrl !== undefined) updateData.fileUrl = input.fileUrl;

      const [updated] = await tx
        .update(grantDeliverable)
        .set(updateData)
        .where(eq(grantDeliverable.id, deliverableId))
        .returning();

      return updated;
    });
  }

  async deleteDeliverable(tenantId: string, deliverableId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(grantDeliverable)
        .where(eq(grantDeliverable.id, deliverableId));
      if (!existing) throw new NotFoundException('Livrable introuvable');

      await tx.delete(grantDeliverable).where(eq(grantDeliverable.id, deliverableId));
      return { success: true };
    });
  }

  // ---------------------------------------------------------------------------
  // Grants Dashboard & KPI Analytics
  // ---------------------------------------------------------------------------
  async getGrantsDashboard(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const grants = await tx.select().from(grantRecord);
      const installments = await tx.select().from(grantInstallment);
      const deliverables = await tx.select().from(grantDeliverable);

      let totalRequested = 0;
      let totalAwarded = 0;
      const statusCounts: Record<string, number> = {
        prospect: 0,
        drafting: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        closed: 0,
      };

      grants.forEach((g: any) => {
        totalRequested += Number(g.requestedAmount) || 0;
        totalAwarded += Number(g.awardedAmount) || 0;
        if (statusCounts[g.status] !== undefined) {
          statusCounts[g.status]++;
        }
      });

      const winRate = calculateGrantWinRate(grants);
      const installmentProgress = calculateInstallmentProgress(installments);

      // Urgent Deliverables (< 30 days or overdue)
      const urgentDeliverables = deliverables
        .map((d: any) => {
          const g = grants.find((gr: any) => gr.id === d.grantId);
          return {
            ...d,
            grantTitle: g ? g.title : 'Subvention',
            grantCode: g ? g.code : '',
            funderName: g ? g.funderName : '',
            urgency: evaluateDeliverableUrgency(d.dueDate, d.status),
          };
        })
        .filter((d: any) => d.urgency === 'overdue' || d.urgency === 'due_soon');

      return {
        totalGrants: grants.length,
        totalRequested: Math.round(totalRequested * 100) / 100,
        totalAwarded: Math.round(totalAwarded * 100) / 100,
        totalReceived: installmentProgress.totalReceived,
        totalExpected: installmentProgress.totalExpected,
        collectionRatePct: installmentProgress.collectionRatePct,
        winRate,
        statusCounts,
        urgentDeliverables,
        recentGrants: grants.slice(0, 5),
      };
    });
  }
}
