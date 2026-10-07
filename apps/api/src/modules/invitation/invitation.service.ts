import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  withTenantContext,
  invitation,
  userAccount,
  userCredential,
  membership,
  membershipRole,
  SendInvitationInput,
  AcceptInvitationInput,
} from '@orgdashio/shared';
import { eq } from 'drizzle-orm';
import { hashToken, isTokenExpired, generateRawToken } from './invitation.utils';
import { hash } from '@node-rs/argon2';

@Injectable()
export class InvitationService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async sendInvitation(
    tenantId: string,
    invitedByUserId: string,
    input: SendInvitationInput
  ) {
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const record = await withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .insert(invitation)
        .values({
          tenantId,
          email: input.email.toLowerCase(),
          roleId: input.roleId,
          tokenHash,
          status: 'pending',
          invitedBy: invitedByUserId,
          expiresAt,
        })
        .returning();
      return res;
    });

    return {
      invitation: record,
      rawToken,
    };
  }

  async getInvitations(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      return tx.select().from(invitation);
    });
  }

  async acceptInvitation(input: AcceptInvitationInput) {
    const tokenHash = hashToken(input.token);

    const inv = await this.db.query.invitation.findFirst({
      where: eq(invitation.tokenHash, tokenHash),
    });

    if (!inv || inv.status !== 'pending') {
      throw new NotFoundException('Invitation invalide ou déjà utilisée');
    }

    if (isTokenExpired(inv.expiresAt)) {
      throw new BadRequestException('L’invitation a expiré');
    }

    const hashedPassword = await hash(input.password);

    return this.db.transaction(async (tx) => {
      // 1. Find or create user account
      let user = await tx.query.userAccount.findFirst({
        where: eq(userAccount.email, inv.email.toLowerCase()),
      });

      if (!user) {
        const [newUser] = await tx
          .insert(userAccount)
          .values({
            email: inv.email.toLowerCase(),
            status: 'active',
          })
          .returning();
        user = newUser;

        await tx.insert(userCredential).values({
          userId: user.id,
          type: 'password',
          secretHash: hashedPassword,
        });
      }

      // 2. Create membership
      const [mem] = await tx
        .insert(membership)
        .values({
          tenantId: inv.tenantId,
          userId: user.id,
          status: 'active',
        })
        .returning();

      // 3. Assign role
      await tx.insert(membershipRole).values({
        tenantId: inv.tenantId,
        membershipId: mem.id,
        roleId: inv.roleId,
      });

      // 4. Update invitation status
      await tx
        .update(invitation)
        .set({ status: 'accepted' })
        .where(eq(invitation.id, inv.id));

      return { success: true, user };
    });
  }
}
