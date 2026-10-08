import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TimesheetsService } from './timesheets.service';
import {
  UpdateUserHrProfileSchema,
  UpdateTimesheetStatusSchema,
  BatchUpsertTimesheetEntriesSchema,
} from '@orgdashio/shared';

@Controller('api/v1')
@UseGuards(AuthGuard)
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  // ---------------------------------------------------------------------------
  // TIMESHEET DASHBOARD & MY-WEEK
  // ---------------------------------------------------------------------------
  @Get('timesheets/dashboard')
  async getDashboard(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.timesheetsService.getDashboardMetrics(tenantId);
  }

  @Get('timesheets/my-week')
  async getMyWeek(@Req() req: any, @Query('date') date?: string) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    return this.timesheetsService.getOrCreateWeekTimesheet(tenantId, userId, date);
  }

  @Get('timesheets')
  async findAllTimesheets(
    @Req() req: any,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const tenantId = req.user.tenantId;
    return this.timesheetsService.findAllTimesheets(tenantId, {
      userId,
      status,
      startDate,
      endDate,
    });
  }

  @Get('timesheets/:id')
  async findTimesheetById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.timesheetsService.findTimesheetById(tenantId, id);
  }

  @Post('timesheets/:id/entries')
  async batchUpsertEntries(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const validated = BatchUpsertTimesheetEntriesSchema.parse(body);
    return this.timesheetsService.batchUpsertEntries(tenantId, id, userId, validated);
  }

  @Post('timesheets/:id/submit')
  async submitTimesheet(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    return this.timesheetsService.submitTimesheet(tenantId, id, userId);
  }

  @Post('timesheets/:id/review')
  async reviewTimesheet(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const reviewerUserId = req.user.id;
    const validated = UpdateTimesheetStatusSchema.parse(body);
    return this.timesheetsService.reviewTimesheet(tenantId, id, reviewerUserId, validated);
  }

  // ---------------------------------------------------------------------------
  // ANALYTIC ALLOCATIONS
  // ---------------------------------------------------------------------------
  @Get('timesheets/analytics/project/:projectId')
  async getProjectAnalytics(@Req() req: any, @Param('projectId') projectId: string) {
    const tenantId = req.user.tenantId;
    return this.timesheetsService.getAnalyticAllocationByProject(tenantId, projectId);
  }

  @Get('timesheets/analytics/grant/:grantId')
  async getGrantAnalytics(@Req() req: any, @Param('grantId') grantId: string) {
    const tenantId = req.user.tenantId;
    return this.timesheetsService.getAnalyticAllocationByGrant(tenantId, grantId);
  }

  // ---------------------------------------------------------------------------
  // HR PROFILES
  // ---------------------------------------------------------------------------
  @Get('hr-profiles')
  async findAllHrProfiles(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.timesheetsService.findAllHrProfiles(tenantId);
  }

  @Get('hr-profiles/me')
  async getMyHrProfile(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    return this.timesheetsService.getUserHrProfile(tenantId, userId);
  }

  @Patch('hr-profiles/:userId')
  async updateUserHrProfile(@Req() req: any, @Param('userId') userId: string, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const validated = UpdateUserHrProfileSchema.parse(body);
    return this.timesheetsService.updateUserHrProfile(tenantId, userId, validated);
  }
}
