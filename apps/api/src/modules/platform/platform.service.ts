import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  tenantRegistry,
  userAccount,
  membership,
  role,
  membershipRole,
  party,
  staffProfile,
  orgUnit,
  project,
  caseFile,
  trainingSession,
  trainingProgram,
  document,
  supportAccessGrant,
  auditLog,
  consentRecord,
  fundingSource,
  planItem,
} from '@orgdashio/shared';
import { eq, and, sql, desc } from 'drizzle-orm';

@Injectable()
export class PlatformService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  /**
   * Retourne la liste de tous les tenants (organismes clients) avec leurs métriques agrégées.
   */
  async getAllTenantsWithMetrics() {
    const tenants = await this.db.select().from(tenantRegistry).orderBy(desc(tenantRegistry.createdAt));
    const allMemberships = await this.db.select().from(membership);
    const allStaff = await this.db.select().from(staffProfile);
    const allProjects = await this.db.select().from(project);
    const allCases = await this.db.select().from(caseFile);
    const allTrainings = await this.db.select().from(trainingSession);
    const allDocs = await this.db.select().from(document);

    return tenants.map((t) => {
      const tenantMemberships = allMemberships.filter((m) => m.tenantId === t.id);
      const tenantStaff = allStaff.filter((s) => s.tenantId === t.id);
      const tenantProjects = allProjects.filter((p) => p.tenantId === t.id);
      const tenantCases = allCases.filter((c) => c.tenantId === t.id);
      const tenantTrainings = allTrainings.filter((tr) => tr.tenantId === t.id);
      const tenantDocs = allDocs.filter((d) => d.tenantId === t.id);

      return {
        ...t,
        metrics: {
          totalUsers: tenantMemberships.length,
          activeUsers: tenantMemberships.filter((m) => m.status === 'active').length,
          totalStaff: tenantStaff.length,
          activeStaff: tenantStaff.filter((s) => s.status === 'active').length,
          totalEmployees: tenantStaff.filter((s) => s.employmentType === 'employee').length,
          totalVolunteers: tenantStaff.filter((s) => s.employmentType === 'volunteer').length,
          totalBoard: tenantStaff.filter((s) => s.employmentType === 'board_member').length,
          totalProjects: tenantProjects.length,
          totalCases: tenantCases.length,
          totalTrainings: tenantTrainings.length,
          totalDocuments: tenantDocs.length,
        },
      };
    });
  }

  /**
   * Retourne la fiche 360° détaillée d'un tenant spécifique pour inspection et administration super-admin.
   */
  async getTenantDetails(tenantId: string) {
    const [t] = await this.db.select().from(tenantRegistry).where(eq(tenantRegistry.id, tenantId));
    if (!t) throw new NotFoundException('Organisme client non trouvé');

    // 1. Comptes utilisateurs et adhésions dans ce tenant
    const memberships = await this.db.select().from(membership).where(eq(membership.tenantId, tenantId));
    const userIds = memberships.map((m) => m.userId);
    const users = await this.db.select().from(userAccount);
    const tenantRoles = await this.db.select().from(role).where(eq(role.tenantId, tenantId));
    const memRoles = await this.db.select().from(membershipRole).where(eq(membershipRole.tenantId, tenantId));

    const roleMap = new Map(tenantRoles.map((r) => [r.id, r]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    const usersWithRoles = memberships.map((m) => {
      const u = userMap.get(m.userId);
      const assignedMemRoles = memRoles.filter((mr) => mr.membershipId === m.id);
      const rolesList = assignedMemRoles.map((mr) => roleMap.get(mr.roleId)).filter(Boolean);

      return {
        membershipId: m.id,
        status: m.status,
        createdAt: m.createdAt,
        user: u
          ? {
              id: u.id,
              email: u.email,
              firstName: u.firstName,
              lastName: u.lastName,
              jobTitle: u.jobTitle,
              phone: u.phone,
              avatarUrl: u.avatarUrl,
              status: u.status,
              isPlatformAdmin: u.isPlatformAdmin,
              createdAt: u.createdAt,
            }
          : null,
        roles: rolesList,
      };
    });

    // 2. Personnel, Bénévoles et Départements enregistrés
    const staffList = await this.db.select().from(staffProfile).where(eq(staffProfile.tenantId, tenantId));
    const parties = await this.db.select().from(party).where(eq(party.tenantId, tenantId));
    const departments = await this.db.select().from(orgUnit).where(eq(orgUnit.tenantId, tenantId));

    const partyMap = new Map(parties.map((p) => [p.id, p]));
    const deptMap = new Map(departments.map((d) => [d.id, d]));

    const fullStaff = staffList.map((s) => {
      const p = partyMap.get(s.partyId);
      const d = s.departmentId ? deptMap.get(s.departmentId) : null;
      return {
        ...s,
        party: p || null,
        department: d || null,
      };
    });

    // 3. Projets, WBS et Financement
    const projectsList = await this.db.select().from(project).where(eq(project.tenantId, tenantId));
    const allPlanItems = await this.db.select().from(planItem).where(eq(planItem.tenantId, tenantId));
    const allFunding = await this.db.select().from(fundingSource).where(eq(fundingSource.tenantId, tenantId));

    const enrichedProjects = projectsList.map((p) => {
      const items = allPlanItems.filter((pi) => pi.projectId === p.id);
      const funding = allFunding.filter((f) => f.projectId === p.id);
      const totalBudget = funding.reduce((acc, f) => acc + Number(f.amount || 0), 0);
      const avgProgress = items.length > 0 ? Math.round(items.reduce((acc, i) => acc + (i.progressPct || 0), 0) / items.length) : 0;
      return {
        ...p,
        totalBudget,
        taskCount: items.length,
        avgProgressPct: avgProgress,
        completedTasks: items.filter((i) => i.status === 'completed').length,
        items: items.slice(0, 10),
      };
    });

    // 4. Dossiers usagers / Cas
    const casesList = await this.db.select().from(caseFile).where(eq(caseFile.tenantId, tenantId));
    const enrichedCases = casesList.map((c) => {
      const p = partyMap.get(c.partyId);
      const worker = userMap.get(c.primaryWorkerUserId);
      return {
        ...c,
        beneficiary: p ? { id: p.id, firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone } : null,
        primaryWorker: worker ? { id: worker.id, email: worker.email, firstName: worker.firstName, lastName: worker.lastName } : null,
      };
    });

    // 5. Formations, Documents, Consentements, Grants
    const trainingsList = await this.db.select().from(trainingSession).where(eq(trainingSession.tenantId, tenantId));
    const programsList = await this.db.select().from(trainingProgram).where(eq(trainingProgram.tenantId, tenantId));
    const progMap = new Map(programsList.map((pr) => [pr.id, pr]));
    const enrichedTrainings = trainingsList.map((tr) => ({
      ...tr,
      program: tr.trainingProgramId ? progMap.get(tr.trainingProgramId) : null,
    }));

    const docsList = await this.db.select().from(document).where(eq(document.tenantId, tenantId));
    const consentsList = await this.db.select().from(consentRecord).where(eq(consentRecord.tenantId, tenantId));
    const grants = await this.db.select().from(supportAccessGrant).where(eq(supportAccessGrant.tenantId, tenantId));

    return {
      tenant: t,
      users: usersWithRoles,
      staff: fullStaff,
      projects: enrichedProjects,
      cases: enrichedCases,
      trainings: enrichedTrainings,
      documents: docsList,
      departments,
      roles: tenantRoles,
      supportGrants: grants,
      metrics: {
        totalUsers: memberships.length,
        activeUsers: memberships.filter((m) => m.status === 'active').length,
        totalStaff: fullStaff.length,
        totalEmployees: fullStaff.filter((s) => s.employmentType === 'employee').length,
        totalVolunteers: fullStaff.filter((s) => s.employmentType === 'volunteer').length,
        totalBoard: fullStaff.filter((s) => s.employmentType === 'board_member').length,
        totalProjects: projectsList.length,
        totalCases: casesList.length,
        totalTrainings: trainingsList.length,
        totalConsents: consentsList.length,
        totalDocuments: docsList.length,
      },
    };
  }

  /**
   * Met à jour les paramètres de configuration et de profil d'un organisme client.
   */
  async updateTenant(tenantId: string, input: any) {
    const [existing] = await this.db.select().from(tenantRegistry).where(eq(tenantRegistry.id, tenantId));
    if (!existing) throw new NotFoundException('Organisme client non trouvé');

    const [updated] = await this.db
      .update(tenantRegistry)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.acronym !== undefined && { acronym: input.acronym || null }),
        ...(input.description !== undefined && { description: input.description || null }),
        ...(input.orgType !== undefined && { orgType: input.orgType || null }),
        ...(input.neqNumber !== undefined && { neqNumber: input.neqNumber || null }),
        ...(input.address !== undefined && { address: input.address || null }),
        ...(input.phone !== undefined && { phone: input.phone || null }),
        ...(input.email !== undefined && { email: input.email || null }),
        ...(input.website !== undefined && { website: input.website || null }),
        ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl || null }),
        ...(input.privacyOfficerName !== undefined && { privacyOfficerName: input.privacyOfficerName || null }),
        ...(input.privacyOfficerEmail !== undefined && { privacyOfficerEmail: input.privacyOfficerEmail || null }),
        ...(input.dataRetentionMonths !== undefined && { dataRetentionMonths: input.dataRetentionMonths }),
        ...(input.mode !== undefined && { mode: input.mode }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.onboardingCompleted !== undefined && { onboardingCompleted: input.onboardingCompleted }),
        updatedAt: new Date(),
      })
      .where(eq(tenantRegistry.id, tenantId))
      .returning();

    return updated;
  }

  /**
   * Active ou suspend un compte client (tenant) à l'échelle de la plateforme.
   */
  async setTenantStatus(tenantId: string, status: 'active' | 'suspended', adminUserId?: string) {
    const [existing] = await this.db.select().from(tenantRegistry).where(eq(tenantRegistry.id, tenantId));
    if (!existing) throw new NotFoundException('Organisme client non trouvé');

    const [updated] = await this.db
      .update(tenantRegistry)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(tenantRegistry.id, tenantId))
      .returning();

    // Consigner dans le journal d'audit
    if (adminUserId) {
      await this.db.insert(auditLog).values({
        tenantId,
        userId: adminUserId,
        action: status === 'active' ? 'TENANT_ACTIVATED' : 'TENANT_SUSPENDED',
        entityType: 'tenant',
        entityId: tenantId,
        payload: { previousStatus: existing.status, newStatus: status },
      });
    }

    return updated;
  }

  /**
   * Active, suspend ou réactive un compte utilisateur dans un tenant client.
   */
  async setUserStatusInTenant(tenantId: string, userId: string, status: 'active' | 'suspended') {
    // Update membership status in this tenant
    const [updatedMembership] = await this.db
      .update(membership)
      .set({ status })
      .where(and(eq(membership.tenantId, tenantId), eq(membership.userId, userId)))
      .returning();

    if (!updatedMembership) throw new NotFoundException('Adhésion utilisateur non trouvée dans ce tenant');

    // Optionally update user account status
    await this.db
      .update(userAccount)
      .set({ status: status === 'active' ? 'active' : 'suspended', updatedAt: new Date() })
      .where(eq(userAccount.id, userId));

    return { success: true, membership: updatedMembership };
  }

  /**
   * Modifie les informations ou le statut d'un collaborateur / bénévole dans un tenant client.
   */
  async updateStaffInTenant(
    tenantId: string,
    partyId: string,
    input: {
      status?: 'active' | 'on_leave' | 'inactive' | 'archived';
      jobTitle?: string;
      employmentType?: 'employee' | 'volunteer' | 'board_member' | 'contractor' | 'intern';
      departmentId?: string | null;
      notes?: string;
    }
  ) {
    const [existingStaff] = await this.db
      .select()
      .from(staffProfile)
      .where(and(eq(staffProfile.partyId, partyId), eq(staffProfile.tenantId, tenantId)));

    if (!existingStaff) throw new NotFoundException('Profil collaborateur/bénévole non trouvé dans ce tenant');

    const [updated] = await this.db
      .update(staffProfile)
      .set({
        ...(input.status !== undefined && { status: input.status }),
        ...(input.jobTitle !== undefined && { jobTitle: input.jobTitle }),
        ...(input.employmentType !== undefined && { employmentType: input.employmentType }),
        ...(input.departmentId !== undefined && { departmentId: input.departmentId || null }),
        ...(input.notes !== undefined && { notes: input.notes || null }),
        updatedAt: new Date(),
      })
      .where(and(eq(staffProfile.partyId, partyId), eq(staffProfile.tenantId, tenantId)))
      .returning();

    return updated;
  }

  /**
   * Octroie un accès support d'urgence (Break-Glass) avec journalisation Loi 25.
   */
  async grantSupportAccess(adminUserId: string, tenantId: string, reason: string, durationMinutes = 60) {
    const [tenant] = await this.db.select().from(tenantRegistry).where(eq(tenantRegistry.id, tenantId));
    if (!tenant) throw new NotFoundException('Organisme client non trouvé');

    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const [grant] = await this.db
      .insert(supportAccessGrant)
      .values({
        tenantId,
        adminId: adminUserId,
        reason,
        expiresAt,
      })
      .returning();

    await this.db.insert(auditLog).values({
      tenantId,
      userId: adminUserId,
      action: 'SUPPORT_ACCESS_GRANTED',
      entityType: 'tenant',
      entityId: tenantId,
      payload: { reason, durationMinutes, expiresAt },
    });

    return grant;
  }
}
