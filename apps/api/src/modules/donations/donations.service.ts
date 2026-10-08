import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  withTenantContext,
  donor,
  donationCampaign,
  donation,
  taxReceipt,
  tenantRegistry,
  project,
  CreateDonorInput,
  UpdateDonorInput,
  CreateDonationCampaignInput,
  UpdateDonationCampaignInput,
  CreateDonationInput,
  UpdateDonationInput,
  IssueSingleTaxReceiptInput,
  IssueAnnualConsolidatedTaxReceiptInput,
  CancelTaxReceiptInput,
} from '@orgdashio/shared';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  calculateEligibleAmount,
  formatCraReceiptNumber,
  formatDonationNumber,
  validateCraCompliance,
  calculateDonationKPIs,
} from './donations.utils';

@Injectable()
export class DonationsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  // ---------------------------------------------------------------------------
  // DONORS
  // ---------------------------------------------------------------------------
  async findAllDonors(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const donors = await tx
        .select()
        .from(donor)
        .where(eq(donor.tenantId, tenantId))
        .orderBy(desc(donor.createdAt));

      // Attach donation statistics for each donor
      const donations = await tx
        .select({
          donorId: donation.donorId,
          grossAmount: donation.grossAmount,
          status: donation.status,
        })
        .from(donation)
        .where(and(eq(donation.tenantId, tenantId), eq(donation.status, 'received')));

      const donorStats = donations.reduce((acc: Record<string, { totalGiven: number; count: number }>, d: any) => {
        if (!acc[d.donorId]) {
          acc[d.donorId] = { totalGiven: 0, count: 0 };
        }
        acc[d.donorId].totalGiven += Number(d.grossAmount || 0);
        acc[d.donorId].count += 1;
        return acc;
      }, {});

      return donors.map((d: any) => ({
        ...d,
        displayName:
          d.type === 'organization'
            ? d.companyName || 'Organisation sans nom'
            : d.type === 'anonymous'
            ? 'Donateur Anonyme'
            : `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Particulier sans nom',
        totalGiven: donorStats[d.id]?.totalGiven || 0,
        donationCount: donorStats[d.id]?.count || 0,
      }));
    });
  }

  async findDonorById(tenantId: string, donorId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [d] = await tx
        .select()
        .from(donor)
        .where(and(eq(donor.tenantId, tenantId), eq(donor.id, donorId)));

      if (!d) throw new NotFoundException('Donateur introuvable.');

      const donorDonations = await tx
        .select()
        .from(donation)
        .where(and(eq(donation.tenantId, tenantId), eq(donation.donorId, donorId)))
        .orderBy(desc(donation.donationDate));

      const donorReceipts = await tx
        .select()
        .from(taxReceipt)
        .where(and(eq(taxReceipt.tenantId, tenantId), eq(taxReceipt.donorId, donorId)))
        .orderBy(desc(taxReceipt.issueDate));

      const displayName =
        d.type === 'organization'
          ? d.companyName || 'Organisation sans nom'
          : d.type === 'anonymous'
          ? 'Donateur Anonyme'
          : `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Particulier sans nom';

      const totalGiven = donorDonations
        .filter((don: any) => don.status === 'received')
        .reduce((sum: number, don: any) => sum + Number(don.grossAmount || 0), 0);

      return {
        ...d,
        displayName,
        totalGiven,
        donations: donorDonations,
        taxReceipts: donorReceipts,
      };
    });
  }

  async createDonor(tenantId: string, input: CreateDonorInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [created] = await tx
        .insert(donor)
        .values({
          tenantId,
          type: input.type,
          firstName: input.firstName || null,
          lastName: input.lastName || null,
          companyName: input.companyName || null,
          email: input.email || null,
          phone: input.phone || null,
          taxAddress: input.taxAddress || null,
          taxCity: input.taxCity || null,
          taxStateProvince: input.taxStateProvince || 'QC',
          taxPostalCode: input.taxPostalCode || null,
          taxCountry: input.taxCountry || 'Canada',
          notes: input.notes || null,
        })
        .returning();

      return created;
    });
  }

  async updateDonor(tenantId: string, donorId: string, input: UpdateDonorInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(donor)
        .where(and(eq(donor.tenantId, tenantId), eq(donor.id, donorId)));

      if (!existing) throw new NotFoundException('Donateur introuvable.');

      const [updated] = await tx
        .update(donor)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(and(eq(donor.tenantId, tenantId), eq(donor.id, donorId)))
        .returning();

      return updated;
    });
  }

  async deleteDonor(tenantId: string, donorId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(donor)
        .where(and(eq(donor.tenantId, tenantId), eq(donor.id, donorId)));

      if (!existing) throw new NotFoundException('Donateur introuvable.');

      await tx.delete(donor).where(and(eq(donor.tenantId, tenantId), eq(donor.id, donorId)));
      return { success: true, message: 'Donateur supprimé avec succès.' };
    });
  }

  // ---------------------------------------------------------------------------
  // CAMPAIGNS
  // ---------------------------------------------------------------------------
  async findAllCampaigns(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const campaigns = await tx
        .select()
        .from(donationCampaign)
        .where(eq(donationCampaign.tenantId, tenantId))
        .orderBy(desc(donationCampaign.createdAt));

      // Calculate actual collected amount per campaign
      const donations = await tx
        .select({
          campaignId: donation.campaignId,
          grossAmount: donation.grossAmount,
        })
        .from(donation)
        .where(and(eq(donation.tenantId, tenantId), eq(donation.status, 'received')));

      const collectedMap = donations.reduce((acc: Record<string, number>, d: any) => {
        if (d.campaignId) {
          acc[d.campaignId] = (acc[d.campaignId] || 0) + Number(d.grossAmount || 0);
        }
        return acc;
      }, {});

      return campaigns.map((c: any) => ({
        ...c,
        targetAmount: Number(c.targetAmount || 0),
        collectedAmount: collectedMap[c.id] || Number(c.collectedAmount || 0),
        progressPct:
          Number(c.targetAmount || 0) > 0
            ? Math.min(100, Math.round(((collectedMap[c.id] || 0) / Number(c.targetAmount)) * 100))
            : 0,
      }));
    });
  }

  async findCampaignById(tenantId: string, campaignId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [c] = await tx
        .select()
        .from(donationCampaign)
        .where(and(eq(donationCampaign.tenantId, tenantId), eq(donationCampaign.id, campaignId)));

      if (!c) throw new NotFoundException('Campagne introuvable.');

      const campaignDonations = await tx
        .select()
        .from(donation)
        .where(and(eq(donation.tenantId, tenantId), eq(donation.campaignId, campaignId)))
        .orderBy(desc(donation.donationDate));

      const totalCollected = campaignDonations
        .filter((d: any) => d.status === 'received')
        .reduce((sum: number, d: any) => sum + Number(d.grossAmount || 0), 0);

      return {
        ...c,
        targetAmount: Number(c.targetAmount || 0),
        collectedAmount: totalCollected,
        progressPct:
          Number(c.targetAmount || 0) > 0
            ? Math.min(100, Math.round((totalCollected / Number(c.targetAmount)) * 100))
            : 0,
        donations: campaignDonations,
      };
    });
  }

  async createCampaign(tenantId: string, input: CreateDonationCampaignInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [created] = await tx
        .insert(donationCampaign)
        .values({
          tenantId,
          code: input.code.toUpperCase(),
          name: input.name,
          description: input.description || null,
          targetAmount: input.targetAmount ? input.targetAmount.toString() : null,
          startDate: input.startDate || null,
          endDate: input.endDate || null,
          status: input.status,
          projectId: input.projectId || null,
        })
        .returning();

      return created;
    });
  }

  async updateCampaign(tenantId: string, campaignId: string, input: UpdateDonationCampaignInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(donationCampaign)
        .where(and(eq(donationCampaign.tenantId, tenantId), eq(donationCampaign.id, campaignId)));

      if (!existing) throw new NotFoundException('Campagne introuvable.');

      const [updated] = await tx
        .update(donationCampaign)
        .set({
          ...(input.code ? { code: input.code.toUpperCase() } : {}),
          ...(input.name ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.targetAmount !== undefined ? { targetAmount: input.targetAmount?.toString() } : {}),
          ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
          ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(donationCampaign.tenantId, tenantId), eq(donationCampaign.id, campaignId)))
        .returning();

      return updated;
    });
  }

  async deleteCampaign(tenantId: string, campaignId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(donationCampaign)
        .where(and(eq(donationCampaign.tenantId, tenantId), eq(donationCampaign.id, campaignId)));

      if (!existing) throw new NotFoundException('Campagne introuvable.');

      await tx
        .delete(donationCampaign)
        .where(and(eq(donationCampaign.tenantId, tenantId), eq(donationCampaign.id, campaignId)));
      return { success: true, message: 'Campagne supprimée avec succès.' };
    });
  }

  // ---------------------------------------------------------------------------
  // DONATIONS
  // ---------------------------------------------------------------------------
  async findAllDonations(
    tenantId: string,
    filters?: { donorId?: string; campaignId?: string; projectId?: string; status?: string }
  ) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const conditions = [eq(donation.tenantId, tenantId)];

      if (filters?.donorId) conditions.push(eq(donation.donorId, filters.donorId));
      if (filters?.campaignId) conditions.push(eq(donation.campaignId, filters.campaignId));
      if (filters?.projectId) conditions.push(eq(donation.projectId, filters.projectId));
      if (filters?.status) conditions.push(eq(donation.status, filters.status as any));

      const donations = await tx
        .select({
          id: donation.id,
          donationNumber: donation.donationNumber,
          donationDate: donation.donationDate,
          grossAmount: donation.grossAmount,
          advantageAmount: donation.advantageAmount,
          eligibleAmount: donation.eligibleAmount,
          currency: donation.currency,
          paymentMethod: donation.paymentMethod,
          paymentReference: donation.paymentReference,
          recurrence: donation.recurrence,
          status: donation.status,
          isTaxReceiptEligible: donation.isTaxReceiptEligible,
          taxReceiptId: donation.taxReceiptId,
          notes: donation.notes,
          donorId: donation.donorId,
          donorType: donor.type,
          donorFirstName: donor.firstName,
          donorLastName: donor.lastName,
          donorCompanyName: donor.companyName,
          donorEmail: donor.email,
          campaignId: donation.campaignId,
          campaignName: donationCampaign.name,
          projectId: donation.projectId,
          projectName: project.name,
          createdAt: donation.createdAt,
        })
        .from(donation)
        .leftJoin(donor, eq(donation.donorId, donor.id))
        .leftJoin(donationCampaign, eq(donation.campaignId, donationCampaign.id))
        .leftJoin(project, eq(donation.projectId, project.id))
        .where(and(...conditions))
        .orderBy(desc(donation.donationDate));

      return donations.map((d: any) => {
        const donorName =
          d.donorType === 'organization'
            ? d.donorCompanyName || 'Organisation sans nom'
            : d.donorType === 'anonymous'
            ? 'Donateur Anonyme'
            : `${d.donorFirstName || ''} ${d.donorLastName || ''}`.trim() || 'Donateur';

        return {
          ...d,
          grossAmount: Number(d.grossAmount),
          advantageAmount: Number(d.advantageAmount || 0),
          eligibleAmount: Number(d.eligibleAmount),
          donorName,
        };
      });
    });
  }

  async findDonationById(tenantId: string, donationId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [d] = await tx
        .select({
          donation: donation,
          donor: donor,
          campaign: donationCampaign,
          project: project,
        })
        .from(donation)
        .leftJoin(donor, eq(donation.donorId, donor.id))
        .leftJoin(donationCampaign, eq(donation.campaignId, donationCampaign.id))
        .leftJoin(project, eq(donation.projectId, project.id))
        .where(and(eq(donation.tenantId, tenantId), eq(donation.id, donationId)));

      if (!d) throw new NotFoundException('Don introuvable.');

      let receiptData = null;
      if (d.donation.taxReceiptId) {
        const [r] = await tx
          .select()
          .from(taxReceipt)
          .where(and(eq(taxReceipt.tenantId, tenantId), eq(taxReceipt.id, d.donation.taxReceiptId)));
        receiptData = r || null;
      }

      const donorName =
        d.donor?.type === 'organization'
          ? d.donor.companyName || 'Organisation sans nom'
          : d.donor?.type === 'anonymous'
          ? 'Donateur Anonyme'
          : `${d.donor?.firstName || ''} ${d.donor?.lastName || ''}`.trim() || 'Donateur';

      return {
        ...d.donation,
        grossAmount: Number(d.donation.grossAmount),
        advantageAmount: Number(d.donation.advantageAmount || 0),
        eligibleAmount: Number(d.donation.eligibleAmount),
        donor: d.donor ? { ...d.donor, displayName: donorName } : null,
        campaign: d.campaign || null,
        project: d.project || null,
        taxReceipt: receiptData,
      };
    });
  }

  async createDonation(tenantId: string, input: CreateDonationInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      // Verify Donor
      const [donorObj] = await tx
        .select()
        .from(donor)
        .where(and(eq(donor.tenantId, tenantId), eq(donor.id, input.donorId)));

      if (!donorObj) throw new NotFoundException('Donateur introuvable.');

      // Count existing donations to generate sequential donation number
      const allTenantDonations = await tx
        .select({ id: donation.id })
        .from(donation)
        .where(eq(donation.tenantId, tenantId));

      const currentYear = new Date().getFullYear();
      const nextSeq = allTenantDonations.length + 1;
      const donationNumber = formatDonationNumber(currentYear, nextSeq);

      // Calculate Eligible Amount according to CRA rules
      const eligibleAmount = calculateEligibleAmount(input.grossAmount, input.advantageAmount || 0);

      const [newDonation] = await tx
        .insert(donation)
        .values({
          tenantId,
          donorId: input.donorId,
          campaignId: input.campaignId || null,
          projectId: input.projectId || null,
          donationNumber,
          donationDate: input.donationDate ? new Date(input.donationDate) : new Date(),
          grossAmount: input.grossAmount.toString(),
          advantageAmount: (input.advantageAmount || 0).toString(),
          eligibleAmount: eligibleAmount.toString(),
          currency: input.currency || 'CAD',
          paymentMethod: input.paymentMethod || 'interac',
          paymentReference: input.paymentReference || null,
          recurrence: input.recurrence || 'one_time',
          status: input.status || 'received',
          isTaxReceiptEligible: input.isTaxReceiptEligible ?? true,
          notes: input.notes || null,
        })
        .returning();

      // Auto-generate tax receipt if requested and eligible
      if (
        input.generateReceiptNow &&
        newDonation.status === 'received' &&
        newDonation.isTaxReceiptEligible &&
        eligibleAmount > 0
      ) {
        try {
          const receipt = await this.issueSingleReceipt(tenantId, {
            donationId: newDonation.id,
            locationIssued: input.locationIssued || 'Montréal, QC',
            authorizedSignatoryName: input.authorizedSignatoryName || 'Direction Générale',
          });
          return {
            ...newDonation,
            taxReceipt: receipt,
          };
        } catch (err) {
          console.warn('Auto-receipt generation failed:', err);
        }
      }

      return newDonation;
    });
  }

  async updateDonation(tenantId: string, donationId: string, input: UpdateDonationInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(donation)
        .where(and(eq(donation.tenantId, tenantId), eq(donation.id, donationId)));

      if (!existing) throw new NotFoundException('Don introuvable.');

      const newGross = input.grossAmount !== undefined ? input.grossAmount : Number(existing.grossAmount);
      const newAdvantage =
        input.advantageAmount !== undefined ? input.advantageAmount : Number(existing.advantageAmount || 0);
      const newEligible = calculateEligibleAmount(newGross, newAdvantage);

      const [updated] = await tx
        .update(donation)
        .set({
          ...(input.campaignId !== undefined ? { campaignId: input.campaignId } : {}),
          ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
          ...(input.donationDate ? { donationDate: new Date(input.donationDate) } : {}),
          ...(input.grossAmount !== undefined ? { grossAmount: newGross.toString() } : {}),
          ...(input.advantageAmount !== undefined ? { advantageAmount: newAdvantage.toString() } : {}),
          eligibleAmount: newEligible.toString(),
          ...(input.paymentMethod ? { paymentMethod: input.paymentMethod } : {}),
          ...(input.paymentReference !== undefined ? { paymentReference: input.paymentReference } : {}),
          ...(input.recurrence ? { recurrence: input.recurrence } : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(input.isTaxReceiptEligible !== undefined ? { isTaxReceiptEligible: input.isTaxReceiptEligible } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(donation.tenantId, tenantId), eq(donation.id, donationId)))
        .returning();

      return updated;
    });
  }

  async deleteDonation(tenantId: string, donationId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(donation)
        .where(and(eq(donation.tenantId, tenantId), eq(donation.id, donationId)));

      if (!existing) throw new NotFoundException('Don introuvable.');

      await tx.delete(donation).where(and(eq(donation.tenantId, tenantId), eq(donation.id, donationId)));
      return { success: true, message: 'Don supprimé avec succès.' };
    });
  }

  // ---------------------------------------------------------------------------
  // CRA / ARC OFFICIAL TAX RECEIPTS
  // ---------------------------------------------------------------------------
  async findAllTaxReceipts(tenantId: string, year?: number) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const conditions = [eq(taxReceipt.tenantId, tenantId)];
      if (year) conditions.push(eq(taxReceipt.taxYear, year));

      const receipts = await tx
        .select({
          receipt: taxReceipt,
          donor: donor,
        })
        .from(taxReceipt)
        .leftJoin(donor, eq(taxReceipt.donorId, donor.id))
        .where(and(...conditions))
        .orderBy(desc(taxReceipt.issueDate));

      return receipts.map((r: any) => {
        const donorName =
          r.donor?.type === 'organization'
            ? r.donor.companyName || 'Organisation sans nom'
            : r.donor?.type === 'anonymous'
            ? 'Donateur Anonyme'
            : `${r.donor?.firstName || ''} ${r.donor?.lastName || ''}`.trim() || 'Donateur';

        return {
          ...r.receipt,
          totalReceivedAmount: Number(r.receipt.totalReceivedAmount),
          totalAdvantageAmount: Number(r.receipt.totalAdvantageAmount || 0),
          totalEligibleAmount: Number(r.receipt.totalEligibleAmount),
          donorName,
          donorEmail: r.donor?.email,
        };
      });
    });
  }

  async getTaxReceiptById(tenantId: string, receiptId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [r] = await tx
        .select({
          receipt: taxReceipt,
          donor: donor,
        })
        .from(taxReceipt)
        .leftJoin(donor, eq(taxReceipt.donorId, donor.id))
        .where(and(eq(taxReceipt.tenantId, tenantId), eq(taxReceipt.id, receiptId)));

      if (!r) throw new NotFoundException('Reçu fiscal introuvable.');

      // Find linked donations
      const linkedDonations = await tx
        .select()
        .from(donation)
        .where(and(eq(donation.tenantId, tenantId), eq(donation.taxReceiptId, receiptId)));

      const [tenant] = await tx
        .select()
        .from(tenantRegistry)
        .where(eq(tenantRegistry.id, tenantId));

      const donorName =
        r.donor?.type === 'organization'
          ? r.donor.companyName || 'Organisation sans nom'
          : r.donor?.type === 'anonymous'
          ? 'Donateur Anonyme'
          : `${r.donor?.firstName || ''} ${r.donor?.lastName || ''}`.trim() || 'Donateur';

      return {
        ...r.receipt,
        totalReceivedAmount: Number(r.receipt.totalReceivedAmount),
        totalAdvantageAmount: Number(r.receipt.totalAdvantageAmount || 0),
        totalEligibleAmount: Number(r.receipt.totalEligibleAmount),
        donor: r.donor ? { ...r.donor, displayName: donorName } : null,
        organization: {
          name: tenant?.name || 'Organisme de bienfaisance',
          address: tenant?.address || '1000 Rue Sainte-Catherine Ouest, Montréal, QC H3B 1A1',
          charityNumber: tenant?.neqNumber || r.receipt.charityRegistrationNumber,
        },
        donations: linkedDonations.map((don: any) => ({
          ...don,
          grossAmount: Number(don.grossAmount),
          advantageAmount: Number(don.advantageAmount || 0),
          eligibleAmount: Number(don.eligibleAmount),
        })),
      };
    });
  }

  async issueSingleReceipt(tenantId: string, input: IssueSingleTaxReceiptInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      // 1. Fetch Donation
      const [don] = await tx
        .select()
        .from(donation)
        .where(and(eq(donation.tenantId, tenantId), eq(donation.id, input.donationId)));

      if (!don) throw new NotFoundException('Don introuvable.');
      if (don.status !== 'received') {
        throw new BadRequestException('Seuls les dons avec statut "Reçu" peuvent faire l\'objet d\'un reçu fiscal.');
      }
      if (don.taxReceiptId) {
        throw new BadRequestException('Ce don a déjà fait l\'objet d\'un reçu fiscal officiel.');
      }
      if (!don.isTaxReceiptEligible) {
        throw new BadRequestException('Ce don est marqué comme non admissible au reçu fiscal.');
      }

      const eligibleAmount = Number(don.eligibleAmount);
      if (eligibleAmount <= 0) {
        throw new BadRequestException('Le montant admissible du don doit être supérieur à zéro.');
      }

      // 2. Fetch Donor & Tenant info for CRA requirements
      const [donorObj] = await tx
        .select()
        .from(donor)
        .where(and(eq(donor.tenantId, tenantId), eq(donor.id, don.donorId)));

      if (!donorObj) throw new NotFoundException('Donateur introuvable.');

      const [tenant] = await tx
        .select()
        .from(tenantRegistry)
        .where(eq(tenantRegistry.id, tenantId));

      const charityNumber = tenant?.neqNumber || '123456789RR0001';
      const donDate = new Date(don.donationDate);
      const taxYear = donDate.getFullYear();

      const donorName =
        donorObj.type === 'organization'
          ? donorObj.companyName || 'Organisation'
          : donorObj.type === 'anonymous'
          ? 'Donateur Anonyme'
          : `${donorObj.firstName || ''} ${donorObj.lastName || ''}`.trim();

      // 3. CRA Compliance Validation
      const compliance = validateCraCompliance({
        charityRegistrationNumber: charityNumber,
        locationIssued: input.locationIssued,
        authorizedSignatoryName: input.authorizedSignatoryName,
        totalEligibleAmount: eligibleAmount,
        donorName,
        donorTaxAddress: donorObj.taxAddress,
      });

      if (!compliance.isValid) {
        throw new BadRequestException(`Non-conformité ARC : ${compliance.errors.join(' ')}`);
      }

      // 4. Generate sequential CRA receipt number
      const existingReceipts = await tx
        .select({ id: taxReceipt.id })
        .from(taxReceipt)
        .where(and(eq(taxReceipt.tenantId, tenantId), eq(taxReceipt.taxYear, taxYear)));

      const nextSeq = existingReceipts.length + 1;
      const receiptNumber = formatCraReceiptNumber(taxYear, nextSeq);

      // 5. Create Tax Receipt & Link to Donation
      const [newReceipt] = await tx
        .insert(taxReceipt)
        .values({
          tenantId,
          receiptNumber,
          donorId: donorObj.id,
          type: 'single_donation',
          taxYear,
          issueDate: new Date().toISOString().substring(0, 10),
          locationIssued: input.locationIssued,
          totalReceivedAmount: don.grossAmount,
          totalAdvantageAmount: don.advantageAmount,
          totalEligibleAmount: don.eligibleAmount,
          charityRegistrationNumber: charityNumber,
          status: 'issued',
          authorizedSignatoryName: input.authorizedSignatoryName,
          donorSnapshot: {
            donorName,
            taxAddress: donorObj.taxAddress || '',
            taxCity: donorObj.taxCity || '',
            taxStateProvince: donorObj.taxStateProvince || 'QC',
            taxPostalCode: donorObj.taxPostalCode || '',
            taxCountry: donorObj.taxCountry || 'Canada',
          },
        })
        .returning();

      await tx
        .update(donation)
        .set({ taxReceiptId: newReceipt.id, updatedAt: new Date() })
        .where(and(eq(donation.tenantId, tenantId), eq(donation.id, don.id)));

      return newReceipt;
    });
  }

  async issueAnnualConsolidatedReceipt(tenantId: string, input: IssueAnnualConsolidatedTaxReceiptInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      // 1. Fetch Donor & unreceipted donations for specified tax year
      const [donorObj] = await tx
        .select()
        .from(donor)
        .where(and(eq(donor.tenantId, tenantId), eq(donor.id, input.donorId)));

      if (!donorObj) throw new NotFoundException('Donateur introuvable.');

      const yearStart = new Date(input.taxYear, 0, 1);
      const yearEnd = new Date(input.taxYear, 11, 31, 23, 59, 59);

      const eligibleDonations = await tx
        .select()
        .from(donation)
        .where(
          and(
            eq(donation.tenantId, tenantId),
            eq(donation.donorId, input.donorId),
            eq(donation.status, 'received'),
            eq(donation.isTaxReceiptEligible, true),
            sql`${donation.taxReceiptId} IS NULL`,
            sql`${donation.donationDate} >= ${yearStart} AND ${donation.donationDate} <= ${yearEnd}`
          )
        );

      if (eligibleDonations.length === 0) {
        throw new BadRequestException(
          `Aucun don reçu non encore visé par un reçu n'a été trouvé pour ce donateur pour l'année fiscale ${input.taxYear}.`
        );
      }

      const totalGross = eligibleDonations.reduce((sum: number, d: any) => sum + Number(d.grossAmount), 0);
      const totalAdvantage = eligibleDonations.reduce((sum: number, d: any) => sum + Number(d.advantageAmount || 0), 0);
      const totalEligible = eligibleDonations.reduce((sum: number, d: any) => sum + Number(d.eligibleAmount), 0);

      if (totalEligible <= 0) {
        throw new BadRequestException('Le montant admissible total consolidé doit être supérieur à zéro.');
      }

      const [tenant] = await tx
        .select()
        .from(tenantRegistry)
        .where(eq(tenantRegistry.id, tenantId));

      const charityNumber = tenant?.neqNumber || '123456789RR0001';

      const donorName =
        donorObj.type === 'organization'
          ? donorObj.companyName || 'Organisation'
          : donorObj.type === 'anonymous'
          ? 'Donateur Anonyme'
          : `${donorObj.firstName || ''} ${donorObj.lastName || ''}`.trim();

      // Sequential receipt number
      const existingReceipts = await tx
        .select({ id: taxReceipt.id })
        .from(taxReceipt)
        .where(and(eq(taxReceipt.tenantId, tenantId), eq(taxReceipt.taxYear, input.taxYear)));

      const nextSeq = existingReceipts.length + 1;
      const receiptNumber = formatCraReceiptNumber(input.taxYear, nextSeq);

      // Create consolidated receipt
      const [newReceipt] = await tx
        .insert(taxReceipt)
        .values({
          tenantId,
          receiptNumber,
          donorId: donorObj.id,
          type: 'annual_consolidated',
          taxYear: input.taxYear,
          issueDate: new Date().toISOString().substring(0, 10),
          locationIssued: input.locationIssued,
          totalReceivedAmount: totalGross.toString(),
          totalAdvantageAmount: totalAdvantage.toString(),
          totalEligibleAmount: totalEligible.toString(),
          charityRegistrationNumber: charityNumber,
          status: 'issued',
          authorizedSignatoryName: input.authorizedSignatoryName,
          donorSnapshot: {
            donorName,
            taxAddress: donorObj.taxAddress || '',
            taxCity: donorObj.taxCity || '',
            taxStateProvince: donorObj.taxStateProvince || 'QC',
            taxPostalCode: donorObj.taxPostalCode || '',
            taxCountry: donorObj.taxCountry || 'Canada',
          },
        })
        .returning();

      // Link all donations to this receipt
      for (const d of eligibleDonations) {
        await tx
          .update(donation)
          .set({ taxReceiptId: newReceipt.id, updatedAt: new Date() })
          .where(and(eq(donation.tenantId, tenantId), eq(donation.id, d.id)));
      }

      return newReceipt;
    });
  }

  async cancelTaxReceipt(tenantId: string, receiptId: string, input: CancelTaxReceiptInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(taxReceipt)
        .where(and(eq(taxReceipt.tenantId, tenantId), eq(taxReceipt.id, receiptId)));

      if (!existing) throw new NotFoundException('Reçu fiscal introuvable.');
      if (existing.status === 'cancelled') {
        throw new BadRequestException('Ce reçu fiscal est déjà annulé.');
      }

      let replacedReceipt = null;

      if (input.replaceWithNew) {
        // Create new replacement receipt
        const existingReceipts = await tx
          .select({ id: taxReceipt.id })
          .from(taxReceipt)
          .where(and(eq(taxReceipt.tenantId, tenantId), eq(taxReceipt.taxYear, existing.taxYear)));

        const nextSeq = existingReceipts.length + 1;
        const newReceiptNumber = formatCraReceiptNumber(existing.taxYear, nextSeq);

        const [replacement] = await tx
          .insert(taxReceipt)
          .values({
            tenantId,
            receiptNumber: newReceiptNumber,
            donorId: existing.donorId,
            type: existing.type,
            taxYear: existing.taxYear,
            issueDate: new Date().toISOString().substring(0, 10),
            locationIssued: input.locationIssued || existing.locationIssued,
            totalReceivedAmount: existing.totalReceivedAmount,
            totalAdvantageAmount: existing.totalAdvantageAmount,
            totalEligibleAmount: existing.totalEligibleAmount,
            charityRegistrationNumber: existing.charityRegistrationNumber,
            status: 'issued',
            replacementReason: `Remplace le reçu annulé ${existing.receiptNumber}. Motif: ${input.reason}`,
            authorizedSignatoryName: input.authorizedSignatoryName || existing.authorizedSignatoryName,
            donorSnapshot: existing.donorSnapshot,
          })
          .returning();

        replacedReceipt = replacement;

        // Update old receipt to mark replaced
        await tx
          .update(taxReceipt)
          .set({
            status: 'replaced',
            replacedByReceiptId: replacement.id,
            replacementReason: input.reason,
            updatedAt: new Date(),
          })
          .where(and(eq(taxReceipt.tenantId, tenantId), eq(taxReceipt.id, receiptId)));

        // Re-link donations to new receipt
        await tx
          .update(donation)
          .set({ taxReceiptId: replacement.id, updatedAt: new Date() })
          .where(and(eq(donation.tenantId, tenantId), eq(donation.taxReceiptId, receiptId)));
      } else {
        // Simply cancel receipt and free up donations
        await tx
          .update(taxReceipt)
          .set({
            status: 'cancelled',
            replacementReason: input.reason,
            updatedAt: new Date(),
          })
          .where(and(eq(taxReceipt.tenantId, tenantId), eq(taxReceipt.id, receiptId)));

        await tx
          .update(donation)
          .set({ taxReceiptId: null, updatedAt: new Date() })
          .where(and(eq(donation.tenantId, tenantId), eq(donation.taxReceiptId, receiptId)));
      }

      return {
        success: true,
        cancelledReceiptId: receiptId,
        replacementReceipt: replacedReceipt,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD KPI METRICS
  // ---------------------------------------------------------------------------
  async getDashboardMetrics(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const donations = await tx
        .select({
          grossAmount: donation.grossAmount,
          eligibleAmount: donation.eligibleAmount,
          status: donation.status,
          isTaxReceiptEligible: donation.isTaxReceiptEligible,
          taxReceiptId: donation.taxReceiptId,
          paymentMethod: donation.paymentMethod,
          recurrence: donation.recurrence,
          donationDate: donation.donationDate,
        })
        .from(donation)
        .where(eq(donation.tenantId, tenantId));

      const donors = await tx
        .select({ id: donor.id, type: donor.type })
        .from(donor)
        .where(eq(donor.tenantId, tenantId));

      const campaigns = await tx
        .select()
        .from(donationCampaign)
        .where(eq(donationCampaign.tenantId, tenantId));

      const kpis = calculateDonationKPIs(donations);

      // Breakdowns
      const paymentMethods = donations
        .filter((d: any) => d.status === 'received')
        .reduce((acc: Record<string, number>, d: any) => {
          acc[d.paymentMethod] = (acc[d.paymentMethod] || 0) + Number(d.grossAmount);
          return acc;
        }, {});

      const donorTypes = donors.reduce((acc: Record<string, number>, d: any) => {
        acc[d.type] = (acc[d.type] || 0) + 1;
        return acc;
      }, {});

      return {
        ...kpis,
        totalDonors: donors.length,
        activeCampaignsCount: campaigns.filter((c: any) => c.status === 'active').length,
        paymentMethodsBreakdown: paymentMethods,
        donorTypesBreakdown: donorTypes,
      };
    });
  }
}
