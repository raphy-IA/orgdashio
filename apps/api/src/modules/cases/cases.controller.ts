import { Controller, Get, Post, Param, Body, UseGuards, Req, Inject } from '@nestjs/common';
import { CasesService } from './cases.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CreateCaseSchema, CreateCaseNoteSchema, BreakGlassSchema } from '@orgdashio/shared';

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

  @Post(':id/notes')
  async addNote(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = CreateCaseNoteSchema.parse(body);
    return this.casesService.addNote(req.tenantId, req.user.id, id, parsed);
  }

  @Post(':id/break-glass')
  async breakGlass(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = BreakGlassSchema.parse(body);
    return this.casesService.breakGlass(req.tenantId, req.user.id, id, parsed);
  }
}
