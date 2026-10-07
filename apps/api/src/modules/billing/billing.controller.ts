import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Inject,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  ChangePlanSchema,
  UpdatePaymentMethodSchema,
} from '@orgdashio/shared';

@Controller('api/v1/billing')
@UseGuards(AuthGuard)
export class BillingController {
  constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Get('plans')
  async getAvailablePlans() {
    return this.billingService.getAvailablePlans();
  }

  @Get('subscription')
  async getTenantSubscription(@Req() req: any) {
    return this.billingService.getTenantSubscriptionWithUsage(req.tenantId);
  }

  @Post('change-plan')
  async changePlan(@Req() req: any, @Body() body: any) {
    const parsed = ChangePlanSchema.parse(body);
    return this.billingService.changePlan(req.tenantId, parsed);
  }

  @Post('payment-method')
  async updatePaymentMethod(@Req() req: any, @Body() body: any) {
    const parsed = UpdatePaymentMethodSchema.parse(body);
    return this.billingService.updatePaymentMethod(req.tenantId, parsed);
  }

  @Get('invoices')
  async getInvoices(@Req() req: any) {
    return this.billingService.getTenantInvoices(req.tenantId);
  }

  @Get('platform-metrics')
  async getPlatformBillingMetrics() {
    return this.billingService.getPlatformBillingMetrics();
  }
}
