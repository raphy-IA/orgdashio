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
  resultNode,
  CreateIndicatorInput,
  UpdateIndicatorInput,
  RecordObservationInput,
  CreateResultNodeInput,
} from '@orgdashio/shared';
import { eq, desc, and } from 'drizzle-orm';
import {
  calculateIndicatorProgress,
  calculateIndicatorVariance,
  calculateIndicatorHealth,
  countUniqueParties,
  aggregateDisaggregations,
  generateDonorLogframeCsv,
} from './indicators.utils';

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
          description: input.description,
          level: input.level,
          unit: input.unit || 'personnes',
          baselineValue: String(input.baselineValue || 0),
          targetValue: String(input.targetValue),
          actualValue: String(input.baselineValue || 0),
          frequency: input.frequency || 'quarterly',
          meansOfVerification: input.meansOfVerification,
          disaggregationDimensions: input.disaggregationDimensions || ['gender', 'ageGroup', 'immigrationStatus'],
          status: input.status || 'active',
        })
        .returning();

      return newInd;
    });
  }

  async updateIndicator(tenantId: string, indicatorId: string, input: UpdateIndicatorInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx.select().from(indicator).where(eq(indicator.id, indicatorId));
      if (!existing) throw new NotFoundException('Indicateur introuvable');

      const updateData: any = { updatedAt: new Date() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.level !== undefined) updateData.level = input.level;
      if (input.unit !== undefined) updateData.unit = input.unit;
      if (input.baselineValue !== undefined) updateData.baselineValue = String(input.baselineValue);
      if (input.targetValue !== undefined) updateData.targetValue = String(input.targetValue);
      if (input.frequency !== undefined) updateData.frequency = input.frequency;
      if (input.meansOfVerification !== undefined) updateData.meansOfVerification = input.meansOfVerification;
      if (input.disaggregationDimensions !== undefined) updateData.disaggregationDimensions = input.disaggregationDimensions;
      if (input.status !== undefined) updateData.status = input.status;

      const [updated] = await tx
        .update(indicator)
        .set(updateData)
        .where(eq(indicator.id, indicatorId))
        .returning();

      return updated;
    });
  }

  async deleteIndicator(tenantId: string, indicatorId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [existing] = await tx.select().from(indicator).where(eq(indicator.id, indicatorId));
      if (!existing) throw new NotFoundException('Indicateur introuvable');

      await tx.delete(indicator).where(eq(indicator.id, indicatorId));
      return { success: true, message: 'Indicateur supprimé' };
    });
  }

  async findAllIndicators(tenantId: string, filters?: { projectId?: string; level?: string; status?: string }) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const list = await tx.select().from(indicator).orderBy(indicator.code);
      const projects = await tx.select().from(project);
      const projectMap = new Map<string, any>(projects.map((p: any) => [p.id, p]));

      const nodes = await tx.select().from(resultNode);
      const nodeMap = new Map<string, any>(nodes.map((n: any) => [n.id, n]));

      let filtered = list;
      if (filters?.projectId) {
        filtered = filtered.filter((i: any) => i.projectId === filters.projectId);
      }
      if (filters?.level) {
        filtered = filtered.filter((i: any) => i.level === filters.level);
      }
      if (filters?.status) {
        filtered = filtered.filter((i: any) => i.status === filters.status);
      }

      return filtered.map((ind: any) => {
        const actual = Number(ind.actualValue);
        const target = Number(ind.targetValue);
        const proj = ind.projectId ? projectMap.get(ind.projectId) : null;
        const node = ind.resultNodeId ? nodeMap.get(ind.resultNodeId) : null;
        const { varianceValue, variancePct } = calculateIndicatorVariance(actual, target);
        const health = calculateIndicatorHealth(actual, target);

        return {
          ...ind,
          projectName: proj ? proj.name : null,
          resultNodeTitle: node ? node.title : null,
          progressPct: calculateIndicatorProgress(actual, target),
          varianceValue,
          variancePct,
          health,
        };
      });
    });
  }

  async findOneIndicator(tenantId: string, indicatorId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [ind] = await tx.select().from(indicator).where(eq(indicator.id, indicatorId));
      if (!ind) throw new NotFoundException('Indicateur introuvable');

      const observations = await tx
        .select()
        .from(indicatorObservation)
        .where(eq(indicatorObservation.indicatorId, indicatorId))
        .orderBy(desc(indicatorObservation.recordedAt));

      const actual = Number(ind.actualValue);
      const target = Number(ind.targetValue);
      const { varianceValue, variancePct } = calculateIndicatorVariance(actual, target);
      const health = calculateIndicatorHealth(actual, target);
      const aggregatedDisaggregation = aggregateDisaggregations(observations);

      let proj = null;
      if (ind.projectId) {
        const [p] = await tx.select().from(project).where(eq(project.id, ind.projectId));
        proj = p || null;
      }

      let node = null;
      if (ind.resultNodeId) {
        const [n] = await tx.select().from(resultNode).where(eq(resultNode.id, ind.resultNodeId));
        node = n || null;
      }

      return {
        ...ind,
        project: proj,
        resultNode: node,
        progressPct: calculateIndicatorProgress(actual, target),
        varianceValue,
        variancePct,
        health,
        observations,
        aggregatedDisaggregation,
      };
    });
  }

  async recordObservation(tenantId: string, indicatorId: string, input: RecordObservationInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [ind] = await tx.select().from(indicator).where(eq(indicator.id, indicatorId));
      if (!ind) throw new NotFoundException('Indicateur introuvable');

      const [obs] = await tx
        .insert(indicatorObservation)
        .values({
          tenantId,
          indicatorId,
          periodLabel: input.periodLabel,
          recordedValue: String(input.recordedValue),
          disaggregationData: input.disaggregationData || null,
          notes: input.notes,
          sourceFileUrl: input.sourceFileUrl,
        })
        .returning();

      // Update actual value on indicator
      await tx
        .update(indicator)
        .set({ actualValue: String(input.recordedValue), updatedAt: new Date() })
        .where(eq(indicator.id, indicatorId));

      return obs;
    });
  }

  async getLogicalFrameworkMatrix(tenantId: string, projectId?: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const nodesQuery = projectId
        ? tx.select().from(resultNode).where(eq(resultNode.projectId, projectId))
        : tx.select().from(resultNode);
      const nodes = await nodesQuery;

      const indicatorsQuery = projectId
        ? tx.select().from(indicator).where(eq(indicator.projectId, projectId))
        : tx.select().from(indicator);
      const indicators = await indicatorsQuery;

      const projects = await tx.select().from(project);
      const projectMap = new Map<string, any>(projects.map((p: any) => [p.id, p]));

      // Group indicators by result node or level
      const impactNodes = nodes.filter((n: any) => n.level === 'impact');
      const outcomeNodes = nodes.filter((n: any) => n.level === 'outcome');
      const outputNodes = nodes.filter((n: any) => n.level === 'output');

      const enrichedIndicators = indicators.map((ind: any) => {
        const actual = Number(ind.actualValue);
        const target = Number(ind.targetValue);
        const { varianceValue, variancePct } = calculateIndicatorVariance(actual, target);
        const health = calculateIndicatorHealth(actual, target);
        return {
          ...ind,
          progressPct: calculateIndicatorProgress(actual, target),
          varianceValue,
          variancePct,
          health,
          project: ind.projectId ? projectMap.get(ind.projectId) : null,
        };
      });

      return {
        projectId: projectId || null,
        projectName: projectId && projectMap.get(projectId) ? projectMap.get(projectId).name : 'Tous les projets',
        impactNodes: impactNodes.map((node: any) => ({
          ...node,
          indicators: enrichedIndicators.filter((i: any) => i.resultNodeId === node.id || (!i.resultNodeId && i.level === 'impact')),
        })),
        outcomeNodes: outcomeNodes.map((node: any) => ({
          ...node,
          indicators: enrichedIndicators.filter((i: any) => i.resultNodeId === node.id || (!i.resultNodeId && i.level === 'outcome')),
        })),
        outputNodes: outputNodes.map((node: any) => ({
          ...node,
          indicators: enrichedIndicators.filter((i: any) => i.resultNodeId === node.id || (!i.resultNodeId && i.level === 'output')),
        })),
        unassignedIndicators: enrichedIndicators.filter((i: any) => !i.resultNodeId && !['impact', 'outcome', 'output'].includes(i.level)),
      };
    });
  }

  async getDonorReport(tenantId: string, projectId?: string, format: 'json' | 'csv' = 'json') {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const indicators = await this.findAllIndicators(tenantId, { projectId });
      const projects = await tx.select().from(project);
      const targetProj = projectId ? projects.find((p: any) => p.id === projectId) : null;
      const projectName = targetProj ? targetProj.name : 'Portefeuille Global';

      const observations = await tx.select().from(indicatorObservation);
      const globalDisaggregations = aggregateDisaggregations(observations);

      const rows = indicators.map((ind: any) => ({
        level: ind.level.toUpperCase(),
        objectiveTitle: ind.resultNodeTitle || ind.projectName || 'Objectif Général',
        indicatorCode: ind.code,
        indicatorName: ind.name,
        baseline: ind.baselineValue,
        target: ind.targetValue,
        actual: ind.actualValue,
        variancePct: ind.variancePct,
        health: ind.health,
        meansOfVerification: ind.meansOfVerification || 'Rapport interne',
        unit: ind.unit,
      }));

      if (format === 'csv') {
        return generateDonorLogframeCsv(projectName, rows);
      }

      return {
        projectName,
        generatedAt: new Date().toISOString(),
        totalIndicators: indicators.length,
        logframeRows: rows,
        globalDisaggregations,
      };
    });
  }

  async createResultNode(tenantId: string, input: CreateResultNodeInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [node] = await tx
        .insert(resultNode)
        .values({
          tenantId,
          projectId: input.projectId,
          parentId: input.parentId,
          level: input.level,
          title: input.title,
          description: input.description,
        })
        .returning();

      return node;
    });
  }

  async findAllResultNodes(tenantId: string, projectId?: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const query = projectId
        ? tx.select().from(resultNode).where(eq(resultNode.projectId, projectId))
        : tx.select().from(resultNode);
      return query;
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
      const indicators = await this.findAllIndicators(tenantId);
      const projects = await tx.select().from(project);
      const observations = await tx.select().from(indicatorObservation);
      const uniqueReached = await this.getUniqueReachedCount(tenantId);

      let totalProgress = 0;
      const healthCounts = {
        exceeded: 0,
        on_track: 0,
        warning: 0,
        off_track: 0,
      };

      indicators.forEach((ind: any) => {
        totalProgress += ind.progressPct;
        const h = ind.health as keyof typeof healthCounts;
        if (healthCounts[h] !== undefined) {
          healthCounts[h]++;
        }
      });

      const avgProgress = indicators.length > 0 ? Math.round((totalProgress / indicators.length) * 10) / 10 : 0;
      const globalDisaggregations = aggregateDisaggregations(observations);

      return {
        totalIndicators: indicators.length,
        totalProjects: projects.length,
        uniquePartiesReached: uniqueReached,
        averageProgressPct: avgProgress,
        healthCounts,
        globalDisaggregations,
        indicators,
      };
    });
  }
}
