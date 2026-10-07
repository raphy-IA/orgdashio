import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  Inject,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';
import { PlatformService } from './platform.service';

@Controller('api/v1/platform')
@UseGuards(AuthGuard, PlatformAdminGuard)
export class PlatformController {
  constructor(@Inject(PlatformService) private readonly platformService: PlatformService) {}

  @Get('tenants')
  async getTenants() {
    return this.platformService.getAllTenantsWithMetrics();
  }

  @Get('tenants/:id')
  async getTenantDetails(@Param('id') id: string) {
    return this.platformService.getTenantDetails(id);
  }

  @Patch('tenants/:id')
  async updateTenant(@Param('id') id: string, @Body() body: any) {
    return this.platformService.updateTenant(id, body);
  }

  @Patch('tenants/:id/status')
  async setTenantStatus(@Param('id') id: string, @Body() body: { status: 'active' | 'suspended' }, @Req() req: any) {
    return this.platformService.setTenantStatus(id, body.status, req.user?.id);
  }

  @Patch('tenants/:tenantId/users/:userId/status')
  async setUserStatusInTenant(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() body: { status: 'active' | 'suspended' }
  ) {
    return this.platformService.setUserStatusInTenant(tenantId, userId, body.status);
  }

  @Patch('tenants/:tenantId/users/:userId')
  async updateUserInTenant(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() body: any
  ) {
    return this.platformService.updateUserInTenant(tenantId, userId, body);
  }

  @Post('tenants/:tenantId/users/:userId/link-staff')
  async linkUserToStaffInTenant(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() body: any
  ) {
    return this.platformService.linkUserToStaffInTenant(tenantId, userId, body);
  }

  @Patch('tenants/:tenantId/staff/:partyId')
  async updateStaffInTenant(
    @Param('tenantId') tenantId: string,
    @Param('partyId') partyId: string,
    @Body() body: any
  ) {
    return this.platformService.updateStaffInTenant(tenantId, partyId, body);
  }

  @Post('tenants/:tenantId/support-access')
  async grantSupportAccess(
    @Param('tenantId') tenantId: string,
    @Body() body: { reason: string; durationMinutes?: number },
    @Req() req: any
  ) {
    return this.platformService.grantSupportAccess(
      req.user?.id,
      tenantId,
      body.reason || 'Support technique super-admin',
      body.durationMinutes || 60
    );
  }
}
