import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  withTenantContext,
  program,
  project,
  programProject,
  fundingSource,
  resultNode,
  planItem,
  planDependency,
  budget,
  budgetLine,
  expense,
  raidItem,
  projectMember,
  planItemUpdate,
  planItemDeliverable,
  planItemRaci,
  CreateProgramInput,
  CreateProjectInput,
  UpdateProjectInput,
  FundingSourceInput,
  ResultNodeInput,
  CreatePlanItemInput,
  CreateDependencyInput,
  CreateBudgetLineInput,
  CreateExpenseInput,
  CreateRaidItemInput,
  UpdatePlanItemInput,
  UpdateRaidItemInput,
  CreateProjectMemberInput,
  SetPlanItemRaciInput,
  CreatePlanItemUpdateInput,
  CreatePlanItemDeliverableInput,
  VerifyDeliverableInput,
} from '@orgdashio/shared';
import { eq, and } from 'drizzle-orm';
import { detectDependencyCycle } from './utils/dependency-graph.util';
import { validateExpenseApproval } from './services/expense-workflow.service';
import { generateAccountingCsv, ExpenseExportRow } from './services/csv-export.util';

@Injectable()
export class ProjectService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  // --- Program Methods ---
  async createProgram(tenantId: string, input: CreateProgramInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [newProg] = await tx
        .insert(program)
        .values({
          tenantId,
          code: input.code,
          name: input.name,
          description: input.description,
          status: input.status || 'active',
        })
        .returning();

      return newProg;
    });
  }

  async addProjectToProgram(tenantId: string, programId: string, projectId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      // Check if project is already assigned to ANY program in this tenant
      const [existing] = await tx
        .select()
        .from(programProject)
        .where(
          and(
            eq(programProject.tenantId, tenantId),
            eq(programProject.projectId, projectId)
          )
        );

      if (existing) {
        if (existing.programId === programId) return existing;
        
        // Reassign to new program
        const [updated] = await tx
          .update(programProject)
          .set({ programId })
          .where(
            and(
              eq(programProject.tenantId, tenantId),
              eq(programProject.projectId, projectId)
            )
          )
          .returning();
        return updated;
      }

      const [link] = await tx
        .insert(programProject)
        .values({
          tenantId,
          programId,
          projectId,
        })
        .returning();

      return link;
    });
  }

  async removeProjectFromProgram(tenantId: string, programId: string, projectId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      await tx
        .delete(programProject)
        .where(
          and(
            eq(programProject.tenantId, tenantId),
            eq(programProject.programId, programId),
            eq(programProject.projectId, projectId)
          )
        );
      return { success: true };
    });
  }

  async findAllPrograms(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const allProjects = await this.findAll(tenantId);
      const programsList = await tx.select().from(program).where(eq(program.tenantId, tenantId));
      const links = await tx.select().from(programProject).where(eq(programProject.tenantId, tenantId));

      return programsList.map((prog: any) => {
        const progLinks = links.filter((l: any) => l.programId === prog.id);
        const linkedProjectIds = new Set(progLinks.map((l: any) => l.projectId));
        const progProjects = allProjects.filter((prj: any) => linkedProjectIds.has(prj.id));

        const totalBudget = progProjects.reduce((acc: number, prj: any) => acc + (prj.metrics?.totalBudget || 0), 0);
        const totalExpenses = progProjects.reduce((acc: number, prj: any) => acc + (prj.metrics?.totalExpenses || 0), 0);
        const overallProgress = progProjects.length > 0
          ? Math.round(progProjects.reduce((acc: number, prj: any) => acc + (prj.metrics?.overallProgress || 0), 0) / progProjects.length)
          : 0;
        const totalTasks = progProjects.reduce((acc: number, prj: any) => acc + (prj.metrics?.totalTasks || 0), 0);
        const completedTasks = progProjects.reduce((acc: number, prj: any) => acc + (prj.metrics?.completedTasks || 0), 0);
        const blockedTasks = progProjects.reduce((acc: number, prj: any) => acc + (prj.metrics?.blockedTasks || 0), 0);

        return {
          ...prog,
          projects: progProjects,
          projectsCount: progProjects.length,
          metrics: {
            totalBudget,
            totalExpenses,
            budgetExecutionRate: totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0,
            overallProgress,
            totalTasks,
            completedTasks,
            blockedTasks,
            activeProjectsCount: progProjects.filter((p: any) => p.status === 'active').length,
          },
        };
      });
    });
  }

  // --- Project Methods ---
  async findAll(tenantId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const projectsList: any[] = await tx.select().from(project).where(eq(project.tenantId, tenantId));
      const allPlanItems: any[] = await tx.select().from(planItem).where(eq(planItem.tenantId, tenantId));
      const allBudgets: any[] = await tx.select().from(budget).where(eq(budget.tenantId, tenantId));
      const allBudgetLines: any[] = await tx.select().from(budgetLine).where(eq(budgetLine.tenantId, tenantId));
      const allExpenses: any[] = await tx.select().from(expense).where(eq(expense.tenantId, tenantId));
      const allFunding: any[] = await tx.select().from(fundingSource).where(eq(fundingSource.tenantId, tenantId));
      const allMembers: any[] = await tx.select().from(projectMember).where(eq(projectMember.tenantId, tenantId));
      const allRaid: any[] = await tx.select().from(raidItem).where(eq(raidItem.tenantId, tenantId));
      const allPrograms: any[] = await tx.select().from(program).where(eq(program.tenantId, tenantId));
      const allLinks: any[] = await tx.select().from(programProject).where(eq(programProject.tenantId, tenantId));

      return projectsList.map((p: any) => {
        const pPlanItems = allPlanItems.filter((i: any) => i.projectId === p.id);
        const pBudgets = allBudgets.filter((b: any) => b.projectId === p.id);
        const pBudgetIds = new Set(pBudgets.map((b: any) => b.id));
        const pBudgetLines = allBudgetLines.filter((bl: any) => pBudgetIds.has(bl.budgetId));
        const pExpenses = allExpenses.filter((e: any) => e.projectId === p.id);
        const pFunding = allFunding.filter((f: any) => f.projectId === p.id);
        const pMembers = allMembers.filter((m: any) => m.projectId === p.id);
        const pRaid = allRaid.filter((r: any) => r.projectId === p.id);
        const pLink = allLinks.find((l: any) => l.projectId === p.id);
        const pProg = pLink ? allPrograms.find((pr: any) => pr.id === pLink.programId) : null;

        const totalTasks = pPlanItems.length;
        const completedTasks = pPlanItems.filter((i: any) => (i.progressPct ?? 0) === 100 || i.status === 'completed').length;
        const inProgressTasks = pPlanItems.filter((i: any) => (i.progressPct ?? 0) > 0 && (i.progressPct ?? 0) < 100).length;
        const todoTasks = pPlanItems.filter((i: any) => (i.progressPct ?? 0) === 0 && i.status !== 'completed').length;
        const blockedTasks = pPlanItems.filter((i: any) => i.status === 'blocked').length;
        
        const rootItems = pPlanItems.filter((i: any) => !i.parentId);
        const totalRootWeight = rootItems.reduce((acc: number, r: any) => acc + (r.durationDays || 1), 0);
        const overallProgress = rootItems.length > 0 && totalRootWeight > 0
          ? Math.round(rootItems.reduce((acc: number, r: any) => acc + (r.progressPct || 0) * (r.durationDays || 1), 0) / totalRootWeight)
          : (totalTasks > 0 ? Math.round(pPlanItems.reduce((acc: number, i: any) => acc + (i.progressPct || 0), 0) / totalTasks) : 0);

        const totalBudgetLines = pBudgetLines.reduce((acc: number, bl: any) => acc + (parseFloat(bl.amount as any) || 0), 0);
        const totalFunding = pFunding.reduce((acc: number, f: any) => acc + (parseFloat(f.amount as any) || 0), 0);
        const totalBudget = totalBudgetLines > 0 ? totalBudgetLines : totalFunding;
        const totalExpenses = pExpenses.reduce((acc: number, exp: any) => acc + (parseFloat(exp.amount as any) || 0), 0);
        const totalApprovedExpenses = pExpenses
          .filter((e: any) => e.status === 'approved' || e.status === 'paid')
          .reduce((acc: number, exp: any) => acc + (parseFloat(exp.amount as any) || 0), 0);
        const budgetExecutionRate = totalBudget > 0 ? Math.round((totalApprovedExpenses / totalBudget) * 100) : 0;

        return {
          ...p,
          program: pProg ? { id: pProg.id, code: pProg.code, name: pProg.name } : null,
          metrics: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            todoTasks,
            blockedTasks,
            overallProgress,
            totalBudget,
            totalBudgetLines,
            totalFunding,
            totalExpenses,
            totalApprovedExpenses,
            budgetExecutionRate,
            membersCount: pMembers.length,
            risksCount: pRaid.filter((r: any) => r.type === 'risk').length,
            issuesCount: pRaid.filter((r: any) => r.type === 'issue').length,
          },
        };
      });
    });
  }

  async findOne(tenantId: string, id: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .select()
        .from(project)
        .where(and(eq(project.id, id), eq(project.tenantId, tenantId)));

      if (!res) {
        throw new NotFoundException('Projet non trouvé');
      }
      return res;
    });
  }

  async create(tenantId: string, userId: string, input: CreateProjectInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .insert(project)
        .values({
          tenantId,
          programId: input.programId || null,
          code: input.code,
          name: input.name,
          status: input.status,
          createdBy: userId,
        })
        .returning();

      // Create default budget container
      await tx.insert(budget).values({
        tenantId,
        projectId: res.id,
        currency: 'CAD',
        status: 'draft',
      });

      return res;
    });
  }

  async update(tenantId: string, id: string, input: UpdateProjectInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .update(project)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(project.id, id))
        .returning();

      if (!res) {
        throw new NotFoundException('Projet non trouvé');
      }
      return res;
    });
  }

  async getFullProject(tenantId: string, projectId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [proj] = await tx.select().from(project).where(eq(project.id, projectId));
      if (!proj) throw new NotFoundException('Projet non trouvé');

      const funding = await tx.select().from(fundingSource).where(eq(fundingSource.projectId, projectId));
      const nodes = await tx.select().from(resultNode).where(eq(resultNode.projectId, projectId));
      const items = await tx.select().from(planItem).where(eq(planItem.projectId, projectId));
      const deps = await tx.select().from(planDependency);
      const [projBudget] = await tx.select().from(budget).where(eq(budget.projectId, projectId));

      let lines: any[] = [];
      if (projBudget) {
        lines = await tx.select().from(budgetLine).where(eq(budgetLine.budgetId, projBudget.id));
      }

      const expenses = await tx.select().from(expense).where(eq(expense.projectId, projectId));
      const raid = await tx.select().from(raidItem).where(eq(raidItem.projectId, projectId));
      const members = await tx.select().from(projectMember).where(eq(projectMember.projectId, projectId));
      const raci = await tx.select().from(planItemRaci).where(eq(planItemRaci.projectId, projectId));
      
      const itemIds = new Set(items.map((i: any) => i.id));
      const allUpdates = await tx.select().from(planItemUpdate);
      const allDeliverables = await tx.select().from(planItemDeliverable);

      const updates = allUpdates.filter((u: any) => itemIds.has(u.planItemId));
      const deliverables = allDeliverables.filter((d: any) => itemIds.has(d.planItemId));

      return {
        project: proj,
        fundingSources: funding,
        resultNodes: nodes,
        planItems: items,
        dependencies: deps,
        budget: projBudget ? { ...projBudget, lines } : null,
        expenses,
        raidItems: raid,
        members,
        raci,
        updates,
        deliverables,
      };
    });
  }

  async addFundingSource(tenantId: string, projectId: string, input: FundingSourceInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .insert(fundingSource)
        .values({
          tenantId,
          projectId,
          donorName: input.donorName,
          fundingType: input.fundingType,
          amount: input.amount.toString(),
          currency: input.currency,
          reportDueAt: input.reportDueAt,
          notes: input.notes,
        })
        .returning();
      return res;
    });
  }

  async addResultNode(tenantId: string, projectId: string, input: ResultNodeInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .insert(resultNode)
        .values({
          tenantId,
          projectId,
          parentId: input.parentId,
          level: input.level,
          title: input.title,
          description: input.description,
        })
        .returning();
      return res;
    });
  }

  async addPlanItem(tenantId: string, projectId: string, input: CreatePlanItemInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      let parent: any = null;
      if (input.parentId) {
        const [foundParent] = await tx
          .select()
          .from(planItem)
          .where(and(eq(planItem.id, input.parentId), eq(planItem.tenantId, tenantId), eq(planItem.projectId, projectId)));
        
        if (!foundParent) {
          throw new NotFoundException('Élément parent introuvable');
        }
        parent = foundParent;

        // Validation des dates selon l'intervalle parent
        if (input.startDate && parent.startDate && input.startDate < parent.startDate) {
          throw new BadRequestException(
            `La date de début (${input.startDate}) ne peut pas être antérieure à celle de l'élément parent (${parent.startDate})`
          );
        }
        if (input.endDate && parent.endDate && input.endDate > parent.endDate) {
          throw new BadRequestException(
            `La date de fin (${input.endDate}) ne peut pas dépasser celle de l'élément parent (${parent.endDate})`
          );
        }
        if (input.startDate && parent.endDate && input.startDate > parent.endDate) {
          throw new BadRequestException(
            `La date de début (${input.startDate}) dépasse la date de fin du parent (${parent.endDate})`
          );
        }
      }

      if (input.startDate && input.endDate && input.startDate > input.endDate) {
        throw new BadRequestException('La date de début ne peut pas être postérieure à la date de fin');
      }

      // Auto-génération intelligente du WBS si non fourni ou si généré automatiquement
      let finalWbs = input.wbs?.trim();
      if (!finalWbs) {
        const siblings = await tx
          .select()
          .from(planItem)
          .where(
            and(
              eq(planItem.tenantId, tenantId),
              eq(planItem.projectId, projectId),
              input.parentId ? eq(planItem.parentId, input.parentId) : eq(planItem.parentId, null as any)
            )
          );
        
        const nextIndex = siblings.length + 1;
        finalWbs = parent ? `${parent.wbs}.${nextIndex}` : `${nextIndex}`;
      }

      const [res] = await tx
        .insert(planItem)
        .values({
          tenantId,
          projectId,
          parentId: input.parentId,
          resultNodeId: input.resultNodeId,
          type: input.type,
          wbs: finalWbs,
          title: input.title,
          startDate: input.startDate,
          endDate: input.endDate,
          durationDays: input.durationDays,
          assigneePartyId: input.assigneePartyId,
        })
        .returning();

      await this.recalculateWbsAndProjectRollup(tx, tenantId, projectId);
      return res;
    });
  }

  async addDependency(tenantId: string, projectId: string, input: CreateDependencyInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const existingDeps = await tx.select().from(planDependency);
      const isCycle = detectDependencyCycle(
        existingDeps.map((d: any) => ({
          predecessorId: d.predecessorId,
          successorId: d.successorId,
        })),
        input.predecessorId,
        input.successorId
      );

      if (isCycle) {
        throw new BadRequestException('Dépendance invalide : création d’une dépendance circulaire détectée');
      }

      const [res] = await tx
        .insert(planDependency)
        .values({
          tenantId,
          predecessorId: input.predecessorId,
          successorId: input.successorId,
          type: input.type,
          lagDays: input.lagDays,
        })
        .returning();
      return res;
    });
  }

  async addBudgetLines(tenantId: string, projectId: string, lines: CreateBudgetLineInput[]) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [projBudget] = await tx.select().from(budget).where(eq(budget.projectId, projectId));
      if (!projBudget) throw new NotFoundException('Budget non trouvé');

      const inserted = await tx
        .insert(budgetLine)
        .values(
          lines.map((l) => ({
            tenantId,
            budgetId: projBudget.id,
            categoryCode: l.categoryCode,
            description: l.description,
            amount: l.amount.toString(),
          }))
        )
        .returning();

      return inserted;
    });
  }

  async createExpense(tenantId: string, projectId: string, userId: string, input: CreateExpenseInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .insert(expense)
        .values({
          tenantId,
          projectId,
          budgetLineId: input.budgetLineId,
          date: input.date,
          vendor: input.vendor,
          amount: input.amount.toString(),
          taxTps: input.taxTps.toString(),
          taxTvq: input.taxTvq.toString(),
          status: 'submitted',
          submittedBy: userId,
          notes: input.notes,
        })
        .returning();
      return res;
    });
  }

  async approveExpense(tenantId: string, projectId: string, expenseId: string, approverUserId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [targetExpense] = await tx.select().from(expense).where(eq(expense.id, expenseId));
      if (!targetExpense) throw new NotFoundException('Dépense non trouvée');

      // Separation of Duties check (FIN-04)
      validateExpenseApproval(targetExpense, approverUserId);

      const [updated] = await tx
        .update(expense)
        .set({
          status: 'approved',
          approvedBy: approverUserId,
        })
        .where(eq(expense.id, expenseId))
        .returning();

      return updated;
    });
  }

  async exportExpensesCsv(tenantId: string, projectId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [proj] = await tx.select().from(project).where(eq(project.id, projectId));
      if (!proj) throw new NotFoundException('Projet non trouvé');

      const expensesList = await tx.select().from(expense).where(eq(expense.projectId, projectId));
      const linesList = await tx.select().from(budgetLine);

      const categoryMap = new Map(linesList.map((l: any) => [l.id, l.categoryCode]));

      const rows: ExpenseExportRow[] = expensesList.map((e: any) => ({
        date: e.date,
        categoryCode: categoryMap.get(e.budgetLineId) || 'Autre',
        vendor: e.vendor,
        amount: e.amount,
        taxTps: e.taxTps || '0',
        taxTvq: e.taxTvq || '0',
        status: e.status,
        projectCode: proj.code,
        projectName: proj.name,
        notes: e.notes,
      }));

      return generateAccountingCsv(rows);
    });
  }

  async addRaidItem(tenantId: string, projectId: string, input: CreateRaidItemInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .insert(raidItem)
        .values({
          tenantId,
          projectId,
          type: input.type,
          title: input.title,
          description: input.description,
          probability: input.probability,
          impact: input.impact,
          ownerName: input.ownerName,
        })
        .returning();
      return res;
    });
  }

  async updatePlanItem(tenantId: string, projectId: string, itemId: string, input: UpdatePlanItemInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .update(planItem)
        .set({
          ...(input.title !== undefined && { title: input.title }),
          ...(input.startDate !== undefined && { startDate: input.startDate }),
          ...(input.endDate !== undefined && { endDate: input.endDate }),
          ...(input.progressPct !== undefined && { progressPct: input.progressPct }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.assigneePartyId !== undefined && { assigneePartyId: input.assigneePartyId }),
        })
        .where(and(eq(planItem.id, itemId), eq(planItem.tenantId, tenantId), eq(planItem.projectId, projectId)))
        .returning();
      if (!res) throw new NotFoundException('Élément de plan non trouvé');

      await this.recalculateWbsAndProjectRollup(tx, tenantId, projectId);
      return res;
    });
  }

  async updateRaidItem(tenantId: string, projectId: string, itemId: string, input: UpdateRaidItemInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .update(raidItem)
        .set({
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.probability !== undefined && { probability: input.probability }),
          ...(input.impact !== undefined && { impact: input.impact }),
          ...(input.ownerName !== undefined && { ownerName: input.ownerName }),
          ...(input.status !== undefined && { status: input.status }),
        })
        .where(and(eq(raidItem.id, itemId), eq(raidItem.tenantId, tenantId), eq(raidItem.projectId, projectId)))
        .returning();
      if (!res) throw new NotFoundException('Élément RAID non trouvé');
      return res;
    });
  }

  // --- Project Members & RACI ---
  async addProjectMember(tenantId: string, projectId: string, input: CreateProjectMemberInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .insert(projectMember)
        .values({
          tenantId,
          projectId,
          userId: input.userId,
          partyId: input.partyId,
          name: input.name,
          email: input.email,
          role: input.role,
          raciRole: input.raciRole,
          allocationPct: input.allocationPct,
        })
        .returning();
      return res;
    });
  }

  async removeProjectMember(tenantId: string, projectId: string, memberId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      await tx
        .delete(projectMember)
        .where(
          and(
            eq(projectMember.id, memberId),
            eq(projectMember.tenantId, tenantId),
            eq(projectMember.projectId, projectId)
          )
        );
      return { success: true };
    });
  }

  async setPlanItemRaci(tenantId: string, projectId: string, input: SetPlanItemRaciInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [targetItem] = await tx
        .select()
        .from(planItem)
        .where(and(eq(planItem.id, input.planItemId), eq(planItem.tenantId, tenantId), eq(planItem.projectId, projectId)));

      if (!targetItem) throw new NotFoundException('Élément de plan non trouvé');

      // If raciRole is null/undefined or empty, delete assignment
      if (!input.raciRole) {
        await tx
          .delete(planItemRaci)
          .where(
            and(
              eq(planItemRaci.tenantId, tenantId),
              eq(planItemRaci.projectId, projectId),
              eq(planItemRaci.planItemId, input.planItemId),
              eq(planItemRaci.projectMemberId, input.projectMemberId)
            )
          );
        return { success: true, action: 'removed' };
      }

      // Check if already assigned
      const [existing] = await tx
        .select()
        .from(planItemRaci)
        .where(
          and(
            eq(planItemRaci.tenantId, tenantId),
            eq(planItemRaci.projectId, projectId),
            eq(planItemRaci.planItemId, input.planItemId),
            eq(planItemRaci.projectMemberId, input.projectMemberId)
          )
        );

      if (existing) {
        const [updated] = await tx
          .update(planItemRaci)
          .set({
            raciRole: input.raciRole,
            updatedAt: new Date(),
          })
          .where(and(eq(planItemRaci.id, existing.id), eq(planItemRaci.tenantId, tenantId)))
          .returning();
        return updated;
      } else {
        const [created] = await tx
          .insert(planItemRaci)
          .values({
            tenantId,
            projectId,
            planItemId: input.planItemId,
            projectMemberId: input.projectMemberId,
            raciRole: input.raciRole,
          })
          .returning();
        return created;
      }
    });
  }

  // --- Task Evolution, Logs & Comments ---
  async addPlanItemUpdate(tenantId: string, projectId: string, itemId: string, input: CreatePlanItemUpdateInput, userId?: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [targetItem] = await tx
        .select()
        .from(planItem)
        .where(and(eq(planItem.id, itemId), eq(planItem.tenantId, tenantId), eq(planItem.projectId, projectId)));

      if (!targetItem) throw new NotFoundException('Élément de plan non trouvé');

      // Create update log entry
      const [updateEntry] = await tx
        .insert(planItemUpdate)
        .values({
          tenantId,
          planItemId: itemId,
          authorName: input.authorName,
          authorUserId: userId,
          progressPct: input.progressPct ?? targetItem.progressPct,
          status: input.status ?? targetItem.status,
          comment: input.comment,
          blockerReason: input.blockerReason,
        })
        .returning();

      // Automatically update planItem progress and status if provided
      const updateData: any = {};
      if (input.progressPct !== undefined) {
        updateData.progressPct = input.progressPct;
        if (input.progressPct === 100 && !input.status) {
          updateData.status = 'completed';
        } else if (input.progressPct > 0 && input.progressPct < 100 && targetItem.status === 'todo' && !input.status) {
          updateData.status = 'in_progress';
        }
      }
      if (input.status !== undefined) {
        updateData.status = input.status;
        if (input.status === 'completed' && input.progressPct === undefined) {
          updateData.progressPct = 100;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await tx
          .update(planItem)
          .set(updateData)
          .where(and(eq(planItem.id, itemId), eq(planItem.tenantId, tenantId), eq(planItem.projectId, projectId)));
      }

      await this.recalculateWbsAndProjectRollup(tx, tenantId, projectId);
      return updateEntry;
    });
  }

  // --- Deliverables & Validation ---
  async addPlanItemDeliverable(tenantId: string, projectId: string, itemId: string, input: CreatePlanItemDeliverableInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [targetItem] = await tx
        .select()
        .from(planItem)
        .where(and(eq(planItem.id, itemId), eq(planItem.tenantId, tenantId), eq(planItem.projectId, projectId)));

      if (!targetItem) throw new NotFoundException('Élément de plan non trouvé');

      const [deliverable] = await tx
        .insert(planItemDeliverable)
        .values({
          tenantId,
          planItemId: itemId,
          title: input.title,
          description: input.description,
          fileUrl: input.fileUrl,
          status: 'pending',
        })
        .returning();

      return deliverable;
    });
  }

  async verifyPlanItemDeliverable(tenantId: string, projectId: string, itemId: string, deliverableId: string, input: VerifyDeliverableInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [updated] = await tx
        .update(planItemDeliverable)
        .set({
          status: input.status,
          verifiedBy: input.verifiedBy,
          verifiedAt: new Date(),
        })
        .where(
          and(
            eq(planItemDeliverable.id, deliverableId),
            eq(planItemDeliverable.tenantId, tenantId),
            eq(planItemDeliverable.planItemId, itemId)
          )
        )
        .returning();

      if (!updated) throw new NotFoundException('Livrable introuvable');

      // Si le livrable est approuvé, basculer automatiquement la tâche à 100% et 'completed'
      if (input.status === 'approved') {
        await tx
          .update(planItem)
          .set({
            progressPct: 100,
            status: 'completed',
          })
          .where(and(eq(planItem.id, itemId), eq(planItem.tenantId, tenantId), eq(planItem.projectId, projectId)));
      }

      await this.recalculateWbsAndProjectRollup(tx, tenantId, projectId);
      return updated;
    });
  }

  /**
   * Recalcule la progression et les statuts WBS de bas en haut (Bottom-Up Rollup)
   * et ajuste l'avancement global ainsi que le statut du projet.
   */
  private async recalculateWbsAndProjectRollup(tx: any, tenantId: string, projectId: string) {
    const items = await tx
      .select()
      .from(planItem)
      .where(and(eq(planItem.tenantId, tenantId), eq(planItem.projectId, projectId)));

    if (items.length === 0) return;

    const itemMap = new Map<string, any>(items.map((i: any) => [i.id, { ...i }]));
    const childrenMap = new Map<string, string[]>();

    items.forEach((i: any) => {
      if (i.parentId) {
        if (!childrenMap.has(i.parentId)) childrenMap.set(i.parentId, []);
        childrenMap.get(i.parentId)!.push(i.id);
      }
    });

    // Déterminer la profondeur pour un traitement bottom-up (des feuilles vers les phases racines)
    const getDepth = (id: string): number => {
      const item = itemMap.get(id);
      if (!item || !item.parentId) return 0;
      return 1 + getDepth(item.parentId);
    };

    const sortedItems = [...items].sort((a: any, b: any) => getDepth(b.id) - getDepth(a.id));

    for (const item of sortedItems) {
      const childIds = childrenMap.get(item.id);
      if (childIds && childIds.length > 0) {
        const children = childIds.map((cid) => itemMap.get(cid)!);
        const totalWeight = children.reduce((acc, c) => acc + (c.durationDays || 1), 0);
        const weightedProgress = children.reduce(
          (acc, c) => acc + (c.progressPct || 0) * (c.durationDays || 1),
          0
        );
        const computedPct = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

        let computedStatus = 'todo';
        const allCompleted = children.every((c) => c.status === 'completed' || c.progressPct === 100);
        const anyBlocked = children.some((c) => c.status === 'blocked');
        const anyInProgress = children.some((c) => (c.progressPct || 0) > 0 || c.status === 'in_progress');

        if (allCompleted && computedPct === 100) {
          computedStatus = 'completed';
        } else if (anyBlocked) {
          computedStatus = 'blocked';
        } else if (anyInProgress || computedPct > 0) {
          computedStatus = 'in_progress';
        }

        const curr = itemMap.get(item.id)!;
        const prevPct = curr.progressPct;
        const prevStatus = curr.status;
        curr.progressPct = computedPct;
        curr.status = computedStatus;

        if (prevPct !== computedPct || prevStatus !== computedStatus) {
          await tx
            .update(planItem)
            .set({
              progressPct: computedPct,
              status: computedStatus,
            })
            .where(and(eq(planItem.id, item.id), eq(planItem.tenantId, tenantId), eq(planItem.projectId, projectId)));
        }
      }
    }

    // Calcul de l'avancement global et mise à jour du statut du projet
    const rootItems = items.filter((i: any) => !i.parentId).map((i: any) => itemMap.get(i.id)!);
    const totalRootWeight = rootItems.reduce((acc: number, r: any) => acc + (r.durationDays || 1), 0);
    const overallProgress = totalRootWeight > 0
      ? Math.round(rootItems.reduce((acc: number, r: any) => acc + (r.progressPct || 0) * (r.durationDays || 1), 0) / totalRootWeight)
      : 0;

    const [proj] = await tx.select().from(project).where(and(eq(project.id, projectId), eq(project.tenantId, tenantId)));
    if (proj) {
      let nextProjStatus = proj.status;
      if (overallProgress === 100 && proj.status !== 'archived' && proj.status !== 'closed') {
        nextProjStatus = 'completed';
      } else if (overallProgress > 0 && proj.status === 'planned') {
        nextProjStatus = 'active';
      }
      if (nextProjStatus !== proj.status) {
        await tx
          .update(project)
          .set({ status: nextProjStatus, updatedAt: new Date() })
          .where(and(eq(project.id, projectId), eq(project.tenantId, tenantId)));
      }
    }
  }
}

