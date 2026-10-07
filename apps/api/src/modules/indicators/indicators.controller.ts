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
  Res,
  Inject,
} from '@nestjs/common';
import { IndicatorsService } from './indicators.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  CreateIndicatorSchema,
  UpdateIndicatorSchema,
  RecordObservationSchema,
  CreateResultNodeSchema,
} from '@orgdashio/shared';

@Controller('api/v1/indicators')
@UseGuards(AuthGuard)
export class IndicatorsController {
  constructor(@Inject(IndicatorsService) private readonly indicatorsService: IndicatorsService) {}

  @Post()
  async createIndicator(@Req() req: any, @Body() body: any) {
    const parsed = CreateIndicatorSchema.parse(body);
    return this.indicatorsService.createIndicator(req.tenantId, parsed);
  }

  @Get()
  async findAllIndicators(
    @Req() req: any,
    @Query('projectId') projectId?: string,
    @Query('level') level?: string,
    @Query('status') status?: string
  ) {
    return this.indicatorsService.findAllIndicators(req.tenantId, { projectId, level, status });
  }

  @Get('dashboard')
  async getImpactDashboard(@Req() req: any) {
    return this.indicatorsService.getImpactDashboard(req.tenantId);
  }

  @Get('logframe')
  async getLogicalFrameworkMatrix(@Req() req: any, @Query('projectId') projectId?: string) {
    return this.indicatorsService.getLogicalFrameworkMatrix(req.tenantId, projectId);
  }

  @Get('donor-report')
  async getDonorReport(
    @Req() req: any,
    @Res() res: any,
    @Query('projectId') projectId?: string,
    @Query('format') format: 'json' | 'csv' = 'json'
  ) {
    if (format === 'csv') {
      const csv = await this.indicatorsService.getDonorReport(req.tenantId, projectId, 'csv');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="cadre_logique_donateur.csv"');
      return res.send(csv);
    }
    const report = await this.indicatorsService.getDonorReport(req.tenantId, projectId, 'json');
    return res.json(report);
  }

  @Get('result-nodes')
  async findAllResultNodes(@Req() req: any, @Query('projectId') projectId?: string) {
    return this.indicatorsService.findAllResultNodes(req.tenantId, projectId);
  }

  @Post('result-nodes')
  async createResultNode(@Req() req: any, @Body() body: any) {
    const parsed = CreateResultNodeSchema.parse(body);
    return this.indicatorsService.createResultNode(req.tenantId, parsed);
  }

  @Get('unique-reached-count')
  async getUniqueReachedCount(@Req() req: any) {
    const count = await this.indicatorsService.getUniqueReachedCount(req.tenantId);
    return { uniquePartiesReached: count };
  }

  @Get(':id')
  async findOneIndicator(@Req() req: any, @Param('id') id: string) {
    return this.indicatorsService.findOneIndicator(req.tenantId, id);
  }

  @Patch(':id')
  async updateIndicator(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = UpdateIndicatorSchema.parse(body);
    return this.indicatorsService.updateIndicator(req.tenantId, id, parsed);
  }

  @Delete(':id')
  async deleteIndicator(@Req() req: any, @Param('id') id: string) {
    return this.indicatorsService.deleteIndicator(req.tenantId, id);
  }

  @Post(':id/observations')
  async recordObservation(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = RecordObservationSchema.parse(body);
    return this.indicatorsService.recordObservation(req.tenantId, id, parsed);
  }
}
