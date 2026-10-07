import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  withTenantContext,
  party,
  beneficiaryProfile,
  staffProfile,
  orgUnit,
  userAccount,
  invitation,
  role,
  household,
  householdMember,
  consentPurpose,
  consentRecord,
  serviceDelivery,
  CreatePersonSchema,
  CreatePersonInput,
  CreateStaffInput,
  UpdateStaffInput,
  RecordConsentInput,
  AddServiceDeliveryInput,
} from '@orgdashio/shared';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { calculateDuplicateScore, isServiceDeliveryAllowed } from './people.utils';

@Injectable()
export class PeopleService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async findAll(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const parties = await tx.select().from(party);
      const profiles = await tx.select().from(beneficiaryProfile);
      const staffProfiles = await tx.select().from(staffProfile);
      const departments = await tx.select().from(orgUnit);

      const profileMap = new Map(profiles.map((p: any) => [p.partyId, p]));
      const deptMap = new Map(departments.map((d: any) => [d.id, d]));
      const staffMap = new Map(
        staffProfiles.map((s: any) => [
          s.partyId,
          {
            ...s,
            department: s.departmentId ? deptMap.get(s.departmentId) || null : null,
          },
        ])
      );

      return parties.map((p: any) => ({
        ...p,
        profile: profileMap.get(p.id) || null,
        staff: staffMap.get(p.id) || null,
      }));
    });
  }

  async findOne(tenantId: string, partyId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [personParty] = await tx.select().from(party).where(eq(party.id, partyId));
      if (!personParty) throw new NotFoundException('Personne non trouvée');

      const [profile] = await tx.select().from(beneficiaryProfile).where(eq(beneficiaryProfile.partyId, partyId));
      const [staff] = await tx.select().from(staffProfile).where(eq(staffProfile.partyId, partyId));
      const consents = await tx.select().from(consentRecord).where(eq(consentRecord.partyId, partyId));
      const deliveries = await tx.select().from(serviceDelivery).where(eq(serviceDelivery.partyId, partyId));

      let staffWithDept: any = null;
      if (staff) {
        let dept: any = null;
        if (staff.departmentId) {
          const [foundDept] = await tx.select().from(orgUnit).where(eq(orgUnit.id, staff.departmentId));
          dept = foundDept || null;
        }
        staffWithDept = { ...staff, department: dept };
      }

      return {
        party: personParty,
        profile,
        staff: staffWithDept,
        consents,
        serviceDeliveries: deliveries,
      };
    });
  }

  async createStaff(tenantId: string, input: CreateStaffInput, invitedByUserId?: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      // 1. Check potential duplicate in parties
      const existingParties = await tx.select().from(party);
      const duplicates = existingParties
        .map((p: any) => ({
          party: p,
          score: calculateDuplicateScore(
            { firstName: input.firstName, lastName: input.lastName, email: input.email },
            { firstName: p.firstName || '', lastName: p.lastName || '', email: p.email || '' }
          ),
        }))
        .filter((d: any) => d.score >= 80);

      // 2. Create party
      const [newParty] = await tx
        .insert(party)
        .values({
          tenantId,
          kind: 'person',
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || null,
          phone: input.phone || null,
        })
        .returning();

      // 3. Create staff profile
      const [newStaff] = await tx
        .insert(staffProfile)
        .values({
          tenantId,
          partyId: newParty.id,
          jobTitle: input.jobTitle,
          departmentId: input.departmentId || null,
          employmentType: input.employmentType || 'employee',
          status: input.status || 'active',
          hireDate: input.hireDate || null,
          emergencyContact: input.emergencyContact || null,
          notes: input.notes || null,
        })
        .returning();

      // 4. Optionally create system invitation if requested and email provided
      let generatedInvitation: any = null;
      if (input.sendInviteEmail && input.email && input.roleId && invitedByUserId) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const [createdInv] = await tx
          .insert(invitation)
          .values({
            tenantId,
            email: input.email.toLowerCase().trim(),
            roleId: input.roleId,
            tokenHash,
            status: 'pending',
            invitedBy: invitedByUserId,
            expiresAt,
          })
          .returning();

        generatedInvitation = {
          ...createdInv,
          rawToken,
        };
      }

      return {
        party: newParty,
        staff: newStaff,
        invitation: generatedInvitation,
        warnings: duplicates.map((d: any) => d.party),
      };
    });
  }

  async updateStaff(tenantId: string, partyId: string, input: UpdateStaffInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      // 1. Update party
      const partyUpdates: any = {};
      if (input.firstName !== undefined) partyUpdates.firstName = input.firstName;
      if (input.lastName !== undefined) partyUpdates.lastName = input.lastName;
      if (input.email !== undefined) partyUpdates.email = input.email || null;
      if (input.phone !== undefined) partyUpdates.phone = input.phone || null;

      let updatedParty: any = null;
      if (Object.keys(partyUpdates).length > 0) {
        const [p] = await tx
          .update(party)
          .set(partyUpdates)
          .where(and(eq(party.id, partyId), eq(party.tenantId, tenantId)))
          .returning();
        updatedParty = p;
      }

      // 2. Update staff profile
      const staffUpdates: any = { updatedAt: new Date() };
      if (input.jobTitle !== undefined) staffUpdates.jobTitle = input.jobTitle;
      if (input.departmentId !== undefined) staffUpdates.departmentId = input.departmentId || null;
      if (input.employmentType !== undefined) staffUpdates.employmentType = input.employmentType;
      if (input.status !== undefined) staffUpdates.status = input.status;
      if (input.hireDate !== undefined) staffUpdates.hireDate = input.hireDate || null;
      if (input.emergencyContact !== undefined) staffUpdates.emergencyContact = input.emergencyContact || null;
      if (input.notes !== undefined) staffUpdates.notes = input.notes || null;

      const [updatedStaff] = await tx
        .update(staffProfile)
        .set(staffUpdates)
        .where(and(eq(staffProfile.partyId, partyId), eq(staffProfile.tenantId, tenantId)))
        .returning();

      return {
        party: updatedParty,
        staff: updatedStaff,
      };
    });
  }

  async deleteStaff(tenantId: string, partyId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      await tx
        .delete(staffProfile)
        .where(and(eq(staffProfile.partyId, partyId), eq(staffProfile.tenantId, tenantId)));

      // If no beneficiary profile, delete party as well
      const [hasBeneficiary] = await tx
        .select()
        .from(beneficiaryProfile)
        .where(and(eq(beneficiaryProfile.partyId, partyId), eq(beneficiaryProfile.tenantId, tenantId)));

      if (!hasBeneficiary) {
        await tx
          .delete(party)
          .where(and(eq(party.id, partyId), eq(party.tenantId, tenantId)));
      }

      return { success: true };
    });
  }

  async findAllDepartments(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      return tx.select().from(orgUnit).where(eq(orgUnit.tenantId, tenantId));
    });
  }

  async createDepartment(tenantId: string, name: string, code?: string, parentId?: string | null) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .insert(orgUnit)
        .values({
          tenantId,
          name,
          code: code || null,
          parentId: parentId || null,
        })
        .returning();
      return res;
    });
  }

  async updateDepartment(tenantId: string, id: string, input: { name?: string; code?: string; parentId?: string | null }) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [updated] = await tx
        .update(orgUnit)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.code !== undefined && { code: input.code || null }),
          ...(input.parentId !== undefined && { parentId: input.parentId || null }),
        })
        .where(and(eq(orgUnit.id, id), eq(orgUnit.tenantId, tenantId)))
        .returning();
      if (!updated) throw new NotFoundException('Département non trouvé');
      return updated;
    });
  }

  async deleteDepartment(tenantId: string, id: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      // Detach staff from department first
      await tx
        .update(staffProfile)
        .set({ departmentId: null })
        .where(and(eq(staffProfile.departmentId, id), eq(staffProfile.tenantId, tenantId)));

      const [deleted] = await tx
        .delete(orgUnit)
        .where(and(eq(orgUnit.id, id), eq(orgUnit.tenantId, tenantId)))
        .returning();
      if (!deleted) throw new NotFoundException('Département non trouvé');
      return { success: true };
    });
  }

  async createPerson(tenantId: string, input: CreatePersonInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      // 1. Check potential duplicates
      const existingParties = await tx.select().from(party);
      const duplicates = existingParties
        .map((p: any) => ({
          party: p,
          score: calculateDuplicateScore(
            { firstName: input.firstName, lastName: input.lastName, email: input.email },
            { firstName: p.firstName || '', lastName: p.lastName || '', email: p.email || '' }
          ),
        }))
        .filter((d: any) => d.score >= 80);

      // 2. Create party
      const [newParty] = await tx
        .insert(party)
        .values({
          tenantId,
          kind: 'person',
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
        })
        .returning();

      // 3. Create beneficiary profile
      const [profile] = await tx
        .insert(beneficiaryProfile)
        .values({
          tenantId,
          partyId: newParty.id,
          birthDate: input.birthDate,
          genderCode: input.genderCode,
          preferredLang: input.preferredLang,
        })
        .returning();

      return {
        party: newParty,
        profile,
        warnings: duplicates.map((d: any) => d.party),
      };
    });
  }

  async recordConsent(tenantId: string, partyId: string, input: RecordConsentInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [record] = await tx
        .insert(consentRecord)
        .values({
          tenantId,
          partyId,
          purposeId: input.purposeId,
          version: input.version,
          status: input.status,
          mode: input.mode,
          withdrawnAt: input.status === 'withdrawn' ? new Date() : null,
        })
        .returning();
      return record;
    });
  }

  async addServiceDelivery(tenantId: string, partyId: string, providerPartyId: string, input: AddServiceDeliveryInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      // Check consent before delivering service (CMP-05)
      const consents = await tx.select().from(consentRecord).where(eq(consentRecord.partyId, partyId));
      const activeConsent = consents.find((c: any) => c.status === 'given' && !c.withdrawnAt);

      if (!isServiceDeliveryAllowed(activeConsent)) {
        throw new BadRequestException('Consentement obligatoire non accordé ou retiré (Loi 25)');
      }

      const [res] = await tx
        .insert(serviceDelivery)
        .values({
          tenantId,
          partyId,
          serviceTypeId: input.serviceTypeId,
          projectId: input.projectId,
          providerPartyId,
          deliveredAt: input.deliveredAt,
          notes: input.notes,
        })
        .returning();
      return res;
    });
  }
}
