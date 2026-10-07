import { Module, Global } from '@nestjs/common';
import { createPgPool, createDbClient } from '@orgdashio/shared';

export const DATABASE_POOL = 'DATABASE_POOL';
export const DRIZZLE_DB = 'DRIZZLE_DB';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: () => createPgPool(),
    },
    {
      provide: DRIZZLE_DB,
      inject: [DATABASE_POOL],
      useFactory: (pool) => createDbClient(pool),
    },
  ],
  exports: [DATABASE_POOL, DRIZZLE_DB],
})
export class DatabaseModule {}
