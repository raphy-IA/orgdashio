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
  Res,
  Header,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { ProjectService } from './project.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  CreateProgramSchema,
  AddProjectToProgramSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  FundingSourceSchema,
  ResultNodeSchema,
  CreatePlanItemSchema,
  UpdatePlanItemSchema,
  CreateDependencySchema,
  CreateBudgetLineSchema,
  UpdateBudgetLineSchema,
  CreateExpenseSchema,
  CreateRaidItemSchema,
  UpdateRaidItemSchema,
  CreateProjectMemberSchema,
  SetPlanItemRaciSchema,
  CreatePlanItemUpdateSchema,
  CreatePlanItemDeliverableSchema,
  VerifyDeliverableSchema,
} from '@orgdashio/shared';

@Controller('api/v1/projects')
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(@Inject(ProjectService) private readonly projectService: ProjectService) {}

  @Get('programs')
  async findAllPrograms(@Req() req: any) {
    return this.projectService.findAllPrograms(req.tenantId);
  }

  @Post('programs')
  async createProgram(@Req() req: any, @Body() body: any) {
    const parsed = CreateProgramSchema.parse(body);
    return this.projectService.createProgram(req.tenantId, parsed);
  }

  @Post('programs/:id/projects')
  async addProjectToProgram(
    @Req() req: any,
    @Param('id') programId: string,
    @Body() body: any
  ) {
    const parsed = AddProjectToProgramSchema.parse(body);
    return this.projectService.addProjectToProgram(req.tenantId, programId, parsed.projectId);
  }

  @Post('programs/:id/projects/:projectId/remove')
  async removeProjectFromProgram(
    @Req() req: any,
    @Param('id') programId: string,
    @Param('projectId') projectId: string
  ) {
    return this.projectService.removeProjectFromProgram(req.tenantId, programId, projectId);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.projectService.findAll(req.tenantId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.projectService.findOne(req.tenantId, id);
  }

  @Get(':id/full')
  async getFullProject(@Req() req: any, @Param('id') id: string) {
    return this.projectService.getFullProject(req.tenantId, id);
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const parsed = CreateProjectSchema.parse(body);
    return this.projectService.create(req.tenantId, req.user.id, parsed);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = UpdateProjectSchema.parse(body);
    return this.projectService.update(req.tenantId, id, parsed);
  }

  @Post(':id/funding-sources')
  async addFundingSource(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = FundingSourceSchema.parse(body);
    return this.projectService.addFundingSource(req.tenantId, id, parsed);
  }

  @Post(':id/result-nodes')
  async addResultNode(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = ResultNodeSchema.parse(body);
    return this.projectService.addResultNode(req.tenantId, id, parsed);
  }

  @Post(':id/plan-items')
  async addPlanItem(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = CreatePlanItemSchema.parse(body);
    return this.projectService.addPlanItem(req.tenantId, id, parsed);
  }

  @Post(':id/dependencies')
  async addDependency(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = CreateDependencySchema.parse(body);
    return this.projectService.addDependency(req.tenantId, id, parsed);
  }

  @Post(':id/budget-lines')
  async addBudgetLines(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = Array.isArray(body)
      ? body.map((b) => CreateBudgetLineSchema.parse(b))
      : [CreateBudgetLineSchema.parse(body)];
    return this.projectService.addBudgetLines(req.tenantId, id, parsed);
  }

  @Patch(':id/budget-lines/:lineId')
  async updateBudgetLine(
    @Req() req: any,
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Body() body: any,
  ) {
    const parsed = UpdateBudgetLineSchema.parse(body);
    return this.projectService.updateBudgetLine(req.tenantId, id, lineId, parsed);
  }

  @Delete(':id/budget-lines/:lineId')
  async deleteBudgetLine(
    @Req() req: any,
    @Param('id') id: string,
    @Param('lineId') lineId: string,
  ) {
    return this.projectService.deleteBudgetLine(req.tenantId, id, lineId);
  }

  @Post(':id/expenses')
  async createExpense(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = CreateExpenseSchema.parse(body);
    return this.projectService.createExpense(req.tenantId, id, req.user.id, parsed);
  }

  @Patch(':id/expenses/:expenseId/approve')
  async approveExpense(
    @Req() req: any,
    @Param('id') id: string,
    @Param('expenseId') expenseId: string
  ) {
    return this.projectService.approveExpense(req.tenantId, id, expenseId, req.user.id);
  }

  @Get(':id/expenses/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="export-depenses.csv"')
  async exportExpensesCsv(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const csvContent = await this.projectService.exportExpensesCsv(req.tenantId, id);
    return res.send(csvContent);
  }

  @Post(':id/raid-items')
  async addRaidItem(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = CreateRaidItemSchema.parse(body);
    return this.projectService.addRaidItem(req.tenantId, id, parsed);
  }

  @Patch(':id/plan-items/:itemId')
  async updatePlanItem(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: any,
  ) {
    const parsed = UpdatePlanItemSchema.parse(body);
    return this.projectService.updatePlanItem(req.tenantId, id, itemId, parsed);
  }

  @Delete(':id/plan-items/:itemId')
  async deletePlanItem(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.projectService.deletePlanItem(req.tenantId, id, itemId);
  }

  @Delete(':id/result-nodes/:nodeId')
  async deleteResultNode(
    @Req() req: any,
    @Param('id') id: string,
    @Param('nodeId') nodeId: string,
  ) {
    return this.projectService.deleteResultNode(req.tenantId, id, nodeId);
  }

  @Delete(':id/funding-sources/:sourceId')
  async deleteFundingSource(
    @Req() req: any,
    @Param('id') id: string,
    @Param('sourceId') sourceId: string,
  ) {
    return this.projectService.deleteFundingSource(req.tenantId, id, sourceId);
  }

  @Patch(':id/raid-items/:itemId')
  async updateRaidItem(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: any,
  ) {
    const parsed = UpdateRaidItemSchema.parse(body);
    return this.projectService.updateRaidItem(req.tenantId, id, itemId, parsed);
  }

  @Delete(':id/raid-items/:itemId')
  async deleteRaidItem(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.projectService.deleteRaidItem(req.tenantId, id, itemId);
  }

  // --- Project Members & Stakeholders ---
  @Post(':id/members')
  async addProjectMember(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const parsed = CreateProjectMemberSchema.parse(body);
    return this.projectService.addProjectMember(req.tenantId, id, parsed);
  }

  @Post(':id/members/:memberId/remove')
  async removeProjectMember(
    @Req() req: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.projectService.removeProjectMember(req.tenantId, id, memberId);
  }

  @Post(':id/raci')
  async setPlanItemRaci(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const parsed = SetPlanItemRaciSchema.parse(body);
    return this.projectService.setPlanItemRaci(req.tenantId, id, parsed);
  }

  // --- Task Evolution, Logs & Comments ---
  @Post(':id/plan-items/:itemId/updates')
  async addPlanItemUpdate(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: any,
  ) {
    const parsed = CreatePlanItemUpdateSchema.parse(body);
    return this.projectService.addPlanItemUpdate(req.tenantId, id, itemId, parsed, req.user?.id);
  }

  // --- Deliverables & Validation ---
  @Post(':id/plan-items/:itemId/deliverables')
  async addPlanItemDeliverable(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: any,
  ) {
    const parsed = CreatePlanItemDeliverableSchema.parse(body);
    return this.projectService.addPlanItemDeliverable(req.tenantId, id, itemId, parsed);
  }

  @Patch(':id/plan-items/:itemId/deliverables/:deliverableId/verify')
  async verifyPlanItemDeliverable(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Param('deliverableId') deliverableId: string,
    @Body() body: any,
  ) {
    const parsed = VerifyDeliverableSchema.parse(body);
    return this.projectService.verifyPlanItemDeliverable(req.tenantId, id, itemId, deliverableId, parsed);
  }
}
