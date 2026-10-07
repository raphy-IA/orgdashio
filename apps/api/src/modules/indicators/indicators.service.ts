import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  withTenantContext,
  indicator,
  indicatorObservation,
  serviceDelivery,
  enrollment,
  caseFile,
  project,
  CreateIndicatorInput,
  RecordObservationInput,
} from '@orgdashio/shared';
import { eq } from 'drizzle-orm';
import { calculateIndicatorProgress, countUniqueParties } from './indicators.utils';

@Injectable()
export class IndicatorsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async createIndicator(tenantId: string, input: CreateIndicatorInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [newInd] = await tx
        .insert(indicator)
        .values({
          tenantId,
          projectId: input.projectId,
          resultNodeId: input.resultNodeId,
          code: input.code,
          name: input.name,
          level: input.level,
          unit: input.unit || 'count',
          baselineValue: String(input.baselineValue || 0),
          targetValue: String(input.targetValue),
          actualValue: String(input.baselineValue || 0),
          frequency: input.frequency || 'quarterly',
        })
        .returning();

      return newInd;
    });
  }

  async findAllIndicators(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const list = await tx.select().from(indicator);
      return list.map((ind: any) => {
        const actual = Number(ind.actualValue);
        const target = Number(ind.targetValue);
        return {
          ...ind,
          progressPct: calculateIndicatorProgress(actual, target),
        };
      });
    });
  }

  async recordObservation(tenantId: string, indicatorId: string, input: RecordObservationInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [ind] = await tx
        .select()
        .from(indicator)
        .where(eq(indicator.id, indicatorId));

      if (!ind) throw new NotFoundException('Indicateur introuvable');

      const [obs] = await tx
        .insert(indicatorObservation)
        .values({
          tenantId,
          indicatorId,
          periodLabel: input.periodLabel,
          recordedValue: String(input.recordedValue),
          notes: input.notes,
        })
        .returning();

      // Update actual value on indicator
      await tx
        .update(indicator)
        .set({ actualValue: String(input.recordedValue) })
        .where(eq(indicator.id, indicatorId));

      return obs;
    });
  }

  async getUniqueReachedCount(tenantId: string): Promise<number> {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const services = await tx.select({ partyId: serviceDelivery.partyId }).from(serviceDelivery);
      const enrolls = await tx.select({ partyId: enrollment.partyId }).from(enrollment);
      const cases = await tx.select({ partyId: caseFile.partyId }).from(caseFile);

      const servicePartyIds = services.map((s: any) => s.partyId);
      const enrollPartyIds = enrolls.map((e: any) => e.partyId);
      const casePartyIds = cases.map((c: any) => c.partyId);

      return countUniqueParties(servicePartyIds, enrollPartyIds, casePartyIds);
    });
  }

  async getImpactDashboard(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const indicators = await tx.select().from(indicator);
      const projects = await tx.select().from(project);
      const uniqueReached = await this.getUniqueReachedCount(tenantId);

      let totalProgress = 0;
      indicators.forEach((ind: any) => {
        totalProgress += calculateIndicatorProgress(Number(ind.actualValue), Number(ind.targetValue));
      });

      const avgProgress = indicators.length > 0 ? Math.round((totalProgress / indicators.length) * 10) / 10 : 0;

      return {
        totalIndicators: indicators.length,
        totalProjects: projects.length,
        uniquePartiesReached: uniqueReached,
        averageProgressPct: avgProgress,
        indicators: indicators.map((ind: any) => ({
          ...ind,
          progressPct: calculateIndicatorProgress(Number(ind.actualValue), Number(ind.targetValue)),
        })),
      };
    });
  }
}
