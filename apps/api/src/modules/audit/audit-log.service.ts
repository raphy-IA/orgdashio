import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import { DbClient, withTenantContext, auditLog } from '@orgdashio/shared';
import { eq, desc } from 'drizzle-orm';

export interface AuditLogOptions {
  action: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  /**
   * Records an audit log entry stripped of PII.
   */
  async log(tenantId: string, userId: string | null, options: AuditLogOptions) {
    // Sanitize payload to strip personal data (password, emails, notes)
    const sanitizedPayload = options.payload ? { ...options.payload } : {};
    delete sanitizedPayload.password;
    delete sanitizedPayload.secretHash;
    delete sanitizedPayload.token;

    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .insert(auditLog)
        .values({
          tenantId,
          userId,
          action: options.action,
          entityType: options.entityType,
          entityId: options.entityId,
          payload: sanitizedPayload,
        })
        .returning();
      return res;
    });
  }

  async findAll(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      return tx
        .select()
        .from(auditLog)
        .orderBy(desc(auditLog.createdAt))
        .limit(100);
    });
  }
}
