import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
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

  // ==========================================
  // Core Tenants Explorer & Details
  // ==========================================
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

  // ==========================================
  // Pilier 1 : Financials & Subscriptions
  // ==========================================
  @Get('financials')
  async getFinancialCockpit() {
    return this.platformService.getFinancialCockpit();
  }

  @Get('plans')
  async getPlans() {
    return this.platformService.getPlansWithStats();
  }

  @Get('tenants/:id/invoices')
  async getTenantInvoices(@Param('id') id: string) {
    return this.platformService.getTenantInvoices(id);
  }

  @Patch('tenants/:id/plan')
  async updateTenantPlanAndQuotas(@Param('id') id: string, @Body() body: any) {
    return this.platformService.updateTenantPlanAndQuotas(id, body);
  }

  // ==========================================
  // Pilier 2 : Provisioning & Lifecycle
  // ==========================================
  @Post('tenants/provision')
  async provisionTenant(@Body() body: any) {
    return this.platformService.provisionTenant(body);
  }

  @Delete('tenants/:id/purge')
  async purgeTenant(@Param('id') id: string, @Req() req: any) {
    return this.platformService.purgeTenant(id, req.user?.id);
  }

  // ==========================================
  // Pilier 3 : Feature Flags & Entitlements
  // ==========================================
  @Get('feature-flags')
  async getFeatureFlags(@Query('tenantId') tenantId?: string) {
    return this.platformService.getFeatureFlags(tenantId);
  }

  @Post('feature-flags')
  async setFeatureFlag(@Body() body: any) {
    return this.platformService.setFeatureFlag(body);
  }

  // ==========================================
  // Pilier 4 : System Telemetry & Health
  // ==========================================
  @Get('system/health')
  async getSystemHealth() {
    return this.platformService.getSystemHealthAndTelemetry();
  }

  // ==========================================
  // Pilier 5 : Security Incidents & Audit Logs
  // ==========================================
  @Get('audit-logs')
  async getPlatformAuditLogs(@Query('limit') limit?: string, @Query('tenantId') tenantId?: string) {
    return this.platformService.getPlatformAuditLogs(limit ? parseInt(limit, 10) : 50, tenantId);
  }

  @Get('security-incidents')
  async getSecurityIncidents() {
    return this.platformService.getSecurityIncidents();
  }

  @Post('security-incidents')
  async createSecurityIncident(@Body() body: any, @Req() req: any) {
    return this.platformService.createSecurityIncident(req.user?.id, body);
  }

  @Patch('security-incidents/:id')
  async updateSecurityIncident(@Param('id') id: string, @Body() body: any) {
    return this.platformService.updateSecurityIncident(id, body);
  }

  // ==========================================
  // Pilier 6 : Announcements & Broadcast
  // ==========================================
  @Get('announcements')
  async getAnnouncements(@Query('active') active?: string) {
    return this.platformService.getAnnouncements(active === 'true');
  }

  @Post('announcements')
  async createAnnouncement(@Body() body: any) {
    return this.platformService.createAnnouncement(body);
  }

  @Patch('announcements/:id')
  async updateAnnouncement(@Param('id') id: string, @Body() body: any) {
    return this.platformService.updateAnnouncement(id, body);
  }

  @Delete('announcements/:id')
  async deleteAnnouncement(@Param('id') id: string) {
    return this.platformService.deleteAnnouncement(id);
  }

  // ==========================================
  // Users & Staff Operations
  // ==========================================
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
