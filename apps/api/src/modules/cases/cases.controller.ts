import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Inject,
} from '@nestjs/common';
import { CasesService } from './cases.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  CreateCaseSchema,
  CreateCaseNoteSchema,
  BreakGlassSchema,
  CreateInterventionPlanSchema,
  CreateInterventionGoalSchema,
  UpdateInterventionGoalSchema,
  CreateCaseReferralSchema,
  AssignCaseWorkerSchema,
} from '@orgdashio/shared';

@Controller('api/v1/cases')
@UseGuards(AuthGuard)
export class CasesController {
  constructor(@Inject(CasesService) private readonly casesService: CasesService) {}

  @Post()
  async createCase(@Req() req: any, @Body() body: any) {
    const parsed = CreateCaseSchema.parse(body);
    return this.casesService.createCase(req.tenantId, req.user.id, parsed);
  }

  @Get()
  async findAllCases(@Req() req: any) {
    return this.casesService.findAllCases(req.tenantId, req.user.id);
  }

  @Get(':id')
  async findOneCase(@Req() req: any, @Param('id') id: string) {
    return this.casesService.findOneCase(req.tenantId, req.user.id, id);
  }

  @Patch(':id')
  async updateCase(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.casesService.updateCase(req.tenantId, id, body);
  }

  @Post(':id/notes')
  async addNote(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = CreateCaseNoteSchema.parse(body);
    return this.casesService.addNote(req.tenantId, req.user.id, id, parsed);
  }

  @Post(':id/assignments')
  async assignWorker(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = AssignCaseWorkerSchema.parse(body);
    return this.casesService.assignWorker(req.tenantId, id, parsed);
  }

  @Delete(':id/assignments/:assignmentId')
  async removeWorker(@Req() req: any, @Param('id') id: string, @Param('assignmentId') assignmentId: string) {
    return this.casesService.removeWorker(req.tenantId, id, assignmentId);
  }

  // --- Intervention Plans & Goals ---
  @Post(':id/intervention-plans')
  async createInterventionPlan(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = CreateInterventionPlanSchema.parse(body);
    return this.casesService.createInterventionPlan(req.tenantId, req.user.id, id, parsed);
  }

  @Patch(':id/intervention-plans/:planId')
  async updateInterventionPlan(
    @Req() req: any,
    @Param('id') id: string,
    @Param('planId') planId: string,
    @Body() body: any
  ) {
    return this.casesService.updateInterventionPlan(req.tenantId, id, planId, body);
  }

  @Post(':id/intervention-plans/:planId/goals')
  async addInterventionGoal(
    @Req() req: any,
    @Param('id') id: string,
    @Param('planId') planId: string,
    @Body() body: any
  ) {
    const parsed = CreateInterventionGoalSchema.parse(body);
    return this.casesService.addInterventionGoal(req.tenantId, id, planId, parsed);
  }

  @Patch(':id/goals/:goalId')
  async updateInterventionGoal(
    @Req() req: any,
    @Param('id') id: string,
    @Param('goalId') goalId: string,
    @Body() body: any
  ) {
    const parsed = UpdateInterventionGoalSchema.parse(body);
    return this.casesService.updateInterventionGoal(req.tenantId, id, goalId, parsed);
  }

  @Delete(':id/goals/:goalId')
  async deleteInterventionGoal(@Req() req: any, @Param('id') id: string, @Param('goalId') goalId: string) {
    return this.casesService.deleteInterventionGoal(req.tenantId, id, goalId);
  }

  // --- External Referrals ---
  @Post(':id/referrals')
  async createReferral(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = CreateCaseReferralSchema.parse(body);
    return this.casesService.createReferral(req.tenantId, id, parsed);
  }

  @Patch(':id/referrals/:referralId')
  async updateReferral(
    @Req() req: any,
    @Param('id') id: string,
    @Param('referralId') referralId: string,
    @Body() body: any
  ) {
    return this.casesService.updateReferral(req.tenantId, id, referralId, body);
  }

  @Post(':id/break-glass')
  async breakGlass(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = BreakGlassSchema.parse(body);
    return this.casesService.breakGlass(req.tenantId, req.user.id, id, parsed);
  }
}
