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
  userCredential,
  membership,
  membershipRole,
  invitation,
  role,
  consentRecord,
  serviceDelivery,
  CreatePersonInput,
  CreateStaffInput,
  UpdateStaffInput,
  CreateStaffAccountInput,
  RecordConsentInput,
  AddServiceDeliveryInput,
} from '@orgdashio/shared';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { hash } from '@node-rs/argon2';
import { calculateDuplicateScore, isServiceDeliveryAllowed } from './people.utils';

@Injectable()
export class PeopleService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async findAllRoles(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      return tx.select().from(role).where(eq(role.tenantId, tenantId));
    });
  }

  async findAll(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const parties = await tx.select().from(party).where(eq(party.tenantId, tenantId));
      const profiles = await tx.select().from(beneficiaryProfile).where(eq(beneficiaryProfile.tenantId, tenantId));
      const staffProfiles = await tx.select().from(staffProfile).where(eq(staffProfile.tenantId, tenantId));
      const departments = await tx.select().from(orgUnit).where(eq(orgUnit.tenantId, tenantId));

      // Fetch user accounts and roles for staff
      const userAccounts = await this.db
        .select({
          id: userAccount.id,
          email: userAccount.email,
          firstName: userAccount.firstName,
          lastName: userAccount.lastName,
          jobTitle: userAccount.jobTitle,
          status: userAccount.status,
          isPlatformAdmin: userAccount.isPlatformAdmin,
        })
        .from(userAccount);
      const userMap = new Map(userAccounts.map((u: any) => [u.id, u]));

      const memberships = await tx.select().from(membership).where(eq(membership.tenantId, tenantId));
      const memberIdToUserId = new Map<string, string>(memberships.map((m: any) => [m.id as string, m.userId as string]));

      const tenantRoles = await tx.select().from(role).where(eq(role.tenantId, tenantId));
      const roleMap = new Map<string, any>(tenantRoles.map((r: any) => [r.id as string, r]));

      const memRoles = await tx.select().from(membershipRole).where(eq(membershipRole.tenantId, tenantId));
      const userRolesMap = new Map<string, any[]>();
      for (const mr of memRoles) {
        const uid = memberIdToUserId.get(mr.membershipId);
        if (uid) {
          if (!userRolesMap.has(uid)) userRolesMap.set(uid, []);
          const foundRole = roleMap.get(mr.roleId);
          if (foundRole) userRolesMap.get(uid)!.push(foundRole);
        }
      }

      const profileMap = new Map(profiles.map((p: any) => [p.partyId, p]));
      const deptMap = new Map(departments.map((d: any) => [d.id, d]));
      const staffMap = new Map(
        staffProfiles.map((s: any) => {
          const user = s.userId ? userMap.get(s.userId) || null : null;
          const staffRoles = s.userId ? userRolesMap.get(s.userId) || [] : [];
          return [
            s.partyId,
            {
              ...s,
              department: s.departmentId ? deptMap.get(s.departmentId) || null : null,
              userAccount: user,
              roles: staffRoles,
            },
          ];
        })
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

        let user: any = null;
        let staffRoles: any[] = [];
        if (staff.userId) {
          const [foundUser] = await this.db
            .select({
              id: userAccount.id,
              email: userAccount.email,
              firstName: userAccount.firstName,
              lastName: userAccount.lastName,
              jobTitle: userAccount.jobTitle,
              status: userAccount.status,
              isPlatformAdmin: userAccount.isPlatformAdmin,
            })
            .from(userAccount)
            .where(eq(userAccount.id, staff.userId));
          user = foundUser || null;

          const [userMembership] = await tx
            .select()
            .from(membership)
            .where(and(eq(membership.tenantId, tenantId), eq(membership.userId, staff.userId)));

          if (userMembership) {
            staffRoles = await tx
              .select({
                id: role.id,
                code: role.code,
                name: role.name,
              })
              .from(membershipRole)
              .innerJoin(role, eq(membershipRole.roleId, role.id))
              .where(
                and(
                  eq(membershipRole.tenantId, tenantId),
                  eq(membershipRole.membershipId, userMembership.id)
                )
              );
          }
        }

        staffWithDept = {
          ...staff,
          department: dept,
          userAccount: user,
          roles: staffRoles,
        };
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
          email: input.email ? input.email.toLowerCase().trim() : null,
          phone: input.phone || null,
        })
        .returning();

      // 3. User Account creation / linking if email is provided
      let userIdToLink: string | null = null;
      if (input.email && (input.createAccount || input.password || input.roleId)) {
        const normalizedEmail = input.email.toLowerCase().trim();
        const [existingUser] = await this.db
          .select()
          .from(userAccount)
          .where(eq(userAccount.email, normalizedEmail));

        if (existingUser) {
          userIdToLink = existingUser.id;
          // Ensure membership
          const [existingMem] = await tx
            .select()
            .from(membership)
            .where(and(eq(membership.tenantId, tenantId), eq(membership.userId, existingUser.id)));

          let memId = existingMem?.id;
          if (!existingMem) {
            const [newMem] = await tx
              .insert(membership)
              .values({
                tenantId,
                userId: existingUser.id,
                status: 'active',
              })
              .returning();
            memId = newMem.id;
          }

          if (input.roleId && memId) {
            await tx
              .insert(membershipRole)
              .values({
                tenantId,
                membershipId: memId,
                roleId: input.roleId,
              })
              .onConflictDoNothing();
          }
        } else {
          // Create new userAccount + credential + membership
          const plainPassword = input.password && input.password.trim().length >= 6
            ? input.password.trim()
            : 'OrgDash2026!';
          const hashedPassword = await hash(plainPassword);

          const [newUser] = await tx
            .insert(userAccount)
            .values({
              email: normalizedEmail,
              firstName: input.firstName,
              lastName: input.lastName,
              jobTitle: input.jobTitle,
              locale: 'fr-CA',
              status: 'active',
            })
            .returning();

          await tx.insert(userCredential).values({
            userId: newUser.id,
            type: 'password',
            secretHash: hashedPassword,
          });

          const [newMem] = await tx
            .insert(membership)
            .values({
              tenantId,
              userId: newUser.id,
              status: 'active',
            })
            .returning();

          if (input.roleId) {
            await tx.insert(membershipRole).values({
              tenantId,
              membershipId: newMem.id,
              roleId: input.roleId,
            });
          }

          userIdToLink = newUser.id;
        }
      }

      // 4. Create staff profile
      const [newStaff] = await tx
        .insert(staffProfile)
        .values({
          tenantId,
          partyId: newParty.id,
          userId: userIdToLink,
          jobTitle: input.jobTitle,
          departmentId: input.departmentId || null,
          employmentType: input.employmentType || 'employee',
          status: input.status || 'active',
          hireDate: input.hireDate || null,
          emergencyContact: input.emergencyContact || null,
          notes: input.notes || null,
        })
        .returning();

      // 5. Optionally create system invitation if requested
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
      // 1. Get current staff and party
      const [currentStaff] = await tx
        .select()
        .from(staffProfile)
        .where(and(eq(staffProfile.partyId, partyId), eq(staffProfile.tenantId, tenantId)));

      if (!currentStaff) throw new NotFoundException('Fiche collaborateur non trouvée');

      // 2. Update party
      const partyUpdates: any = {};
      if (input.firstName !== undefined) partyUpdates.firstName = input.firstName;
      if (input.lastName !== undefined) partyUpdates.lastName = input.lastName;
      if (input.email !== undefined) partyUpdates.email = input.email ? input.email.toLowerCase().trim() : null;
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

      // 3. Update staff profile
      const staffUpdates: any = { updatedAt: new Date() };
      if (input.jobTitle !== undefined) staffUpdates.jobTitle = input.jobTitle;
      if (input.departmentId !== undefined) staffUpdates.departmentId = input.departmentId || null;
      if (input.employmentType !== undefined) staffUpdates.employmentType = input.employmentType;
      if (input.status !== undefined) staffUpdates.status = input.status;
      if (input.hireDate !== undefined) staffUpdates.hireDate = input.hireDate || null;
      if (input.emergencyContact !== undefined) staffUpdates.emergencyContact = input.emergencyContact || null;
      if (input.notes !== undefined) staffUpdates.notes = input.notes || null;

      let linkedUserId = currentStaff.userId;

      // 4. Synchronize linked User Account (Email/Login, Name, JobTitle, Password, Role)
      if (linkedUserId) {
        const userUpdates: any = { updatedAt: new Date() };
        if (input.email !== undefined && input.email) {
          userUpdates.email = input.email.toLowerCase().trim();
        }
        if (input.firstName !== undefined) userUpdates.firstName = input.firstName;
        if (input.lastName !== undefined) userUpdates.lastName = input.lastName;
        if (input.jobTitle !== undefined) userUpdates.jobTitle = input.jobTitle;

        if (Object.keys(userUpdates).length > 1) {
          await tx.update(userAccount).set(userUpdates).where(eq(userAccount.id, linkedUserId));
        }

        if (input.password && input.password.trim().length >= 6) {
          const hashedPassword = await hash(input.password.trim());
          await tx
            .update(userCredential)
            .set({ secretHash: hashedPassword, updatedAt: new Date() })
            .where(eq(userCredential.userId, linkedUserId));
        }

        if (input.roleId) {
          const [mem] = await tx
            .select()
            .from(membership)
            .where(and(eq(membership.tenantId, tenantId), eq(membership.userId, linkedUserId)));
          if (mem) {
            await tx
              .delete(membershipRole)
              .where(and(eq(membershipRole.tenantId, tenantId), eq(membershipRole.membershipId, mem.id)));
            await tx.insert(membershipRole).values({
              tenantId,
              membershipId: mem.id,
              roleId: input.roleId,
            });
          }
        }
      } else if (input.createAccount && input.email) {
        // Create user account on update if requested
        const accountResult = await this.createStaffAccount(tenantId, partyId, {
          password: input.password,
          roleId: input.roleId,
        });
        linkedUserId = accountResult.userId;
      }

      staffUpdates.userId = linkedUserId;

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

  async createStaffAccount(tenantId: string, partyId: string, input: CreateStaffAccountInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [personParty] = await tx.select().from(party).where(eq(party.id, partyId));
      if (!personParty) throw new NotFoundException('Collaborateur non trouvé');

      if (!personParty.email) {
        throw new BadRequestException('Une adresse courriel est obligatoire pour créer un compte utilisateur.');
      }

      const [staff] = await tx.select().from(staffProfile).where(eq(staffProfile.partyId, partyId));
      if (!staff) throw new NotFoundException('Profil collaborateur non trouvé');

      const normalizedEmail = personParty.email.toLowerCase().trim();

      // Check if user account already exists
      const [existingUser] = await this.db
        .select()
        .from(userAccount)
        .where(eq(userAccount.email, normalizedEmail));

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        const [existingMem] = await tx
          .select()
          .from(membership)
          .where(and(eq(membership.tenantId, tenantId), eq(membership.userId, existingUser.id)));

        let memId = existingMem?.id;
        if (!existingMem) {
          const [newMem] = await tx
            .insert(membership)
            .values({
              tenantId,
              userId: existingUser.id,
              status: 'active',
            })
            .returning();
          memId = newMem.id;
        }

        if (input.roleId && memId) {
          await tx
            .delete(membershipRole)
            .where(and(eq(membershipRole.tenantId, tenantId), eq(membershipRole.membershipId, memId)));
          await tx.insert(membershipRole).values({
            tenantId,
            membershipId: memId,
            roleId: input.roleId,
          });
        }
      } else {
        const plainPassword = input.password && input.password.trim().length >= 6
          ? input.password.trim()
          : 'OrgDash2026!';
        const hashedPassword = await hash(plainPassword);

        const [newUser] = await tx
          .insert(userAccount)
          .values({
            email: normalizedEmail,
            firstName: personParty.firstName,
            lastName: personParty.lastName,
            jobTitle: staff.jobTitle,
            locale: 'fr-CA',
            status: 'active',
          })
          .returning();

        await tx.insert(userCredential).values({
          userId: newUser.id,
          type: 'password',
          secretHash: hashedPassword,
        });

        const [newMem] = await tx
          .insert(membership)
          .values({
            tenantId,
            userId: newUser.id,
            status: 'active',
          })
          .returning();

        if (input.roleId) {
          await tx.insert(membershipRole).values({
            tenantId,
            membershipId: newMem.id,
            roleId: input.roleId,
          });
        }

        userId = newUser.id;
      }

      // Link staffProfile to user
      await tx
        .update(staffProfile)
        .set({ userId, updatedAt: new Date() })
        .where(and(eq(staffProfile.partyId, partyId), eq(staffProfile.tenantId, tenantId)));

      return {
        success: true,
        userId,
        email: normalizedEmail,
        message: 'Compte utilisateur créé et associé avec succès.',
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
