import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { DonationsService } from './donations.service';
import {
  CreateDonorSchema,
  UpdateDonorSchema,
  CreateDonationCampaignSchema,
  UpdateDonationCampaignSchema,
  CreateDonationSchema,
  UpdateDonationSchema,
  IssueSingleTaxReceiptSchema,
  IssueAnnualConsolidatedTaxReceiptSchema,
  CancelTaxReceiptSchema,
} from '@orgdashio/shared';

@Controller('api/v1')
@UseGuards(AuthGuard)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  // ---------------------------------------------------------------------------
  // DONATIONS
  // ---------------------------------------------------------------------------
  @Get('donations/dashboard')
  async getDashboard(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.donationsService.getDashboardMetrics(tenantId);
  }

  @Get('donations')
  async findAllDonations(
    @Req() req: any,
    @Query('donorId') donorId?: string,
    @Query('campaignId') campaignId?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string
  ) {
    const tenantId = req.user.tenantId;
    return this.donationsService.findAllDonations(tenantId, { donorId, campaignId, projectId, status });
  }

  @Get('donations/:id')
  async findDonationById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.donationsService.findDonationById(tenantId, id);
  }

  @Post('donations')
  async createDonation(@Req() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const validated = CreateDonationSchema.parse(body);
    return this.donationsService.createDonation(tenantId, validated);
  }

  @Patch('donations/:id')
  async updateDonation(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const validated = UpdateDonationSchema.parse(body);
    return this.donationsService.updateDonation(tenantId, id, validated);
  }

  @Delete('donations/:id')
  async deleteDonation(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.donationsService.deleteDonation(tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // DONORS
  // ---------------------------------------------------------------------------
  @Get('donors')
  async findAllDonors(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.donationsService.findAllDonors(tenantId);
  }

  @Get('donors/:id')
  async findDonorById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.donationsService.findDonorById(tenantId, id);
  }

  @Post('donors')
  async createDonor(@Req() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const validated = CreateDonorSchema.parse(body);
    return this.donationsService.createDonor(tenantId, validated);
  }

  @Patch('donors/:id')
  async updateDonor(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const validated = UpdateDonorSchema.parse(body);
    return this.donationsService.updateDonor(tenantId, id, validated);
  }

  @Delete('donors/:id')
  async deleteDonor(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.donationsService.deleteDonor(tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // CAMPAIGNS
  // ---------------------------------------------------------------------------
  @Get('campaigns')
  async findAllCampaigns(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.donationsService.findAllCampaigns(tenantId);
  }

  @Get('campaigns/:id')
  async findCampaignById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.donationsService.findCampaignById(tenantId, id);
  }

  @Post('campaigns')
  async createCampaign(@Req() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const validated = CreateDonationCampaignSchema.parse(body);
    return this.donationsService.createCampaign(tenantId, validated);
  }

  @Patch('campaigns/:id')
  async updateCampaign(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const validated = UpdateDonationCampaignSchema.parse(body);
    return this.donationsService.updateCampaign(tenantId, id, validated);
  }

  @Delete('campaigns/:id')
  async deleteCampaign(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.donationsService.deleteCampaign(tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // CRA / ARC TAX RECEIPTS
  // ---------------------------------------------------------------------------
  @Get('tax-receipts')
  async findAllTaxReceipts(@Req() req: any, @Query('year') year?: string) {
    const tenantId = req.user.tenantId;
    const parsedYear = year ? parseInt(year, 10) : undefined;
    return this.donationsService.findAllTaxReceipts(tenantId, parsedYear);
  }

  @Get('tax-receipts/:id')
  async getTaxReceiptById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.donationsService.getTaxReceiptById(tenantId, id);
  }

  @Post('tax-receipts/single')
  async issueSingleReceipt(@Req() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const validated = IssueSingleTaxReceiptSchema.parse(body);
    return this.donationsService.issueSingleReceipt(tenantId, validated);
  }

  @Post('tax-receipts/consolidated')
  async issueConsolidatedReceipt(@Req() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const validated = IssueAnnualConsolidatedTaxReceiptSchema.parse(body);
    return this.donationsService.issueAnnualConsolidatedReceipt(tenantId, validated);
  }

  @Post('tax-receipts/:id/cancel')
  async cancelTaxReceipt(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const validated = CancelTaxReceiptSchema.parse(body);
    return this.donationsService.cancelTaxReceipt(tenantId, id, validated);
  }
}
