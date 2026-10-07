import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  tenantRegistry,
  userAccount,
  userCredential,
  userSession,
  membership,
  role,
  membershipRole,
  RegisterTenantInput,
  LoginInput,
} from '@orgdashio/shared';
import { hash, verify } from '@node-rs/argon2';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async registerTenant(input: RegisterTenantInput) {
    // Check if email already registered
    const [existingUser] = await this.db
      .select()
      .from(userAccount)
      .where(eq(userAccount.email, input.adminEmail.toLowerCase()));

    if (existingUser) {
      throw new BadRequestException('Adresse courriel déjà utilisée');
    }

    const slug = input.tenantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const hashedPassword = await hash(input.password);

    return this.db.transaction(async (tx) => {
      // 1. Create Tenant
      const [tenant] = await tx
        .insert(tenantRegistry)
        .values({
          name: input.tenantName,
          slug: `${slug}-${crypto.randomBytes(3).toString('hex')}`,
          mode: 'shared',
          status: 'active',
        })
        .returning();

      // Set RLS tenant context for subsequent inserts into tenant tables
      await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenant.id}, true)`);

      // 2. Create User Account
      const [user] = await tx
        .insert(userAccount)
        .values({
          email: input.adminEmail.toLowerCase(),
          locale: input.locale || 'fr',
          status: 'active',
        })
        .returning();

      // 3. Create User Credential
      await tx.insert(userCredential).values({
        userId: user.id,
        type: 'password',
        secretHash: hashedPassword,
      });

      // 4. Create System Roles for Tenant
      const [adminRole] = await tx
        .insert(role)
        .values({
          tenantId: tenant.id,
          code: 'admin',
          name: 'Administrateur',
          isSystem: true,
        })
        .returning();

      await tx.insert(role).values([
        {
          tenantId: tenant.id,
          code: 'team_member',
          name: "Membre d'équipe",
          isSystem: true,
        },
        {
          tenantId: tenant.id,
          code: 'viewer',
          name: 'Lecteur',
          isSystem: true,
        },
      ]);

      // 5. Create Membership
      const [mem] = await tx
        .insert(membership)
        .values({
          tenantId: tenant.id,
          userId: user.id,
          status: 'active',
        })
        .returning();

      // 6. Assign Admin Role
      await tx.insert(membershipRole).values({
        tenantId: tenant.id,
        membershipId: mem.id,
        roleId: adminRole.id,
      });

      return { tenant, user };
    });
  }

  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const [user] = await this.db
      .select()
      .from(userAccount)
      .where(eq(userAccount.email, input.email.toLowerCase()));

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const [cred] = await this.db
      .select()
      .from(userCredential)
      .where(eq(userCredential.userId, user.id));

    if (!cred || !(await verify(cred.secretHash, input.password))) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Check if user is platform admin
    if (user.isPlatformAdmin) {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(sessionToken)
        .digest('hex');

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.db.insert(userSession).values({
        userId: user.id,
        tenantId: null,
        tokenHash,
        expiresAt,
        ipAddress,
        userAgent,
      });

      return {
        sessionToken,
        user: { id: user.id, email: user.email, locale: user.locale, isPlatformAdmin: true },
        activeTenantId: null,
      };
    }

    // Get user memberships
    const userMemberships = await this.db
      .select()
      .from(membership)
      .where(eq(membership.userId, user.id));

    if (userMemberships.length === 0) {
      throw new ForbiddenException('Aucune association liée à ce compte');
    }

    const defaultTenantId = userMemberships[0].tenantId;

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(sessionToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.db.insert(userSession).values({
      userId: user.id,
      tenantId: defaultTenantId,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return {
      sessionToken,
      user: { id: user.id, email: user.email, locale: user.locale, isPlatformAdmin: false },
      activeTenantId: defaultTenantId,
    };
  }

  async validateSession(sessionToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(sessionToken)
      .digest('hex');

    const [session] = await this.db
      .select()
      .from(userSession)
      .where(eq(userSession.tokenHash, tokenHash));

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session;
  }

  async getMe(sessionToken: string) {
    const session = await this.validateSession(sessionToken);
    if (!session) {
      throw new UnauthorizedException('Session expirée ou invalide');
    }

    const [user] = await this.db
      .select()
      .from(userAccount)
      .where(eq(userAccount.id, session.userId));

    let tenant: typeof tenantRegistry.$inferSelect | undefined = undefined;
    let roles: { id: string; code: string; name: string }[] = [];

    if (session.tenantId) {
      const [t] = await this.db
        .select()
        .from(tenantRegistry)
        .where(eq(tenantRegistry.id, session.tenantId));
      tenant = t;

      // Fetch user's roles for this tenant
      const [userMembership] = await this.db
        .select()
        .from(membership)
        .where(
          and(
            eq(membership.tenantId, session.tenantId),
            eq(membership.userId, session.userId)
          )
        );

      if (userMembership) {
        const userRoles = await this.db
          .select({
            id: role.id,
            code: role.code,
            name: role.name,
          })
          .from(membershipRole)
          .innerJoin(role, eq(membershipRole.roleId, role.id))
          .where(
            and(
              eq(membershipRole.tenantId, session.tenantId),
              eq(membershipRole.membershipId, userMembership.id)
            )
          );
        roles = userRoles;
      }
    }

    return {
      user: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            phone: user.phone,
            jobTitle: user.jobTitle,
            locale: user.locale,
            isPlatformAdmin: user.isPlatformAdmin,
            roles,
          }
        : null,
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            mode: tenant.mode,
            logoUrl: tenant.logoUrl,
            acronym: tenant.acronym,
            description: tenant.description,
            orgType: tenant.orgType,
            neqNumber: tenant.neqNumber,
            address: tenant.address,
            phone: tenant.phone,
            email: tenant.email,
            website: tenant.website,
            privacyOfficerName: tenant.privacyOfficerName,
            privacyOfficerEmail: tenant.privacyOfficerEmail,
            dataRetentionMonths: tenant.dataRetentionMonths,
          }
        : null,
    };
  }

  async updateTenantProfile(tenantId: string, input: any) {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
    if (input.acronym !== undefined) updateData.acronym = input.acronym;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.orgType !== undefined) updateData.orgType = input.orgType;
    if (input.neqNumber !== undefined) updateData.neqNumber = input.neqNumber;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.website !== undefined) updateData.website = input.website;
    if (input.privacyOfficerName !== undefined) updateData.privacyOfficerName = input.privacyOfficerName;
    if (input.privacyOfficerEmail !== undefined) updateData.privacyOfficerEmail = input.privacyOfficerEmail;
    if (input.dataRetentionMonths !== undefined) updateData.dataRetentionMonths = input.dataRetentionMonths;

    const [updated] = await this.db
      .update(tenantRegistry)
      .set(updateData)
      .where(eq(tenantRegistry.id, tenantId))
      .returning();

    return updated;
  }

  async updateUserProfile(userId: string, input: any) {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (input.firstName !== undefined) updateData.firstName = input.firstName;
    if (input.lastName !== undefined) updateData.lastName = input.lastName;
    if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.jobTitle !== undefined) updateData.jobTitle = input.jobTitle;
    if (input.locale !== undefined) updateData.locale = input.locale;

    // Handle password change if requested
    if (input.newPassword) {
      if (!input.currentPassword) {
        throw new BadRequestException('Le mot de passe actuel est requis pour le modifier');
      }

      const [cred] = await this.db
        .select()
        .from(userCredential)
        .where(eq(userCredential.userId, userId));

      if (!cred || !(await verify(cred.secretHash, input.currentPassword))) {
        throw new BadRequestException('Mot de passe actuel incorrect');
      }

      const newSecretHash = await hash(input.newPassword);
      await this.db
        .update(userCredential)
        .set({ secretHash: newSecretHash, updatedAt: new Date() })
        .where(eq(userCredential.userId, userId));
    }

    const [updatedUser] = await this.db
      .update(userAccount)
      .set(updateData)
      .where(eq(userAccount.id, userId))
      .returning();

    return updatedUser;
  }
}
