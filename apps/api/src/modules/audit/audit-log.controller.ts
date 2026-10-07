import { Controller, Get, UseGuards, Req, Inject } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('api/v1/audit-logs')
@UseGuards(AuthGuard)
export class AuditLogController {
  constructor(@Inject(AuditLogService) private readonly auditLogService: AuditLogService) {}

  @Get()
  async getAuditLogs(@Req() req: any) {
    return this.auditLogService.findAll(req.tenantId);
  }
}
