import { Controller, Get, UseGuards, Inject } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';
import { DRIZZLE_DB } from '../../common/database/database.module';
import { DbClient, tenantRegistry } from '@orgdashio/shared';

@Controller('api/v1/platform')
@UseGuards(AuthGuard, PlatformAdminGuard)
export class PlatformController {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  @Get('tenants')
  async getTenants() {
    // Platform control plane list
    return this.db.select().from(tenantRegistry);
  }
}
