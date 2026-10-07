import { Controller, Get, Post, Param, Body, UseGuards, Req, Inject } from '@nestjs/common';
import { IndicatorsService } from './indicators.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CreateIndicatorSchema, RecordObservationSchema } from '@orgdashio/shared';

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
  async findAllIndicators(@Req() req: any) {
    return this.indicatorsService.findAllIndicators(req.tenantId);
  }

  @Get('dashboard')
  async getImpactDashboard(@Req() req: any) {
    return this.indicatorsService.getImpactDashboard(req.tenantId);
  }

  @Get('unique-reached-count')
  async getUniqueReachedCount(@Req() req: any) {
    const count = await this.indicatorsService.getUniqueReachedCount(req.tenantId);
    return { uniquePartiesReached: count };
  }

  @Post(':id/observations')
  async recordObservation(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = RecordObservationSchema.parse(body);
    return this.indicatorsService.recordObservation(req.tenantId, id, parsed);
  }
}
