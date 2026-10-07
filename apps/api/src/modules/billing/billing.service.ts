import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  subscriptionPlan,
  tenantSubscription,
  tenantInvoice,
  tenantRegistry,
  membership,
  project,
  caseFile,
  indicator,
  document,
  ChangePlanInput,
  UpdatePaymentMethodInput,
} from '@orgdashio/shared';
import { eq, desc, and } from 'drizzle-orm';
import {
  calculateCanadianTaxes,
  calculateQuotaUsage,
  calculateMrr,
} from './billing.utils';

@Injectable()
export class BillingService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  /**
   * Retourne tous les plans d'abonnement SaaS configurés
   */
  async getAvailablePlans() {
    return this.db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.isActive, true))
      .orderBy(subscriptionPlan.priceMonthly);
  }

  /**
   * Retourne l'abonnement du tenant avec son utilisation de quotas en temps réel
   */
  async getTenantSubscriptionWithUsage(tenantId: string) {
    // 1. Fetch or create default subscription
    let [sub] = await this.db
      .select()
      .from(tenantSubscription)
      .where(eq(tenantSubscription.tenantId, tenantId));

    if (!sub) {
      const [newSub] = await this.db
        .insert(tenantSubscription)
        .values({
          tenantId,
          planCode: 'starter',
          billingCycle: 'monthly',
          status: 'active',
          seatCount: 10,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentMethodLast4: '4242',
          paymentMethodBrand: 'Visa',
        })
        .returning();
      sub = newSub;
    }

    // 2. Fetch Plan Details
    const [plan] = await this.db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.code, sub.planCode));

    // 3. Real-time usage aggregation
    const members = await this.db
      .select()
      .from(membership)
      .where(eq(membership.tenantId, tenantId));
    const activeMembers = members.filter((m: any) => m.status === 'active');

    const projects = await this.db
      .select()
      .from(project)
      .where(eq(project.tenantId, tenantId));

    const cases = await this.db
      .select()
      .from(caseFile)
      .where(eq(caseFile.tenantId, tenantId));

    const indicators = await this.db
      .select()
      .from(indicator)
      .where(eq(indicator.tenantId, tenantId));

    const docs = await this.db
      .select()
      .from(document)
      .where(eq(document.tenantId, tenantId));

    // Calculate approximate storage in GB (assuming average 2.5 MB per doc metadata)
    const estimatedStorageGb = Math.round((docs.length * 0.0025) * 100) / 100;

    const maxUsers = plan ? plan.maxUsers : 5;
    const maxProjects = plan ? plan.maxProjects : 5;
    const maxStorageGb = plan ? plan.maxStorageGb : 5;

    const usersQuota = calculateQuotaUsage(activeMembers.length, maxUsers);
    const projectsQuota = calculateQuotaUsage(projects.length, maxProjects);
    const storageQuota = calculateQuotaUsage(estimatedStorageGb, maxStorageGb);

    return {
      subscription: sub,
      plan: plan || {
        code: sub.planCode,
        name: sub.planCode.toUpperCase(),
        priceMonthly: '49.00',
        priceAnnual: '490.00',
        maxUsers,
        maxProjects,
        maxStorageGb,
        features: ['cases', 'indicators', 'training'],
      },
      usage: {
        activeUsers: activeMembers.length,
        totalMembers: members.length,
        maxUsers,
        usersQuota,
        totalProjects: projects.length,
        maxProjects,
        projectsQuota,
        totalCases: cases.length,
        totalIndicators: indicators.length,
        totalDocuments: docs.length,
        estimatedStorageGb,
        maxStorageGb,
        storageQuota,
      },
    };
  }

  /**
   * Changement de forfait / Plan SaaS avec émission immédiate de facture d'ajustement
   */
  async changePlan(tenantId: string, input: ChangePlanInput) {
    const [targetPlan] = await this.db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.code, input.planCode));

    if (!targetPlan) {
      throw new NotFoundException(`Plan ${input.planCode} introuvable`);
    }

    const price =
      input.billingCycle === 'annual'
        ? Number(targetPlan.priceAnnual)
        : Number(targetPlan.priceMonthly);

    const taxes = calculateCanadianTaxes(price);

    const periodStart = new Date();
    const durationDays = input.billingCycle === 'annual' ? 365 : 30;
    const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // 1. Update or Insert Subscription
    const [updatedSub] = await this.db
      .insert(tenantSubscription)
      .values({
        tenantId,
        planCode: input.planCode,
        billingCycle: input.billingCycle,
        status: 'active',
        seatCount: input.seatCount || targetPlan.maxUsers,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: tenantSubscription.tenantId,
        set: {
          planCode: input.planCode,
          billingCycle: input.billingCycle,
          status: 'active',
          seatCount: input.seatCount || targetPlan.maxUsers,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          updatedAt: new Date(),
        },
      })
      .returning();

    // 2. Generate Invoice
    const invoiceCount = await this.db.select().from(tenantInvoice);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount.length + 1).padStart(4, '0')}`;

    const [invoice] = await this.db
      .insert(tenantInvoice)
      .values({
        tenantId,
        invoiceNumber,
        planName: `${targetPlan.name} (${input.billingCycle === 'annual' ? 'Annuel' : 'Mensuel'})`,
        billingCycle: input.billingCycle,
        subtotal: String(taxes.subtotal),
        taxTps: String(taxes.taxTps),
        taxTvq: String(taxes.taxTvq),
        total: String(taxes.total),
        currency: 'CAD',
        status: 'paid',
        paidAt: new Date(),
        periodStart,
        periodEnd,
        pdfUrl: `/api/v1/billing/invoices/${invoiceNumber}/pdf`,
      })
      .returning();

    return {
      subscription: updatedSub,
      invoice,
      plan: targetPlan,
    };
  }

  /**
   * Met à jour les informations de paiement et de facturation
   */
  async updatePaymentMethod(tenantId: string, input: UpdatePaymentMethodInput) {
    const [sub] = await this.db
      .select()
      .from(tenantSubscription)
      .where(eq(tenantSubscription.tenantId, tenantId));

    if (!sub) throw new NotFoundException('Abonnement introuvable');

    const [updated] = await this.db
      .update(tenantSubscription)
      .set({
        paymentMethodLast4: input.paymentMethodLast4,
        paymentMethodBrand: input.paymentMethodBrand,
        billingEmail: input.billingEmail,
        billingAddress: input.billingAddress,
        neqNumber: input.neqNumber,
        updatedAt: new Date(),
      })
      .where(eq(tenantSubscription.tenantId, tenantId))
      .returning();

    return updated;
  }

  /**
   * Historique des factures du tenant
   */
  async getTenantInvoices(tenantId: string) {
    return this.db
      .select()
      .from(tenantInvoice)
      .where(eq(tenantInvoice.tenantId, tenantId))
      .orderBy(desc(tenantInvoice.createdAt));
  }

  /**
   * Métriques globales de monétisation SaaS (Super-Admin Control Plane)
   */
  async getPlatformBillingMetrics() {
    const subs = await this.db.select().from(tenantSubscription);
    const plans = await this.db.select().from(subscriptionPlan);
    const invoices = await this.db.select().from(tenantInvoice);

    const planPriceMap: Record<string, { monthly: number; annual: number }> = {};
    const planCounts: Record<string, number> = {};

    plans.forEach((p: any) => {
      planPriceMap[p.code] = {
        monthly: Number(p.priceMonthly),
        annual: Number(p.priceAnnual),
      };
      planCounts[p.code] = 0;
    });

    subs.forEach((s: any) => {
      if (s.status === 'active' || s.status === 'trialing') {
        planCounts[s.planCode] = (planCounts[s.planCode] || 0) + 1;
      }
    });

    const mrr = calculateMrr(subs, planPriceMap);
    const arr = Math.round(mrr * 12 * 100) / 100;
    const activeSubscribers = subs.filter((s: any) => s.status === 'active').length;
    const arpu = activeSubscribers > 0 ? Math.round((mrr / activeSubscribers) * 100) / 100 : 0;

    let totalCollected = 0;
    invoices.forEach((inv: any) => {
      if (inv.status === 'paid') {
        totalCollected += Number(inv.total);
      }
    });

    return {
      mrr,
      arr,
      arpu,
      totalCollected: Math.round(totalCollected * 100) / 100,
      activeSubscribers,
      totalTenants: subs.length,
      planDistribution: planCounts,
      recentInvoices: invoices.slice(0, 10),
    };
  }
}
