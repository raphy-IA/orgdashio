import { Controller, Get, Post, Body, UseGuards, Req, Inject } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SendInvitationSchema, AcceptInvitationSchema } from '@orgdashio/shared';

@Controller('api/v1/invitations')
export class InvitationController {
  constructor(@Inject(InvitationService) private readonly invitationService: InvitationService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getInvitations(@Req() req: any) {
    return this.invitationService.getInvitations(req.tenantId);
  }

  @Post()
  @UseGuards(AuthGuard)
  async sendInvitation(@Req() req: any, @Body() body: any) {
    const parsed = SendInvitationSchema.parse(body);
    return this.invitationService.sendInvitation(req.tenantId, req.user.id, parsed);
  }

  @Post('accept')
  async acceptInvitation(@Body() body: any) {
    const parsed = AcceptInvitationSchema.parse(body);
    return this.invitationService.acceptInvitation(parsed);
  }
}
