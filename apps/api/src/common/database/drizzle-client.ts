import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@orgdashio/shared';

export type DbClient = NodePgDatabase<typeof schema>;

export function createPgPool(connectionString?: string) {
  return new pg.Pool({
    connectionString:
      connectionString ||
      process.env.DATABASE_URL ||
      'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio',
  });
}

export function createDbClient(pool: pg.Pool): DbClient {
  return drizzle(pool, { schema });
}
