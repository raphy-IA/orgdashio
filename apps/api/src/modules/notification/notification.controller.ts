import { Controller, Get, Patch, Delete, Param, UseGuards, Req, Inject } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('api/v1/notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(@Inject(NotificationService) private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(@Req() req: any) {
    return this.notificationService.findForUser(req.tenantId, req.user.id);
  }

  @Get('announcements')
  async getAnnouncements(@Req() req: any) {
    return this.notificationService.getActiveAnnouncements(req.tenantId);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.tenantId, req.user.id);
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(req.tenantId, req.user.id, id);
  }

  @Delete('read')
  async clearAllRead(@Req() req: any) {
    return this.notificationService.clearAllRead(req.tenantId, req.user.id);
  }

  @Delete(':id')
  async deleteNotification(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.remove(req.tenantId, req.user.id, id);
  }
}
