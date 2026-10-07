import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import * as schema from './schema';

export type DbClient = ReturnType<typeof createDbClient>;

export function createPgPool(connectionString?: string) {
  return new pg.Pool({
    connectionString:
      connectionString ||
      process.env.DATABASE_URL ||
      'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio',
  });
}

export function createDbClient(pool: pg.Pool) {
  return drizzle(pool, { schema });
}

/**
 * Execute a transaction within a specific Tenant RLS context.
 * Sets `app.tenant_id` for the duration of the SQL transaction.
 */
export async function withTenantContext<T>(
  db: DbClient,
  tenantId: string,
  fn: (tx: any) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // Set current tenant ID in PostgreSQL session variable (scoped to transaction)
    await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx);
  });
}
