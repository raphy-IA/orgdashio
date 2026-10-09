import React, { useState, useMemo } from 'react';
import { Button, Input } from '@orgdashio/ui';
import {
  CheckCircle2,
  Clock,
  Ban,
  CircleDot,
  DollarSign,
  PackageCheck,
  Search,
  Filter,
  Layers,
  LayoutGrid,
  ListTodo,
  User,
  Calendar,
  AlertTriangle,
  Send,
  Plus,
  FileSpreadsheet,
  Check,
  X,
  ExternalLink,
  Paperclip,
  TrendingUp,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Flag,
  FileText,
  BadgeAlert,
  ShieldCheck,
  Coins,
  Scale,
  Target,
  FileCheck2,
} from 'lucide-react';

interface TaskExecutionHubProps {
  projectId: string;
  planItems: any[];
  members: any[];
  raci: any[];
  budget: any;
  expenses: any[];
  deliverables: any[];
  updates: any[];
  onSelectTask: (task: any) => void;
  onUpdateTaskStatus?: (taskId: string, status: string, progressPct?: number) => Promise<void>;
  onAddExpense?: (expenseData: { budgetLineId: string; amount: number; vendor: string; date: string; notes?: string; planItemId?: string }) => Promise<void>;
  onApproveExpense?: (expenseId: string) => Promise<void>;
  onAddDeliverable?: (planItemId: string, deliverableData: { title: string; description?: string; fileUrl?: string }) => Promise<void>;
  onVerifyDeliverable?: (planItemId: string, deliverableId: string, status: 'approved' | 'rejected', verifiedBy?: string) => Promise<void>;
  onAddUpdateLog?: (planItemId: string, updateData: { progressPct: number; status: string; comment: string; blockerReason?: string }) => Promise<void>;
  isUpdating?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; badge: string; border: string }> = {
  todo: { label: 'À faire', icon: '⚪', color: 'text-slate-700', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-700 border-slate-200', border: 'border-slate-200' },
  in_progress: { label: 'En cours', icon: '⏳', color: 'text-indigo-700', bg: 'bg-indigo-50/60', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', border: 'border-indigo-200' },
  review: { label: 'En révision (Visa A requis)', icon: '🔍', color: 'text-amber-700', bg: 'bg-amber-50/60', badge: 'bg-amber-100 text-amber-900 border-amber-300 font-bold', border: 'border-amber-300' },
  blocked: { label: 'Bloqué', icon: '🔴', color: 'text-red-700', bg: 'bg-red-50/60', badge: 'bg-red-100 text-red-800 border-red-300 font-bold', border: 'border-red-300' },
  completed: { label: 'Terminé & Validé', icon: '✅', color: 'text-emerald-700', bg: 'bg-emerald-50/60', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', border: 'border-emerald-200' },
};

const CATEGORY_LABELS: Record<string, string> = {
  personnel: 'Personnel',
  material: 'Matériel & Équipement',
  transport: 'Transport & Déplacements',
  premises: 'Locaux & Hébergement',
  communication: 'Communication & Diffusion',
  training: 'Formation & Ateliers',
  subcontracting: 'Sous-traitance & Prestataires',
  administrative: 'Frais Administratifs',
  direct_aid: 'Aide Directe',
};

export function TaskExecutionHub({
  projectId,
  planItems,
  members,
  raci,
  budget,
  expenses,
  deliverables,
  updates,
  onSelectTask,
  onAddExpense,
  onApproveExpense,
  onAddDeliverable,
  onVerifyDeliverable,
  isUpdating,
}: TaskExecutionHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'expenses' | 'deliverables'>('tasks');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Task filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('all');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSummaryPhases, setShowSummaryPhases] = useState(false);

  // Expense form state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expBudgetLineId, setExpBudgetLineId] = useState('');
  const [expPlanItemId, setExpPlanItemId] = useState('');
  const [expVendor, setExpVendor] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');
  const [expFilterStatus, setExpFilterStatus] = useState('all');
  const [expFilterTask, setExpFilterTask] = useState('all');

  // Deliverable modal state
  const [showDelivModal, setShowDelivModal] = useState(false);
  const [delivPlanItemId, setDelivPlanItemId] = useState('');
  const [delivTitle, setDelivTitle] = useState('');
  const [delivDesc, setDelivDesc] = useState('');
  const [delivUrl, setDelivUrl] = useState('');

  const fmt = (val: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  // ── Helper: Map Assignee to Task ─────────────────────────────────────────
  const getTaskAssignee = (task: any) => {
    if (task.assigneePartyId) {
      const m = members.find((mem: any) => mem.id === task.assigneePartyId || mem.partyId === task.assigneePartyId || mem.userId === task.assigneePartyId);
      if (m) return m;
    }
    const raciEntry = raci.find((r: any) => r.planItemId === task.id && r.raciRole === 'R');
    if (raciEntry) {
      const m = members.find((mem: any) => mem.id === raciEntry.projectMemberId);
      if (m) return m;
    }
    return null;
  };

  const getTaskAccountable = (task: any) => {
    const raciEntry = raci.find((r: any) => r.planItemId === task.id && r.raciRole === 'A');
    if (raciEntry) {
      const m = members.find((mem: any) => mem.id === raciEntry.projectMemberId);
      if (m) return m;
    }
    return null;
  };

  // ── Helper: Extract Expenses linked to Task ──────────────────────────────
  const getTaskExpenses = (taskId: string, taskWbs: string) => {
    return expenses.filter((e: any) => {
      if (!e.notes) return false;
      return (
        e.notes.includes(`[Task:${taskId}]`) ||
        e.notes.includes(`[WBS:${taskWbs}]`) ||
        e.notes.includes(`[Tâche: ${taskWbs}]`)
      );
    });
  };

  const getTaskActualCost = (taskId: string, taskWbs: string) => {
    const taskExps = getTaskExpenses(taskId, taskWbs);
    return taskExps.reduce((s: number, e: any) => s + parseFloat(e.amount || '0'), 0);
  };

  // ── Phases & Activities List ─────────────────────────────────────────────
  const phases = useMemo(() => {
    return planItems.filter((p: any) => p.type === 'phase' || (p.type === 'activity' && !p.parentId));
  }, [planItems]);

  const tasksAndMilestones = useMemo(() => {
    return planItems.filter((p: any) => p.type === 'task' || p.type === 'milestone');
  }, [planItems]);

  // ── Filtered Tasks ────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasksAndMilestones.filter((item: any) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchWbs = (item.wbs || '').toLowerCase().includes(q);
        if (!matchTitle && !matchWbs) return false;
      }

      // Assignee
      if (selectedAssigneeId !== 'all') {
        const assignee = getTaskAssignee(item);
        if (!assignee || assignee.id !== selectedAssigneeId) return false;
      }

      // Phase / Parent
      if (selectedPhaseId !== 'all') {
        if (item.parentId !== selectedPhaseId && !item.wbs.startsWith(selectedPhaseId + '.')) {
          const parentItem = planItems.find((p: any) => p.id === item.parentId);
          if (!parentItem || (parentItem.id !== selectedPhaseId && parentItem.parentId !== selectedPhaseId)) {
            return false;
          }
        }
      }

      // Status
      if (statusFilter !== 'all') {
        if (statusFilter === 'blocked') {
          if (item.status !== 'blocked') return false;
        } else if (statusFilter === 'review') {
          if (item.status !== 'review') return false;
        } else if (statusFilter === 'overdue') {
          if (!item.endDate || item.status === 'completed') return false;
          const isOverdue = new Date(item.endDate) < new Date(new Date().toISOString().split('T')[0]);
          if (!isOverdue) return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [tasksAndMilestones, searchQuery, selectedAssigneeId, selectedPhaseId, statusFilter, members, raci, planItems]);

  // ── Financial Execution KPIs ─────────────────────────────────────────────
  const budgetLines = budget?.lines || [];
  const totalBudgetBAC = budgetLines.reduce((s: number, l: any) => s + parseFloat(l.amount || '0'), 0);
  const totalApprovedExpenses = expenses
    .filter((e: any) => e.status === 'approved' || e.status === 'paid')
    .reduce((s: number, e: any) => s + parseFloat(e.amount || '0'), 0);
  const totalPendingExpenses = expenses
    .filter((e: any) => e.status === 'submitted')
    .reduce((s: number, e: any) => s + parseFloat(e.amount || '0'), 0);
  const remainingBudget = totalBudgetBAC - totalApprovedExpenses;
  const budgetBurnRate = totalBudgetBAC > 0 ? (totalApprovedExpenses / totalBudgetBAC) * 100 : 0;

  // ── Deliverables KPIs ────────────────────────────────────────────────────
  const approvedDeliverablesCount = deliverables.filter((d: any) => d.status === 'approved').length;
  const pendingDeliverablesCount = deliverables.filter((d: any) => d.status === 'pending').length;
  const rejectedDeliverablesCount = deliverables.filter((d: any) => d.status === 'rejected').length;
  const deliverableValidationRate = deliverables.length > 0 ? (approvedDeliverablesCount / deliverables.length) * 100 : 0;

  // ── Submit Expense Handler ───────────────────────────────────────────────
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddExpense || !expBudgetLineId || !expAmount || !expVendor.trim()) return;

    let finalNotes = expNotes.trim();
    if (expPlanItemId) {
      const t = planItems.find((p: any) => p.id === expPlanItemId);
      if (t) {
        finalNotes = `[WBS:${t.wbs}] [Task:${t.id}] ${finalNotes}`.trim();
      }
    }

    await onAddExpense({
      budgetLineId: expBudgetLineId,
      amount: parseFloat(expAmount),
      vendor: expVendor.trim(),
      date: expDate,
      notes: finalNotes || undefined,
      planItemId: expPlanItemId || undefined,
    });

    setExpAmount('');
    setExpVendor('');
    setExpNotes('');
    setExpPlanItemId('');
    setShowExpenseModal(false);
  };

  // ── Submit Deliverable Handler ───────────────────────────────────────────
  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddDeliverable || !delivPlanItemId || !delivTitle.trim()) return;

    await onAddDeliverable(delivPlanItemId, {
      title: delivTitle.trim(),
      description: delivDesc.trim() || undefined,
      fileUrl: delivUrl.trim() || undefined,
    });

    setDelivTitle('');
    setDelivDesc('');
    setDelivUrl('');
    setDelivPlanItemId('');
    setShowDelivModal(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Sub-tab Navigation Pills ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl w-fit border border-slate-300 shadow-2xs">
          <button
            onClick={() => setActiveSubTab('tasks')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'tasks' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Tâches & Tableau Kanban ({tasksAndMilestones.length})
          </button>
          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'expenses' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            Dépenses Réelles & Factures ({expenses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('deliverables')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'deliverables' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="h-3.5 w-3.5" />
            Registre des Livrables ({deliverables.length})
          </button>
        </div>

        {/* Action button corresponding to active sub-tab */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'tasks' && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition ${
                  viewMode === 'kanban' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Vue Tableau Kanban"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition ${
                  viewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Vue Liste Opérationnelle"
              >
                <ListTodo className="h-3.5 w-3.5" />
                Liste
              </button>
            </div>
          )}

          {activeSubTab === 'expenses' && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`/api/v1/projects/${projectId}/expenses/export`, '_blank')}
                className="h-8 text-xs text-slate-700"
              >
                <FileSpreadsheet className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                Export CSV
              </Button>
              <Button
                size="sm"
                onClick={() => setShowExpenseModal(true)}
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Saisir une Dépense
              </Button>
            </div>
          )}

          {activeSubTab === 'deliverables' && (
            <Button
              size="sm"
              onClick={() => setShowDelivModal(true)}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Déposer un Livrable
            </Button>
          )}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* SOUS-ONGLET 1 : PILOTAGE DES TÂCHES & KANBAN                         */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="rounded-xl border bg-white p-3.5 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-2.5">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par titre ou WBS (ex: 1.2, audit, maquette)..."
                  className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
                />
              </div>

              {/* Filter by Assignee */}
              <div className="flex items-center gap-1 text-xs">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={selectedAssigneeId}
                  onChange={(e) => setSelectedAssigneeId(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:border-indigo-500"
                >
                  <option value="all">Tous les responsables</option>
                  {members.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Phase */}
              <div className="flex items-center gap-1 text-xs">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={selectedPhaseId}
                  onChange={(e) => setSelectedPhaseId(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:border-indigo-500"
                >
                  <option value="all">Toutes les phases WBS</option>
                  {phases.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.wbs} - {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Status Filters */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Statut :</span>
                {[
                  { id: 'all', label: `Toutes (${tasksAndMilestones.length})` },
                  { id: 'todo', label: `⚪ À faire (${tasksAndMilestones.filter((t) => (t.status || 'todo') === 'todo').length})` },
                  { id: 'in_progress', label: `⏳ En cours (${tasksAndMilestones.filter((t) => t.status === 'in_progress').length})` },
                  { id: 'review', label: `🔍 En révision (${tasksAndMilestones.filter((t) => t.status === 'review').length})` },
                  { id: 'blocked', label: `🔴 Bloquées (${tasksAndMilestones.filter((t) => t.status === 'blocked').length})` },
                  { id: 'completed', label: `✅ Terminées (${tasksAndMilestones.filter((t) => t.status === 'completed').length})` },
                  { id: 'overdue', label: `⚠️ En retard (${tasksAndMilestones.filter((t) => t.endDate && t.status !== 'completed' && new Date(t.endDate) < new Date(new Date().toISOString().split('T')[0])).length})` },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setStatusFilter(btn.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                      statusFilter === btn.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Collapsible toggle for mother phases */}
              {phases.length > 0 && (
                <button
                  onClick={() => setShowSummaryPhases(!showSummaryPhases)}
                  className="flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 font-semibold"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Synthèse Phases WBS</span>
                  {showSummaryPhases ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Phases Rollup Summary */}
          {showSummaryPhases && phases.length > 0 && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                Avancement Consolidé par Phase & Activité Parente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {phases.map((ph: any) => {
                  const childTasks = planItems.filter((p: any) => p.parentId === ph.id || p.wbs.startsWith(ph.wbs + '.'));
                  const completedChilds = childTasks.filter((c: any) => c.status === 'completed').length;
                  const blockedChilds = childTasks.filter((c: any) => c.status === 'blocked').length;

                  return (
                    <div key={ph.id} className="rounded-lg border bg-white p-3 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-indigo-600">{ph.wbs}</span>
                        <span className="text-xs font-bold text-slate-700">{ph.progressPct || 0}%</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 line-clamp-1">{ph.title}</p>
                      
                      <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, ph.progressPct || 0))}%` }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{completedChilds} / {childTasks.length} tâches terminées</span>
                        {blockedChilds > 0 && (
                          <span className="text-red-600 font-bold flex items-center gap-0.5">
                            <Ban className="h-2.5 w-2.5" /> {blockedChilds} bloquée{blockedChilds > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── KANBAN BOARD VIEW ── */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-start">
              {Object.entries(STATUS_CONFIG).map(([statusKey, cfg]) => {
                const columnTasks = filteredTasks.filter((p: any) => (p.status || 'todo') === statusKey);
                const colPv = columnTasks.reduce((s: number, t: any) => s + parseFloat(t.estimatedCost || '0'), 0);

                return (
                  <div key={statusKey} className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 min-h-[440px] shadow-2xs">
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 px-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{cfg.icon}</span>
                        <span className="text-xs font-bold text-slate-800">{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-2xs border border-slate-200">
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>

                    {/* Column Sub-stat: Total PV */}
                    {colPv > 0 && (
                      <div className="text-[10px] font-mono text-slate-400 px-1 mb-2">
                        Alloc : <span className="font-semibold text-slate-600">{fmt(colPv)}</span>
                      </div>
                    )}

                    {/* Column Cards */}
                    <div className="space-y-2.5 flex-1">
                      {columnTasks.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                          Aucune tâche
                        </div>
                      ) : (
                        columnTasks.map((task: any) => {
                          const assignee = getTaskAssignee(task);
                          const accountable = getTaskAccountable(task);
                          const taskUpdates = updates.filter((u: any) => u.planItemId === task.id);
                          const taskDelivs = deliverables.filter((d: any) => d.planItemId === task.id);
                          const isMilestone = task.type === 'milestone';
                          const actualSpent = getTaskActualCost(task.id, task.wbs);
                          const isOverdue = task.endDate && task.status !== 'completed' && new Date(task.endDate) < new Date(new Date().toISOString().split('T')[0]);

                          return (
                            <div
                              key={task.id}
                              onClick={() => onSelectTask(task)}
                              className={`group relative rounded-xl border bg-white p-3.5 shadow-2xs transition hover:shadow-md hover:border-indigo-500 cursor-pointer ${
                                task.status === 'blocked'
                                  ? 'border-red-300 bg-red-50/20'
                                  : task.status === 'review'
                                  ? 'border-amber-300 bg-amber-50/20'
                                  : isOverdue
                                  ? 'border-amber-200 bg-amber-50/10'
                                  : 'border-slate-200'
                              }`}
                            >
                              {/* Top row: WBS code + Immutable Status Badge */}
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                  {task.wbs}
                                </span>

                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${cfg.badge}`}
                                  title="Statut issu du traitement tracé"
                                >
                                  {cfg.icon} {cfg.label.split(' ')[0]}
                                </span>
                              </div>

                              {/* Title */}
                              <p className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition">
                                {task.title}
                              </p>

                              {/* Objectives / Deliverables Expected Badge */}
                              {(task.objectives || task.deliverablesExpected) && (
                                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500">
                                  {task.objectives && (
                                    <span className="flex items-center gap-0.5 text-indigo-600" title={`Objectif : ${task.objectives}`}>
                                      <Target className="h-2.5 w-2.5" /> Objectif défini
                                    </span>
                                  )}
                                  {task.deliverablesExpected && (
                                    <span className="flex items-center gap-0.5 text-emerald-600" title={`Livrable attendu : ${task.deliverablesExpected}`}>
                                      <FileCheck2 className="h-2.5 w-2.5" /> Livrable exigé
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Due Date & Assignee Row */}
                              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                                {task.endDate ? (
                                  <span
                                    className={`flex items-center gap-1 font-medium ${
                                      isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'
                                    }`}
                                  >
                                    {isMilestone ? (
                                      <Flag className="h-3 w-3 text-amber-500" />
                                    ) : (
                                      <Calendar className="h-3 w-3 text-slate-400" />
                                    )}
                                    {task.endDate}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Sans date</span>
                                )}

                                {assignee ? (
                                  <span
                                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-full"
                                    title={`Responsable Réalisation (R) : ${assignee.name}`}
                                  >
                                    <User className="h-2.5 w-2.5 text-indigo-600" />
                                    <span className="max-w-[70px] truncate">{assignee.name.split(' ')[0]}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-300">Non assigné</span>
                                )}
                              </div>

                              {/* Progress bar */}
                              <div className="mt-2.5">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                                  <span>Avancement</span>
                                  <span className="font-mono">{task.progressPct || 0}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      (task.progressPct || 0) >= 100
                                        ? 'bg-emerald-500'
                                        : task.status === 'blocked'
                                        ? 'bg-red-500'
                                        : task.status === 'review'
                                        ? 'bg-amber-500'
                                        : 'bg-indigo-600'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, task.progressPct || 0))}%` }}
                                  />
                                </div>
                              </div>

                              {/* Review Banner if in review */}
                              {task.status === 'review' && (
                                <div className="mt-2 rounded bg-amber-100/70 p-1 text-[10px] font-bold text-amber-900 text-center border border-amber-200">
                                  ⚠️ 100% déclaré • Visa formel RACI (A) requis
                                </div>
                              )}

                              {/* Financial indicator: PV vs AC */}
                              {(task.estimatedCost > 0 || actualSpent > 0) && (
                                <div className="mt-2 flex items-center justify-between text-[10px] font-mono border-t border-slate-100 pt-1.5">
                                  <span className="text-slate-500">PV: {fmt(task.estimatedCost || 0)}</span>
                                  <span className={actualSpent > (task.estimatedCost || 0) ? 'text-red-600 font-bold' : 'text-emerald-700 font-medium'}>
                                    AC: {fmt(actualSpent)}
                                  </span>
                                </div>
                              )}

                              {/* Card Footer: Logs, Deliverables & 1-click open */}
                              <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className="flex items-center gap-1 text-[10px] text-slate-500"
                                    title={`${taskUpdates.length} log(s) d'étape tracé(s)`}
                                  >
                                    <MessageSquare className="h-3 w-3 text-indigo-500" />
                                    {taskUpdates.length}
                                  </span>
                                  <span
                                    className="flex items-center gap-1 text-[10px] text-slate-500"
                                    title={`${taskDelivs.length} livrable(s) déposé(s)`}
                                  >
                                    <PackageCheck className="h-3 w-3 text-emerald-500" />
                                    {taskDelivs.length}
                                  </span>
                                </div>

                                <span className="text-[10px] font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-0.5">
                                  Traiter <ArrowRight className="h-2.5 w-2.5" />
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TABLE LIST VIEW ── */}
          {viewMode === 'table' && (
            <div className="overflow-hidden rounded-xl border bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-slate-50 font-semibold uppercase text-slate-500 text-[11px]">
                  <tr>
                    <th className="px-4 py-3">WBS</th>
                    <th className="px-4 py-3">Tâche, Objectifs & Livrables</th>
                    <th className="px-4 py-3">Responsable (R) & Approbateur (A)</th>
                    <th className="px-4 py-3">Échéance</th>
                    <th className="px-4 py-3 text-right">Budget (PV)</th>
                    <th className="px-4 py-3 text-right">Dépensé (AC)</th>
                    <th className="px-4 py-3">Avancement</th>
                    <th className="px-4 py-3">Statut Traité</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        Aucune tâche ne correspond aux filtres.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task: any) => {
                      const assignee = getTaskAssignee(task);
                      const accountable = getTaskAccountable(task);
                      const taskUpdates = updates.filter((u: any) => u.planItemId === task.id);
                      const taskDelivs = deliverables.filter((d: any) => d.planItemId === task.id);
                      const actualSpent = getTaskActualCost(task.id, task.wbs);
                      const isOverdue = task.endDate && task.status !== 'completed' && new Date(task.endDate) < new Date(new Date().toISOString().split('T')[0]);
                      const stCfg = STATUS_CONFIG[task.status || 'todo'] || STATUS_CONFIG.todo;

                      return (
                        <tr
                          key={task.id}
                          className={`hover:bg-slate-50 transition cursor-pointer ${
                            task.status === 'blocked' ? 'bg-red-50/20' : task.status === 'review' ? 'bg-amber-50/20' : ''
                          }`}
                          onClick={() => onSelectTask(task)}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-indigo-700">{task.wbs}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{task.title}</div>
                            {task.objectives && (
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                🎯 Objectif : {task.objectives}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                              <span>{taskUpdates.length} log{taskUpdates.length > 1 ? 's' : ''}</span>
                              <span>•</span>
                              <span>{taskDelivs.length} livrable{taskDelivs.length > 1 ? 's' : ''}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              {assignee ? (
                                <span className="inline-flex items-center gap-1 font-medium text-slate-800 text-xs">
                                  <span className="font-bold text-indigo-600 bg-indigo-50 px-1 rounded text-[10px]">R</span>
                                  {assignee.name}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">R: Non assigné</span>
                              )}
                              {accountable && (
                                <span className="block text-[10px] text-slate-500">
                                  <strong className="text-amber-700">A :</strong> {accountable.name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {task.endDate ? (
                              <span className={`font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                {task.endDate}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-700">
                            {fmt(task.estimatedCost || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            <span className={actualSpent > (task.estimatedCost || 0) ? 'text-red-600 font-bold' : 'text-emerald-700 font-medium'}>
                              {fmt(actualSpent)}
                            </span>
                          </td>
                          <td className="px-4 py-3 w-36">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    (task.progressPct || 0) >= 100
                                      ? 'bg-emerald-500'
                                      : task.status === 'blocked'
                                      ? 'bg-red-500'
                                      : task.status === 'review'
                                      ? 'bg-amber-500'
                                      : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, task.progressPct || 0))}%` }}
                                />
                              </div>
                              <span className="font-mono text-[10px] font-bold text-slate-600">{task.progressPct || 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${stCfg.badge}`}>
                              {stCfg.icon} {stCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSelectTask(task)}
                              className="h-7 text-[11px] text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold"
                            >
                              Traiter
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* SOUS-ONGLET 2 : DÉPENSES RÉELLES & FACTURES                          */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-5">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Budget Global (BAC)</span>
              <p className="mt-1 text-xl font-bold text-slate-900 font-mono">{fmt(totalBudgetBAC)}</p>
              <span className="text-[10px] text-slate-500">{budgetLines.length} lignes budgétaires</span>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Dépenses Réalisées (AC)</span>
              <p className="mt-1 text-xl font-bold text-emerald-700 font-mono">{fmt(totalApprovedExpenses)}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Approuvées & Payées</span>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Dépenses en Attente</span>
              <p className="mt-1 text-xl font-bold text-amber-700 font-mono">{fmt(totalPendingExpenses)}</p>
              <span className="text-[10px] text-amber-600">
                {expenses.filter((e: any) => e.status === 'submitted').length} en attente de validation
              </span>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">Solde Restant</span>
                <span className="font-mono text-xs font-bold text-indigo-900">{budgetBurnRate.toFixed(1)}% consommé</span>
              </div>
              <p className={`mt-1 text-xl font-bold font-mono ${remainingBudget < 0 ? 'text-red-600' : 'text-indigo-900'}`}>
                {fmt(remainingBudget)}
              </p>
              <div className="mt-2 h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    budgetBurnRate > 100 ? 'bg-red-500' : budgetBurnRate > 85 ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, budgetBurnRate))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filter Bar for Expenses */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-white p-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Filtrer :</span>
              {['all', 'submitted', 'approved', 'paid'].map((st) => (
                <button
                  key={st}
                  onClick={() => setExpFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                    expFilterStatus === st ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all'
                    ? `Toutes (${expenses.length})`
                    : st === 'submitted'
                    ? `En attente (${expenses.filter((e: any) => e.status === 'submitted').length})`
                    : st === 'approved'
                    ? `Approuvées (${expenses.filter((e: any) => e.status === 'approved').length})`
                    : `Payées (${expenses.filter((e: any) => e.status === 'paid').length})`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Tâche rattachée :</span>
              <select
                value={expFilterTask}
                onChange={(e) => setExpFilterTask(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700"
              >
                <option value="all">Toutes les tâches</option>
                {tasksAndMilestones.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.wbs} - {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="overflow-hidden rounded-xl border bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50 font-semibold uppercase text-slate-500 text-[11px]">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Fournisseur & Notes</th>
                  <th className="px-5 py-3">Ligne Budgétaire (CBS)</th>
                  <th className="px-5 py-3">Tâche / Activité (WBS)</th>
                  <th className="px-5 py-3 text-right">Montant</th>
                  <th className="px-5 py-3 text-center">Statut</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses
                  .filter((exp: any) => {
                    if (expFilterStatus !== 'all' && exp.status !== expFilterStatus) return false;
                    if (expFilterTask !== 'all') {
                      if (!exp.notes || !exp.notes.includes(`[Task:${expFilterTask}]`)) return false;
                    }
                    return true;
                  })
                  .map((exp: any) => {
                    const bl = budgetLines.find((b: any) => b.id === exp.budgetLineId);
                    let linkedTask: any = null;
                    if (exp.notes) {
                      const matchWbs = exp.notes.match(/\[WBS:([^\]]+)\]/);
                      if (matchWbs) {
                        linkedTask = planItems.find((p: any) => p.wbs === matchWbs[1]);
                      }
                      const matchTask = exp.notes.match(/\[Task:([^\]]+)\]/);
                      if (matchTask && !linkedTask) {
                        linkedTask = planItems.find((p: any) => p.id === matchTask[1]);
                      }
                    }

                    return (
                      <tr key={exp.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-3 text-slate-500 font-medium">{exp.date}</td>
                        <td className="px-5 py-3">
                          <div className="font-bold text-slate-900">{exp.vendor}</div>
                          {exp.notes && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {exp.notes.replace(/\[WBS:[^\]]+\]/g, '').replace(/\[Task:[^\]]+\]/g, '').trim()}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-700">
                          {bl ? (
                            <div>
                              <span className="font-semibold">{CATEGORY_LABELS[bl.categoryCode] || bl.categoryCode}</span>
                              <span className="text-[10px] text-slate-400 block">{bl.description}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Non spécifié</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {linkedTask ? (
                            <button
                              onClick={() => onSelectTask(linkedTask)}
                              className="text-left text-indigo-700 hover:underline flex items-center gap-1 font-medium"
                            >
                              <span className="font-mono bg-indigo-50 px-1 py-0.5 rounded text-[10px] font-bold text-indigo-800 border border-indigo-100">
                                {linkedTask.wbs}
                              </span>
                              <span className="line-clamp-1 max-w-[150px]">{linkedTask.title}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Non rattachée</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                          {fmt(parseFloat(exp.amount || '0'))}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              exp.status === 'approved' || exp.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : exp.status === 'submitted'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {exp.status === 'approved'
                              ? 'Approuvée'
                              : exp.status === 'submitted'
                              ? 'En attente'
                              : exp.status === 'paid'
                              ? 'Payée'
                              : exp.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {exp.status === 'submitted' && onApproveExpense && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onApproveExpense(exp.id)}
                              disabled={isUpdating}
                              className="h-7 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold"
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Approuver
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* SOUS-ONGLET 3 : REGISTRE DES LIVRABLES & QUALITÉ                     */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'deliverables' && (
        <div className="space-y-5">
          {/* Quality KPI Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total des Livrables</span>
              <p className="mt-1 text-xl font-bold text-slate-900">{deliverables.length}</p>
              <span className="text-[10px] text-slate-500">Documents & Preuves d'achèvement</span>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Livrables Validés</span>
              <p className="mt-1 text-xl font-bold text-emerald-700">{approvedDeliverablesCount}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Conformité validée ({deliverableValidationRate.toFixed(0)}%)</span>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">En Attente de Revue</span>
              <p className="mt-1 text-xl font-bold text-amber-700">{pendingDeliverablesCount}</p>
              <span className="text-[10px] text-amber-600">Nécessite vérification formelle</span>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-800">Rejetés / À réviser</span>
              <p className="mt-1 text-xl font-bold text-red-700">{rejectedDeliverablesCount}</p>
              <span className="text-[10px] text-red-600">À corriger par le responsable</span>
            </div>
          </div>

          {/* Deliverables Table */}
          <div className="overflow-hidden rounded-xl border bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50 font-semibold uppercase text-slate-500 text-[11px]">
                <tr>
                  <th className="px-5 py-3">Livrable & Document</th>
                  <th className="px-5 py-3">Tâche WBS Rattachée</th>
                  <th className="px-5 py-3 text-center">Statut</th>
                  <th className="px-5 py-3">Vérification Formelle</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliverables.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Aucun livrable déposé pour le moment.
                    </td>
                  </tr>
                ) : (
                  deliverables.map((deliv: any) => {
                    const parentTask = planItems.find((p: any) => p.id === deliv.planItemId);

                    return (
                      <tr key={deliv.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-3">
                          <div className="font-bold text-slate-900">{deliv.title}</div>
                          {deliv.description && <p className="text-[11px] text-slate-500 mt-0.5">{deliv.description}</p>}
                          {deliv.fileUrl && (
                            <a
                              href={deliv.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 mt-1"
                            >
                              <Paperclip className="h-3 w-3" />
                              Ouvrir la preuve / lien
                            </a>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {parentTask ? (
                            <button
                              onClick={() => onSelectTask(parentTask)}
                              className="text-left text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-1.5"
                            >
                              <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] font-bold text-indigo-800 border border-indigo-100">
                                {parentTask.wbs}
                              </span>
                              <span>{parentTask.title}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">Élément non trouvé</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                              deliv.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : deliv.status === 'rejected'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                          >
                            {deliv.status === 'approved' ? 'Validé' : deliv.status === 'rejected' ? 'Rejeté' : 'En attente'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {deliv.verifiedBy ? (
                            <div>
                              <span className="font-semibold text-slate-800">{deliv.verifiedBy}</span>
                              {deliv.verifiedAt && (
                                <span className="block text-[10px] text-slate-400">
                                  {new Date(deliv.verifiedAt).toLocaleDateString('fr-CA')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">En attente de revue</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {deliv.status === 'pending' && onVerifyDeliverable && (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onVerifyDeliverable(deliv.planItemId, deliv.id, 'approved', 'Gestionnaire de Projet')}
                                disabled={isUpdating}
                                className="h-7 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold"
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Valider
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onVerifyDeliverable(deliv.planItemId, deliv.id, 'rejected', 'Gestionnaire de Projet')}
                                disabled={isUpdating}
                                className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50 font-bold"
                              >
                                <X className="mr-1 h-3 w-3" />
                                Rejeter
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL : SAISIR UNE DÉPENSE RÉELLE (AC)                                */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Saisir une Dépense Réelle (Facture / Coût)</h3>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ligne Budgétaire (CBS) *</label>
                <select
                  required
                  value={expBudgetLineId}
                  onChange={(e) => setExpBudgetLineId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-indigo-500"
                >
                  <option value="">— Sélectionner une ligne budgétaire —</option>
                  {budgetLines.map((line: any) => (
                    <option key={line.id} value={line.id}>
                      {CATEGORY_LABELS[line.categoryCode] || line.categoryCode} — {line.description} ({fmt(parseFloat(line.amount || '0'))})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tâche / Activité rattachée (WBS) (Optionnel mais recommandé)</label>
                <select
                  value={expPlanItemId}
                  onChange={(e) => setExpPlanItemId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-indigo-500"
                >
                  <option value="">— Non rattachée à une tâche spécifique —</option>
                  {tasksAndMilestones.map((task: any) => (
                    <option key={task.id} value={task.id}>
                      {task.wbs} - {task.title} (Budget PV: {fmt(task.estimatedCost || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fournisseur / Bénéficiaire *</label>
                  <Input
                    required
                    value={expVendor}
                    onChange={(e) => setExpVendor(e.target.value)}
                    placeholder="Nom du fournisseur ou prestataire"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Montant (CAD) *</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date de la facture / dépense *</label>
                <Input
                  required
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Description / Numéro de facture</label>
                <textarea
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  rows={2}
                  placeholder="Détails, justificatif, n° de reçu..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowExpenseModal(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdating || !expBudgetLineId || !expAmount || !expVendor.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Enregistrer la dépense
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL : DÉPOSER UN LIVRABLE                                          */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {showDelivModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Déposer un Livrable / Preuve de Réalisation</h3>
              </div>
              <button onClick={() => setShowDelivModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeliverable} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tâche / Activité rattachée *</label>
                <select
                  required
                  value={delivPlanItemId}
                  onChange={(e) => setDelivPlanItemId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-indigo-500"
                >
                  <option value="">— Sélectionner la tâche concernée —</option>
                  {tasksAndMilestones.map((task: any) => (
                    <option key={task.id} value={task.id}>
                      {task.wbs} - {task.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Intitulé du livrable *</label>
                <Input
                  required
                  value={delivTitle}
                  onChange={(e) => setDelivTitle(e.target.value)}
                  placeholder="Ex: Rapport d'évaluation technique final"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Résumé des résultats</label>
                <textarea
                  value={delivDesc}
                  onChange={(e) => setDelivDesc(e.target.value)}
                  rows={2}
                  placeholder="Synthèse des réalisations, observations clés..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL du document / preuve (Drive, Cloud, etc.)</label>
                <Input
                  value={delivUrl}
                  onChange={(e) => setDelivUrl(e.target.value)}
                  placeholder="https://drive.google.com/... ou lien de partage"
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowDelivModal(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdating || !delivPlanItemId || !delivTitle.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Déposer le livrable
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
