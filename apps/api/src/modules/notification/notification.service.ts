import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import { DbClient, withTenantContext, notification, CreateNotificationInput } from '@orgdashio/shared';
import { eq, and, desc } from 'drizzle-orm';

@Injectable()
export class NotificationService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async create(tenantId: string, input: CreateNotificationInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .insert(notification)
        .values({
          tenantId,
          userId: input.userId,
          eventType: input.eventType,
          title: input.title,
          message: input.message,
          linkUrl: input.linkUrl,
        })
        .returning();
      return res;
    });
  }

  async findForUser(tenantId: string, userId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      return tx
        .select()
        .from(notification)
        .where(and(eq(notification.userId, userId)))
        .orderBy(desc(notification.createdAt))
        .limit(50);
    });
  }

  async markAsRead(tenantId: string, userId: string, notificationId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .update(notification)
        .set({ isRead: true })
        .where(and(eq(notification.id, notificationId), eq(notification.userId, userId)))
        .returning();
      return res;
    });
  }
}
