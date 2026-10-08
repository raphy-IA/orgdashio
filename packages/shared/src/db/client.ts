import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './schema';

export type DbClient = NodePgDatabase<typeof schema>;

/**
 * Execute a transaction within a specific Tenant RLS context.
 * Sets `app.tenant_id` for the duration of the SQL transaction.
 */
export async function withTenantContext<T>(
  db: DbClient,
  tenantId: string,
  fn: (tx: any) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx: any) => {
    // Set current tenant ID in PostgreSQL session variable (scoped to transaction)
    await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx);
  });
}
