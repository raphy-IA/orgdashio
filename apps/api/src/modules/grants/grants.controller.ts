import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Inject,
} from '@nestjs/common';
import { GrantsService } from './grants.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  CreateFunderSchema,
  UpdateFunderSchema,
  CreateGrantSchema,
  UpdateGrantSchema,
  CreateGrantInstallmentSchema,
  UpdateGrantInstallmentSchema,
  CreateGrantDeliverableSchema,
  UpdateGrantDeliverableSchema,
} from '@orgdashio/shared';

@Controller('api/v1/grants')
@UseGuards(AuthGuard)
export class GrantsController {
  constructor(@Inject(GrantsService) private readonly grantsService: GrantsService) {}

  // --- Funders (Bailleurs de fonds institutionnels) ---
  @Get('funders')
  async findAllFunders(@Req() req: any) {
    return this.grantsService.findAllFunders(req.tenantId);
  }

  @Post('funders')
  async createFunder(@Req() req: any, @Body() body: any) {
    const parsed = CreateFunderSchema.parse(body);
    return this.grantsService.createFunder(req.tenantId, parsed);
  }

  @Get('funders/:id')
  async findOneFunder(@Req() req: any, @Param('id') id: string) {
    return this.grantsService.findOneFunder(req.tenantId, id);
  }

  @Patch('funders/:id')
  async updateFunder(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = UpdateFunderSchema.parse(body);
    return this.grantsService.updateFunder(req.tenantId, id, parsed);
  }

  @Delete('funders/:id')
  async deleteFunder(@Req() req: any, @Param('id') id: string) {
    return this.grantsService.deleteFunder(req.tenantId, id);
  }

  // --- Grants (Dossiers de subventions) ---
  @Post()
  async createGrant(@Req() req: any, @Body() body: any) {
    const parsed = CreateGrantSchema.parse(body);
    return this.grantsService.createGrant(req.tenantId, parsed);
  }

  @Get()
  async findAllGrants(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('funderType') funderType?: string
  ) {
    return this.grantsService.findAllGrants(req.tenantId, { status, projectId, funderType });
  }

  @Get('dashboard')
  async getGrantsDashboard(@Req() req: any) {
    return this.grantsService.getGrantsDashboard(req.tenantId);
  }

  @Get(':id')
  async findOneGrant(@Req() req: any, @Param('id') id: string) {
    return this.grantsService.findOneGrant(req.tenantId, id);
  }

  @Patch(':id')
  async updateGrant(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = UpdateGrantSchema.parse(body);
    return this.grantsService.updateGrant(req.tenantId, id, parsed);
  }

  @Delete(':id')
  async deleteGrant(@Req() req: any, @Param('id') id: string) {
    return this.grantsService.deleteGrant(req.tenantId, id);
  }

  // Installments
  @Post(':id/installments')
  async addInstallment(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = CreateGrantInstallmentSchema.parse(body);
    return this.grantsService.addInstallment(req.tenantId, id, parsed);
  }

  @Patch(':id/installments/:installmentId')
  async updateInstallment(
    @Req() req: any,
    @Param('installmentId') installmentId: string,
    @Body() body: any
  ) {
    const parsed = UpdateGrantInstallmentSchema.parse(body);
    return this.grantsService.updateInstallment(req.tenantId, installmentId, parsed);
  }

  @Delete(':id/installments/:installmentId')
  async deleteInstallment(@Req() req: any, @Param('installmentId') installmentId: string) {
    return this.grantsService.deleteInstallment(req.tenantId, installmentId);
  }

  // Deliverables
  @Post(':id/deliverables')
  async addDeliverable(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = CreateGrantDeliverableSchema.parse(body);
    return this.grantsService.addDeliverable(req.tenantId, id, parsed);
  }

  @Patch(':id/deliverables/:deliverableId')
  async updateDeliverable(
    @Req() req: any,
    @Param('deliverableId') deliverableId: string,
    @Body() body: any
  ) {
    const parsed = UpdateGrantDeliverableSchema.parse(body);
    return this.grantsService.updateDeliverable(req.tenantId, deliverableId, parsed);
  }

  @Delete(':id/deliverables/:deliverableId')
  async deleteDeliverable(@Req() req: any, @Param('deliverableId') deliverableId: string) {
    return this.grantsService.deleteDeliverable(req.tenantId, deliverableId);
  }
}
