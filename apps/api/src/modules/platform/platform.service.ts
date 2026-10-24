import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  tenantRegistry,
  userAccount,
  userCredential,
  membership,
  role,
  membershipRole,
  party,
  staffProfile,
  beneficiaryProfile,
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
  subscriptionPlan,
  tenantSubscription,
  tenantInvoice,
  systemAnnouncement,
  securityIncident,
  tenantFeatureFlag,
  userSession,
} from '@orgdashio/shared';
import { hash } from '@node-rs/argon2';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';

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
    const allBen = await this.db.select().from(beneficiaryProfile);
    const allProjects = await this.db.select().from(project);
    const allCases = await this.db.select().from(caseFile);
    const allTrainings = await this.db.select().from(trainingSession);
    const allDocs = await this.db.select().from(document);

    return tenants.map((t) => {
      const tenantMemberships = allMemberships.filter((m) => m.tenantId === t.id);
      const tenantStaff = allStaff.filter((s) => s.tenantId === t.id);
      const tenantBen = allBen.filter((b) => b.tenantId === t.id);
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
          totalBeneficiaries: tenantBen.length,
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

    // 1. Personnel, Bénévoles, Bénéficiaires et Départements enregistrés
    const staffList = await this.db.select().from(staffProfile).where(eq(staffProfile.tenantId, tenantId));
    const benList = await this.db.select().from(beneficiaryProfile).where(eq(beneficiaryProfile.tenantId, tenantId));
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

    const fullBeneficiaries = benList.map((b) => {
      const p = partyMap.get(b.partyId);
      return {
        ...b,
        party: p || null,
      };
    });

    const staffByUserId = new Map(fullStaff.filter((s) => s.userId).map((s) => [s.userId, s]));

    // 2. Comptes utilisateurs et adhésions dans ce tenant
    const memberships = await this.db.select().from(membership).where(eq(membership.tenantId, tenantId));
    const users = await this.db.select().from(userAccount);
    const tenantRoles = await this.db.select().from(role).where(eq(role.tenantId, tenantId));
    const memRoles = await this.db.select().from(membershipRole).where(eq(membershipRole.tenantId, tenantId));

    const roleMap = new Map(tenantRoles.map((r) => [r.id, r]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    const usersWithRoles = memberships.map((m) => {
      const u = userMap.get(m.userId);
      const assignedMemRoles = memRoles.filter((mr) => mr.membershipId === m.id);
      const rolesList = assignedMemRoles.map((mr) => roleMap.get(mr.roleId)).filter(Boolean);
      const linkedStaff = u ? staffByUserId.get(u.id) || null : null;

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
        linkedStaff,
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
    const [sub] = await this.db.select().from(tenantSubscription).where(eq(tenantSubscription.tenantId, tenantId));

    return {
      tenant: t,
      subscription: sub || null,
      users: usersWithRoles,
      staff: fullStaff,
      beneficiaries: fullBeneficiaries,
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
        totalBeneficiaries: fullBeneficiaries.length,
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
   * Modifie les informations complètes d'un compte utilisateur, réinitialise son mot de passe ou change ses rôles.
   */
  async updateUserInTenant(
    tenantId: string,
    userId: string,
    input: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      jobTitle?: string;
      status?: 'active' | 'suspended';
      roleIds?: string[];
      roleNames?: string[];
      newPassword?: string;
      password?: string;
    }
  ) {
    const [user] = await this.db.select().from(userAccount).where(eq(userAccount.id, userId));
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const [mem] = await this.db
      .select()
      .from(membership)
      .where(and(eq(membership.tenantId, tenantId), eq(membership.userId, userId)));
    if (!mem) throw new NotFoundException('Adhésion au tenant non trouvée');

    // 1. Update userAccount fields
    const userUpdates: any = { updatedAt: new Date() };
    if (input.firstName !== undefined) userUpdates.firstName = input.firstName || null;
    if (input.lastName !== undefined) userUpdates.lastName = input.lastName || null;
    if (input.email !== undefined) userUpdates.email = input.email.toLowerCase().trim();
    if (input.phone !== undefined) userUpdates.phone = input.phone || null;
    if (input.jobTitle !== undefined) userUpdates.jobTitle = input.jobTitle || null;
    if (input.status !== undefined) {
      userUpdates.status = input.status;
      await this.db
        .update(membership)
        .set({ status: input.status })
        .where(eq(membership.id, mem.id));
    }

    const [updatedUser] = await this.db
      .update(userAccount)
      .set(userUpdates)
      .where(eq(userAccount.id, userId))
      .returning();

    // 2. Reset password if provided (support newPassword or password)
    const rawPassword = input.password || input.newPassword;
    if (rawPassword && rawPassword.trim().length >= 6) {
      const newSecretHash = await hash(rawPassword.trim());
      const [existingCred] = await this.db
        .select()
        .from(userCredential)
        .where(eq(userCredential.userId, userId));

      if (existingCred) {
        await this.db
          .update(userCredential)
          .set({ secretHash: newSecretHash, updatedAt: new Date() })
          .where(eq(userCredential.userId, userId));
      } else {
        await this.db.insert(userCredential).values({
          userId,
          type: 'password',
          secretHash: newSecretHash,
        });
      }
    }

    // 3. Update roles if provided (support roleIds or roleNames)
    let targetRoleIds: string[] = [];
    if (input.roleIds && Array.isArray(input.roleIds)) {
      targetRoleIds = input.roleIds;
    } else if (input.roleNames && Array.isArray(input.roleNames)) {
      const allTenantRoles = await this.db.select().from(role).where(eq(role.tenantId, tenantId));
      targetRoleIds = allTenantRoles
        .filter((r) => input.roleNames!.includes(r.name) || input.roleNames!.includes(r.code))
        .map((r) => r.id);
    }

    if (targetRoleIds.length > 0 || (input.roleNames && input.roleNames.length === 0)) {
      await this.db
        .delete(membershipRole)
        .where(and(eq(membershipRole.tenantId, tenantId), eq(membershipRole.membershipId, mem.id)));

      for (const roleId of targetRoleIds) {
        await this.db.insert(membershipRole).values({
          tenantId,
          membershipId: mem.id,
          roleId,
        });
      }
    }

    // 4. Synchronize linked staff profile / party if present
    const [linkedStaff] = await this.db
      .select()
      .from(staffProfile)
      .where(and(eq(staffProfile.tenantId, tenantId), eq(staffProfile.userId, userId)));

    if (linkedStaff) {
      await this.db
        .update(party)
        .set({
          ...(input.firstName !== undefined && { firstName: input.firstName || null }),
          ...(input.lastName !== undefined && { lastName: input.lastName || null }),
          ...(input.email !== undefined && { email: input.email.toLowerCase().trim() }),
          ...(input.phone !== undefined && { phone: input.phone || null }),
        })
        .where(and(eq(party.tenantId, tenantId), eq(party.id, linkedStaff.partyId)));

      if (input.jobTitle !== undefined) {
        await this.db
          .update(staffProfile)
          .set({ jobTitle: input.jobTitle || 'Collaborateur', updatedAt: new Date() })
          .where(eq(staffProfile.id, linkedStaff.id));
      }
    }

    return { success: true, user: updatedUser };
  }

  /**
   * Lie un compte utilisateur à une fiche de personnel existante ou en crée une nouvelle.
   */
  async linkUserToStaffInTenant(
    tenantId: string,
    userId: string,
    input?: { partyId?: string; jobTitle?: string; employmentType?: 'employee' | 'volunteer' | 'board_member' }
  ) {
    const [user] = await this.db.select().from(userAccount).where(eq(userAccount.id, userId));
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    if (input?.partyId) {
      // Link to existing staffProfile
      const [existingStaff] = await this.db
        .select()
        .from(staffProfile)
        .where(and(eq(staffProfile.tenantId, tenantId), eq(staffProfile.partyId, input.partyId)));

      if (existingStaff) {
        const [updated] = await this.db
          .update(staffProfile)
          .set({ userId, updatedAt: new Date() })
          .where(eq(staffProfile.id, existingStaff.id))
          .returning();
        return updated;
      }
    }

    // Or create new party & staffProfile for user
    const [newParty] = await this.db
      .insert(party)
      .values({
        tenantId,
        kind: 'person',
        firstName: user.firstName || 'Collaborateur',
        lastName: user.lastName || user.email.split('@')[0],
        email: user.email,
        phone: user.phone || null,
      })
      .returning();

    const [newStaff] = await this.db
      .insert(staffProfile)
      .values({
        tenantId,
        partyId: newParty.id,
        userId: user.id,
        jobTitle: input?.jobTitle || user.jobTitle || 'Membre d’équipe',
        employmentType: input?.employmentType || 'employee',
        status: 'active',
        hireDate: new Date().toISOString().split('T')[0],
      })
      .returning();

    return newStaff;
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

  /**
   * =========================================================================
   * PILIER 1 : COCKPIT FINANCIER & ABONNEMENTS (MRR, ARR, DUNNING)
   * =========================================================================
   */
  async getFinancialCockpit() {
    const plans = await this.db.select().from(subscriptionPlan);
    const subscriptions = await this.db.select().from(tenantSubscription);
    const invoices = await this.db.select().from(tenantInvoice).orderBy(desc(tenantInvoice.createdAt));
    const tenants = await this.db.select().from(tenantRegistry);

    const planMap = new Map(plans.map((p) => [p.code, p]));
    const tenantMap = new Map(tenants.map((t) => [t.id, t]));

    // Calculate MRR & ARR
    let totalMRR = 0;
    let totalARR = 0;
    const planCounts: Record<string, number> = { community: 0, starter: 0, pro: 0, enterprise: 0 };

    for (const sub of subscriptions) {
      if (sub.status === 'active' || sub.status === 'trialing') {
        const plan = planMap.get(sub.planCode);
        const monthlyPrice = plan ? Number(plan.priceMonthly) : 0;
        const annualPrice = plan ? Number(plan.priceAnnual) : 0;

        if (sub.billingCycle === 'annual') {
          totalARR += annualPrice;
          totalMRR += annualPrice / 12;
        } else {
          totalMRR += monthlyPrice;
          totalARR += monthlyPrice * 12;
        }

        planCounts[sub.planCode] = (planCounts[sub.planCode] || 0) + 1;
      }
    }

    const pastDueCount = subscriptions.filter((s) => s.status === 'past_due').length;
    const pastDueSubscriptions = subscriptions
      .filter((s) => s.status === 'past_due')
      .map((s) => ({
        ...s,
        tenant: tenantMap.get(s.tenantId) || null,
        plan: planMap.get(s.planCode) || null,
      }));

    const totalCollected = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.total), 0);

    return {
      totalMRR: Math.round(totalMRR * 100) / 100,
      totalARR: Math.round(totalARR * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
      trialingSubscriptions: subscriptions.filter((s) => s.status === 'trialing').length,
      pastDueCount,
      planDistribution: planCounts,
      pastDueList: pastDueSubscriptions,
      recentInvoices: invoices.slice(0, 15).map((inv) => ({
        ...inv,
        tenant: tenantMap.get(inv.tenantId) || null,
      })),
      plans,
    };
  }

  async getPlansWithStats() {
    const plans = await this.db.select().from(subscriptionPlan);
    const subscriptions = await this.db.select().from(tenantSubscription);

    return plans.map((p) => {
      const activeCount = subscriptions.filter((s) => s.planCode === p.code && s.status === 'active').length;
      return {
        ...p,
        activeTenantsCount: activeCount,
      };
    });
  }

  async getTenantInvoices(tenantId: string) {
    return this.db
      .select()
      .from(tenantInvoice)
      .where(eq(tenantInvoice.tenantId, tenantId))
      .orderBy(desc(tenantInvoice.createdAt));
  }

  async updateTenantPlanAndQuotas(
    tenantId: string,
    input: {
      planCode?: string;
      billingCycle?: 'monthly' | 'annual';
      seatCount?: number;
      maxUsersOverride?: number | null;
      maxStorageGbOverride?: number | null;
      maxProjectsOverride?: number | null;
      allowedModules?: string[];
    }
  ) {
    const [tenant] = await this.db.select().from(tenantRegistry).where(eq(tenantRegistry.id, tenantId));
    if (!tenant) throw new NotFoundException('Organisme non trouvé');

    // Update tenant custom overrides
    await this.db
      .update(tenantRegistry)
      .set({
        ...(input.maxUsersOverride !== undefined && { maxUsersOverride: input.maxUsersOverride }),
        ...(input.maxStorageGbOverride !== undefined && { maxStorageGbOverride: input.maxStorageGbOverride }),
        ...(input.maxProjectsOverride !== undefined && { maxProjectsOverride: input.maxProjectsOverride }),
        ...(input.allowedModules !== undefined && { allowedModules: input.allowedModules }),
        updatedAt: new Date(),
      })
      .where(eq(tenantRegistry.id, tenantId));

    // Update subscription if plan changed
    if (input.planCode || input.billingCycle || input.seatCount) {
      const [existingSub] = await this.db
        .select()
        .from(tenantSubscription)
        .where(eq(tenantSubscription.tenantId, tenantId));

      if (existingSub) {
        await this.db
          .update(tenantSubscription)
          .set({
            ...(input.planCode && { planCode: input.planCode }),
            ...(input.billingCycle && { billingCycle: input.billingCycle }),
            ...(input.seatCount && { seatCount: input.seatCount }),
            updatedAt: new Date(),
          })
          .where(eq(tenantSubscription.tenantId, tenantId));
      } else {
        await this.db.insert(tenantSubscription).values({
          tenantId,
          planCode: input.planCode || 'starter',
          billingCycle: input.billingCycle || 'monthly',
          seatCount: input.seatCount || 5,
          status: 'active',
        });
      }
    }

    return this.getTenantDetails(tenantId);
  }

  /**
   * =========================================================================
   * PILIER 2 : PROVISIONING CLIENT ASSISTÉ & CYCLE DE VIE
   * =========================================================================
   */
  async provisionTenant(input: {
    name: string;
    slug: string;
    acronym?: string;
    orgType?: string;
    neqNumber?: string;
    email: string;
    phone?: string;
    address?: string;
    website?: string;
    mode?: 'shared' | 'dedicated' | 'self_hosted';
    planCode?: string;
    billingCycle?: 'monthly' | 'annual';
    adminFirstName: string;
    adminLastName: string;
    adminEmail: string;
    adminPassword: string;
    adminJobTitle?: string;
    privacyOfficerName?: string;
    privacyOfficerEmail?: string;
    dataRetentionMonths?: number;
  }) {
    // Check if slug exists
    const [existingSlug] = await this.db
      .select()
      .from(tenantRegistry)
      .where(eq(tenantRegistry.slug, input.slug.toLowerCase().trim()));
    if (existingSlug) {
      throw new BadRequestException(`Le slug "${input.slug}" est déjà utilisé par un autre organisme.`);
    }

    // 1. Create Tenant Registry
    const [newTenant] = await this.db
      .insert(tenantRegistry)
      .values({
        name: input.name.trim(),
        slug: input.slug.toLowerCase().trim(),
        acronym: input.acronym || null,
        orgType: input.orgType || 'OBNL / NPO (Organisme à but non lucratif)',
        neqNumber: input.neqNumber || null,
        email: input.email.toLowerCase().trim(),
        phone: input.phone || null,
        address: input.address || null,
        website: input.website || null,
        mode: input.mode || 'shared',
        status: 'active',
        privacyOfficerName: input.privacyOfficerName || `${input.adminFirstName} ${input.adminLastName}`,
        privacyOfficerEmail: input.privacyOfficerEmail || input.adminEmail.toLowerCase().trim(),
        dataRetentionMonths: input.dataRetentionMonths || 60,
        onboardingCompleted: true,
      })
      .returning();

    // 2. Create Default Roles for this Tenant
    const [adminRole] = await this.db
      .insert(role)
      .values({
        tenantId: newTenant.id,
        code: 'admin',
        name: 'Administrateur',
        isSystem: true,
      })
      .returning();

    await this.db.insert(role).values([
      { tenantId: newTenant.id, code: 'staff', name: 'Collaborateur / Salarié', isSystem: true },
      { tenantId: newTenant.id, code: 'volunteer', name: 'Bénévole', isSystem: true },
      { tenantId: newTenant.id, code: 'board_member', name: 'Membre du Conseil', isSystem: true },
    ]);

    // 3. Create or Link Admin User Account
    let adminUser: any;
    const [existingUser] = await this.db
      .select()
      .from(userAccount)
      .where(eq(userAccount.email, input.adminEmail.toLowerCase().trim()));

    if (existingUser) {
      adminUser = existingUser;
    } else {
      const [createdUser] = await this.db
        .insert(userAccount)
        .values({
          email: input.adminEmail.toLowerCase().trim(),
          firstName: input.adminFirstName.trim(),
          lastName: input.adminLastName.trim(),
          jobTitle: input.adminJobTitle || 'Direction Générale',
          status: 'active',
        })
        .returning();

      const secretHash = await hash(input.adminPassword);
      await this.db.insert(userCredential).values({
        userId: createdUser.id,
        type: 'password',
        secretHash,
      });

      adminUser = createdUser;
    }

    // 4. Create Membership and assign Admin Role
    const [newMembership] = await this.db
      .insert(membership)
      .values({
        tenantId: newTenant.id,
        userId: adminUser.id,
        status: 'active',
      })
      .returning();

    await this.db.insert(membershipRole).values({
      tenantId: newTenant.id,
      membershipId: newMembership.id,
      roleId: adminRole.id,
    });

    // 5. Create Default Org Unit & Staff Profile
    const [defaultOrgUnit] = await this.db
      .insert(orgUnit)
      .values({
        tenantId: newTenant.id,
        name: 'Direction Générale',
        code: 'DIR',
      })
      .returning();

    const [adminParty] = await this.db
      .insert(party)
      .values({
        tenantId: newTenant.id,
        kind: 'person',
        firstName: adminUser.firstName || input.adminFirstName,
        lastName: adminUser.lastName || input.adminLastName,
        email: adminUser.email,
        phone: input.phone || null,
      })
      .returning();

    await this.db.insert(staffProfile).values({
      tenantId: newTenant.id,
      partyId: adminParty.id,
      userId: adminUser.id,
      jobTitle: input.adminJobTitle || 'Direction Générale',
      employmentType: 'employee',
      departmentId: defaultOrgUnit.id,
      status: 'active',
      hireDate: new Date().toISOString().split('T')[0],
    });

    // 6. Create Initial Subscription
    await this.db.insert(tenantSubscription).values({
      tenantId: newTenant.id,
      planCode: input.planCode || 'starter',
      billingCycle: input.billingCycle || 'monthly',
      status: 'active',
      seatCount: 5,
    });

    return newTenant;
  }

  async purgeTenant(tenantId: string, adminUserId: string) {
    const [tenant] = await this.db.select().from(tenantRegistry).where(eq(tenantRegistry.id, tenantId));
    if (!tenant) throw new NotFoundException('Organisme non trouvé');

    // Hard delete tenant and cascade all dependent data
    await this.db.delete(tenantRegistry).where(eq(tenantRegistry.id, tenantId));

    // Audit log deletion certificate
    await this.db.insert(auditLog).values({
      tenantId,
      userId: adminUserId,
      action: 'TENANT_HARD_PURGED_LOI25',
      entityType: 'tenant',
      entityId: tenantId,
      payload: {
        purgedTenantName: tenant.name,
        purgedSlug: tenant.slug,
        timestamp: new Date().toISOString(),
        certificate: `LOI25-PURGE-CERT-${Date.now()}`,
      },
    });

    return { success: true, message: `L'organisme "${tenant.name}" a été définitivement purgé conformément à la Loi 25.` };
  }

  /**
   * =========================================================================
   * PILIER 3 : FEATURE FLAGS & GESTION DES MODULES (ENTITLEMENTS)
   * =========================================================================
   */
  async getFeatureFlags(tenantId?: string) {
    const flags = await this.db.select().from(tenantFeatureFlag);
    const globalFlags = [
      { key: 'advanced_pm_evm', name: 'Gestion de Projet Avancée (EVM / PERT / CPM)', default: true },
      { key: 'trainings_public_portal', name: 'Portail Public d’Inscriptions aux Formations', default: true },
      { key: 'timesheets_analytics', name: 'Feuilles de Temps & Ventilation Analytique RH', default: true },
      { key: 'grants_multicurrency', name: 'Gestion des Bailleurs & Subventions Multi-Devises', default: true },
      { key: 'ai_copilot_assistant', name: 'Assistant IA & Génération Flash Rapport Copil', default: true },
      { key: 'loi25_automated_purge', name: 'Purge Automatique & Registre CAI Loi 25', default: true },
    ];

    return {
      systemFlags: globalFlags,
      configuredFlags: flags,
    };
  }

  async setFeatureFlag(input: {
    featureKey: string;
    isEnabled: boolean;
    tenantId?: string | null;
    description?: string;
  }) {
    const [existing] = await this.db
      .select()
      .from(tenantFeatureFlag)
      .where(
        input.tenantId
          ? and(eq(tenantFeatureFlag.featureKey, input.featureKey), eq(tenantFeatureFlag.tenantId, input.tenantId))
          : and(eq(tenantFeatureFlag.featureKey, input.featureKey), sql`${tenantFeatureFlag.tenantId} IS NULL`)
      );

    if (existing) {
      const [updated] = await this.db
        .update(tenantFeatureFlag)
        .set({
          isEnabled: input.isEnabled,
          description: input.description || existing.description,
          updatedAt: new Date(),
        })
        .where(eq(tenantFeatureFlag.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(tenantFeatureFlag)
      .values({
        featureKey: input.featureKey,
        isEnabled: input.isEnabled,
        tenantId: input.tenantId || null,
        description: input.description,
      })
      .returning();

    return created;
  }

  /**
   * =========================================================================
   * PILIER 4 : TÉLÉMÉTRIE, STOCKAGE GED & SANTÉ SYSTÈME (SRE / OPS)
   * =========================================================================
   */
  async getSystemHealthAndTelemetry() {
    const tenants = await this.db.select().from(tenantRegistry);
    const documents = await this.db.select().from(document);
    const sessions = await this.db.select().from(userSession);
    const plans = await this.db.select().from(subscriptionPlan);
    const planMap = new Map(plans.map((p) => [p.code, p]));

    const storageByTenant = tenants.map((t) => {
      const tenantDocs = documents.filter((d) => d.tenantId === t.id);
      // Simulate file sizes if 0: count * average 2.5MB
      const docCount = tenantDocs.length;
      const estimatedStorageMb = Math.round(docCount * 2.4 * 10) / 10;
      const plan = planMap.get('starter');
      const maxStorageGb = t.maxStorageGbOverride || plan?.maxStorageGb || 5;
      const maxStorageMb = maxStorageGb * 1024;
      const usagePct = Math.min(100, Math.round((estimatedStorageMb / maxStorageMb) * 100));

      return {
        tenantId: t.id,
        tenantName: t.name,
        slug: t.slug,
        documentCount: docCount,
        usedStorageMb: estimatedStorageMb,
        allocatedStorageGb: maxStorageGb,
        usagePct,
      };
    });

    return {
      dbStatus: 'healthy',
      uptimeSeconds: Math.floor(process.uptime()),
      activeSessionsCount: sessions.filter((s) => s.expiresAt > new Date()).length,
      totalTenantsCount: tenants.length,
      totalDocumentsCount: documents.length,
      storageTelemetry: storageByTenant,
      serverTime: new Date().toISOString(),
      nodeVersion: process.version,
    };
  }

  /**
   * =========================================================================
   * PILIER 5 : GOUVERNANCE GLOBALE, AUDIT TRAIL & INCIDENTS LOI 25
   * =========================================================================
   */
  async getPlatformAuditLogs(limit = 50, tenantId?: string) {
    let query = this.db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
    if (tenantId) {
      query = this.db.select().from(auditLog).where(eq(auditLog.tenantId, tenantId)).orderBy(desc(auditLog.createdAt)).limit(limit) as any;
    }
    const logs = await query;
    const tenants = await this.db.select().from(tenantRegistry);
    const users = await this.db.select().from(userAccount);

    const tenantMap = new Map(tenants.map((t) => [t.id, t]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    return logs.map((l) => ({
      ...l,
      tenant: l.tenantId ? tenantMap.get(l.tenantId) || null : null,
      user: l.userId ? userMap.get(l.userId) || null : null,
    }));
  }

  async getSecurityIncidents() {
    const incidents = await this.db.select().from(securityIncident).orderBy(desc(securityIncident.createdAt));
    const tenants = await this.db.select().from(tenantRegistry);
    const tenantMap = new Map(tenants.map((t) => [t.id, t]));

    return incidents.map((inc) => ({
      ...inc,
      tenant: inc.tenantId ? tenantMap.get(inc.tenantId) || null : null,
    }));
  }

  async createSecurityIncident(adminUserId: string, input: {
    title: string;
    description: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    tenantId?: string | null;
    impactedUsersCount?: number;
    containmentSteps?: string;
    notifiedCai?: boolean;
    caiReferenceNumber?: string;
  }) {
    const [incident] = await this.db
      .insert(securityIncident)
      .values({
        title: input.title,
        description: input.description,
        severity: input.severity || 'high',
        tenantId: input.tenantId || null,
        impactedUsersCount: input.impactedUsersCount || 0,
        containmentSteps: input.containmentSteps || null,
        notifiedCai: input.notifiedCai || false,
        caiReferenceNumber: input.caiReferenceNumber || null,
        notifiedAt: input.notifiedCai ? new Date() : null,
        reportedByUserId: adminUserId,
        status: input.notifiedCai ? 'notified_cai' : 'investigating',
      })
      .returning();

    await this.db.insert(auditLog).values({
      tenantId: input.tenantId || (await this.db.select().from(tenantRegistry).limit(1))[0]?.id,
      userId: adminUserId,
      action: 'SECURITY_INCIDENT_REGISTERED_LOI25',
      entityType: 'security_incident',
      entityId: incident.id,
      payload: { title: input.title, severity: input.severity },
    });

    return incident;
  }

  async updateSecurityIncident(id: string, updates: any) {
    const [updated] = await this.db
      .update(securityIncident)
      .set({
        ...updates,
        ...(updates.status === 'resolved' && { resolvedAt: new Date() }),
        ...(updates.notifiedCai === true && { notifiedAt: new Date() }),
        updatedAt: new Date(),
      })
      .where(eq(securityIncident.id, id))
      .returning();

    return updated;
  }

  /**
   * =========================================================================
   * PILIER 6 : BANNIÈRES DE MAINTENANCE & COMMUNICATION SYSTÈME
   * =========================================================================
   */
  async getAnnouncements(onlyActive = false) {
    const query = this.db.select().from(systemAnnouncement).orderBy(desc(systemAnnouncement.createdAt));
    const list = await query;
    if (onlyActive) {
      return list.filter((a) => a.isActive);
    }
    return list;
  }

  async createAnnouncement(input: {
    title: string;
    message: string;
    severity?: 'info' | 'warning' | 'critical';
    targetTenantId?: string | null;
    isActive?: boolean;
    startsAt?: string;
    endsAt?: string;
  }) {
    const [created] = await this.db
      .insert(systemAnnouncement)
      .values({
        title: input.title,
        message: input.message,
        severity: input.severity || 'info',
        targetTenantId: input.targetTenantId || null,
        isActive: input.isActive !== undefined ? input.isActive : true,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
      })
      .returning();

    return created;
  }

  async updateAnnouncement(id: string, updates: any) {
    const [updated] = await this.db
      .update(systemAnnouncement)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(systemAnnouncement.id, id))
      .returning();

    return updated;
  }

  async deleteAnnouncement(id: string) {
    await this.db.delete(systemAnnouncement).where(eq(systemAnnouncement.id, id));
    return { success: true };
  }
}

