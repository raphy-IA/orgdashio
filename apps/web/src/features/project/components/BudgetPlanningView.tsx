import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  PieChart,
  BarChart3,
  Layers,
  ArrowUpRight,
  Download,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Coins,
  Wallet,
  Calculator,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button, Input } from '@orgdashio/ui';

interface BudgetPlanningViewProps {
  projectId: string;
  projectStartDate?: string;
  planItems: any[];
  projBudget: any;
  expenses?: any[];
  members?: any[];
  onSelectTask: (task: any) => void;
  onUpdateTaskCost: (taskId: string, newCost: number) => Promise<void> | void;
  onAddBudgetLine: (categoryCode: string, description: string, amount: number) => Promise<void> | void;
  onUpdateBudgetLine: (lineId: string, categoryCode: string, description: string, amount: number) => Promise<void> | void;
  onDeleteBudgetLine: (lineId: string) => Promise<void> | void;
  isUpdating?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  personnel: 'Personnel & RH',
  equipment: 'Équipements & Matériel',
  travel: 'Déplacements & Logistique',
  subcontracting: 'Sous-traitance & Services',
  other: 'Autres dépenses',
  contingency: 'Réserve d’imprévus (Contingence)',
};

const TYPE_CONFIG: Record<string, { label: string; badgeClass: string; icon: string }> = {
  phase: { label: 'Phase', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200', icon: '📁' },
  activity: { label: 'Activité', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: '📑' },
  task: { label: 'Tâche', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📝' },
  milestone: { label: 'Jalon', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200', icon: '🚩' },
  deliverable: { label: 'Livrable', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '📦' },
};

export function BudgetPlanningView({
  projectId,
  projectStartDate,
  planItems,
  projBudget,
  expenses = [],
  members = [],
  onSelectTask,
  onUpdateTaskCost,
  onAddBudgetLine,
  onUpdateBudgetLine,
  onDeleteBudgetLine,
  isUpdating = false,
}: BudgetPlanningViewProps) {
  // Navigation tabs
  const [activeViewTab, setActiveViewTab] = useState<'cbs' | 'scurve' | 'lines' | 'analytics'>('cbs');

  // S-Curve Settings
  const [sCurveGranularity, setSCurveGranularity] = useState<'day' | 'week' | 'month'>('week');
  const [sCurveScaleMode, setSCurveScaleMode] = useState<'wbs_pv' | 'budget_bac'>('wbs_pv');

  // Inline Quick Edit in CBS
  const [editingCostTaskId, setEditingCostTaskId] = useState<string | null>(null);
  const [editCostVal, setEditCostVal] = useState<string>('');
  const [isSavingCost, setIsSavingCost] = useState(false);

  // Budget Line Form State
  const [showAddLineForm, setShowAddLineForm] = useState(false);
  const [blCategory, setBlCategory] = useState('personnel');
  const [blDescription, setBlDescription] = useState('');
  const [blAmount, setBlAmount] = useState('');
  const [isSavingLine, setIsSavingLine] = useState(false);

  // Edit Budget Line State
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editBlCategory, setEditBlCategory] = useState('');
  const [editBlDescription, setEditBlDescription] = useState('');
  const [editBlAmount, setEditBlAmount] = useState('');

  // Search in CBS
  const [cbsFilter, setCbsFilter] = useState('');

  // Currency Formatter
  const fmt = (val: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  // Financial Calculations
  const totalBudget = useMemo(() => {
    return (projBudget?.lines || []).reduce((acc: number, l: any) => acc + (parseFloat(l.amount) || 0), 0);
  }, [projBudget]);

  const totalWbsEstimatedCost = useMemo(() => {
    return planItems
      .filter((i: any) => i.type !== 'phase' && i.type !== 'activity')
      .reduce((acc: number, i: any) => acc + (parseFloat(i.estimatedCost) || 0), 0);
  }, [planItems]);

  const totalApprovedExpenses = useMemo(() => {
    return expenses
      .filter((e: any) => e.status === 'approved' || e.status === 'paid')
      .reduce((acc: number, e: any) => acc + (parseFloat(e.amount) || 0), 0);
  }, [expenses]);

  const remainingBudget = totalBudget - totalApprovedExpenses;
  const unallocatedBudget = totalBudget - totalWbsEstimatedCost;
  const budgetAllocationPct = totalBudget > 0 ? Math.round((totalWbsEstimatedCost / totalBudget) * 100) : 0;

  // Breakdown by Phase
  const phaseBreakdown = useMemo(() => {
    const phases = planItems.filter((i: any) => i.type === 'phase');
    return phases.map((phase: any) => {
      const childTasks = planItems.filter(
        (i: any) => i.type !== 'phase' && i.type !== 'activity' && (i.wbs === phase.wbs || (i.wbs || '').startsWith(phase.wbs + '.'))
      );
      const cost = childTasks.reduce((acc: number, t: any) => acc + (parseFloat(t.estimatedCost) || 0), 0);
      const pct = totalWbsEstimatedCost > 0 ? Math.round((cost / totalWbsEstimatedCost) * 100) : 0;
      return {
        id: phase.id,
        wbs: phase.wbs,
        title: phase.title,
        cost,
        pct,
        taskCount: childTasks.length,
      };
    });
  }, [planItems, totalWbsEstimatedCost]);

  // ── High Precision S-Curve Time Series (Day, Week, Month) ──
  const cashFlowTimeSeries = useMemo(() => {
    const activeTasks = planItems.filter(
      (i: any) => i.type !== 'phase' && i.type !== 'activity' && (parseFloat(i.estimatedCost) || 0) > 0
    );

    if (activeTasks.length === 0) return [];

    // 1. Calculate Daily Cost Map
    const dailyCostMap: Record<string, number> = {};
    let minDateStr = '';
    let maxDateStr = '';

    activeTasks.forEach((item: any) => {
      const cost = parseFloat(item.estimatedCost) || 0;
      const startStr = item.startDate || projectStartDate || new Date().toISOString().split('T')[0];
      const endStr = item.endDate || startStr;

      if (!minDateStr || startStr < minDateStr) minDateStr = startStr;
      if (!maxDateStr || endStr > maxDateStr) maxDateStr = endStr;

      const sDate = new Date(startStr + 'T00:00:00Z');
      const eDate = new Date(endStr + 'T00:00:00Z');

      const daysCount = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const costPerDay = cost / daysCount;

      const curr = new Date(sDate);
      while (curr <= eDate) {
        const dKey = curr.toISOString().split('T')[0];
        dailyCostMap[dKey] = (dailyCostMap[dKey] || 0) + costPerDay;
        curr.setUTCDate(curr.getUTCDate() + 1);
      }
    });

    if (!minDateStr || !maxDateStr) return [];

    // Helper: get ISO Week number
    const getWeekKey = (d: Date) => {
      const target = new Date(d.valueOf());
      const dayNr = (d.getUTCDay() + 6) % 7;
      target.setUTCDate(target.getUTCDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setUTCMonth(0, 1);
      if (target.getUTCDay() !== 4) {
        target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
      }
      const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
      return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    };

    // 2. Aggregate by chosen granularity
    const bucketMap: Record<string, { label: string; cost: number; dateRef: Date }> = {};

    const startDate = new Date(minDateStr + 'T00:00:00Z');
    const endDate = new Date(maxDateStr + 'T00:00:00Z');

    const cur = new Date(startDate);
    while (cur <= endDate) {
      const dKey = cur.toISOString().split('T')[0];
      const dayCost = dailyCostMap[dKey] || 0;

      let bKey = '';
      let bLabel = '';

      if (sCurveGranularity === 'day') {
        bKey = dKey;
        bLabel = `${cur.getUTCDate()}/${cur.getUTCMonth() + 1}`;
      } else if (sCurveGranularity === 'week') {
        bKey = getWeekKey(cur);
        bLabel = `S${bKey.split('-W')[1]} (${cur.getUTCDate()}/${cur.getUTCMonth() + 1})`;
      } else {
        // Month
        bKey = `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, '0')}`;
        bLabel = cur.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      }

      if (!bucketMap[bKey]) {
        bucketMap[bKey] = { label: bLabel, cost: 0, dateRef: new Date(cur) };
      }
      bucketMap[bKey].cost += dayCost;

      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const sortedBucketKeys = Object.keys(bucketMap).sort();
    let cumulative = 0;

    return sortedBucketKeys.map((key) => {
      const b = bucketMap[key];
      cumulative += b.cost;
      return {
        key,
        label: b.label,
        periodCost: Math.round(b.cost),
        cumulativeCost: Math.round(cumulative),
        pctOfTotal: totalWbsEstimatedCost > 0 ? Math.round((cumulative / totalWbsEstimatedCost) * 100) : 0,
      };
    });
  }, [planItems, projectStartDate, sCurveGranularity, totalWbsEstimatedCost]);

  // Quick Inline Cost Save Handler
  const handleSaveInlineCost = async (taskId: string) => {
    const val = parseFloat(editCostVal);
    if (isNaN(val) || val < 0) return;
    setIsSavingCost(true);
    try {
      await onUpdateTaskCost(taskId, val);
      setEditingCostTaskId(null);
    } catch (err) {
      console.error('Error saving cost:', err);
    } finally {
      setIsSavingCost(false);
    }
  };

  // Add Budget Line Handler
  const handleAddLineSubmit = async () => {
    const amt = parseFloat(blAmount);
    if (!blDescription.trim() || isNaN(amt) || amt < 0) return;
    setIsSavingLine(true);
    try {
      await onAddBudgetLine(blCategory, blDescription.trim(), amt);
      setBlDescription('');
      setBlAmount('');
      setShowAddLineForm(false);
    } catch (err) {
      console.error('Error adding budget line:', err);
    } finally {
      setIsSavingLine(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['Code WBS', 'Type', 'Titre', 'Date Début', 'Date Fin', 'Durée (j)', 'Coût Planifié (CAD)', 'Responsable'];
    const rows = planItems.map((item: any) => {
      const assignee = members.find((m: any) => m.id === item.assigneePartyId);
      return [
        `"${item.wbs}"`,
        `"${TYPE_CONFIG[item.type]?.label || item.type}"`,
        `"${(item.title || '').replace(/"/g, '""')}"`,
        `"${item.startDate || ''}"`,
        `"${item.endDate || ''}"`,
        item.durationDays || 0,
        parseFloat(item.estimatedCost) || 0,
        `"${assignee?.name || 'Non assigné'}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Budget_WBS_Projet_${projectId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // S-Curve SVG Geometry
  const sCurveWidth = 720;
  const sCurveHeight = 220;
  const sCurvePadding = 45;

  const maxChartY = sCurveScaleMode === 'wbs_pv'
    ? Math.max(totalWbsEstimatedCost * 1.15, 100)
    : Math.max(totalBudget * 1.1, totalWbsEstimatedCost * 1.1, 1000);

  const getSvgX = (index: number, total: number) => {
    if (total <= 1) return sCurveWidth / 2;
    return sCurvePadding + (index / (total - 1)) * (sCurveWidth - sCurvePadding * 2);
  };

  const getSvgY = (val: number, max: number) => {
    return sCurveHeight - sCurvePadding - (val / max) * (sCurveHeight - sCurvePadding * 2);
  };

  const sCurvePath = cashFlowTimeSeries.length > 0
    ? cashFlowTimeSeries
        .map((p, idx) => `${getSvgX(idx, cashFlowTimeSeries.length)},${getSvgY(p.cumulativeCost, maxChartY)}`)
        .join(' ')
    : '';

  return (
    <div className="space-y-6">
      {/* ── 1. BARRE KPI FINANCIERS & JAUGE D'ENGAGEMENT (TOP) ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Budget Alloué (BAC)</span>
            <Wallet className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{fmt(totalBudget)}</p>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>{projBudget?.lines?.length || 0} enveloppe(s)</span>
            <span className="font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">Top-Down</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Coûts Planifiés WBS (PV)</span>
            <Coins className="h-4 w-4 text-violet-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-violet-700">{fmt(totalWbsEstimatedCost)}</p>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>{planItems.filter((i: any) => i.type !== 'phase' && i.type !== 'activity').length} tâche(s) chiffrée(s)</span>
            <span className="font-semibold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded text-[10px]">Bottom-Up</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Jauge d'Engagement</span>
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                budgetAllocationPct > 100
                  ? 'text-rose-600'
                  : budgetAllocationPct > 85
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {budgetAllocationPct}%
            </span>
            <span className="text-xs text-slate-500">du budget alloué</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all duration-500 ${
                budgetAllocationPct > 100
                  ? 'bg-rose-500'
                  : budgetAllocationPct > 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, budgetAllocationPct)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">4. Marge / Réserve Restante</span>
            <ShieldCheck className="h-4 w-4 text-teal-600" />
          </div>
          <p
            className={`mt-2 text-2xl font-black ${
              unallocatedBudget >= 0 ? 'text-teal-700' : 'text-rose-600'
            }`}
          >
            {fmt(unallocatedBudget)}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>{unallocatedBudget >= 0 ? 'Disponible imprévus' : 'Dépassement'}</span>
            <span className={`font-bold ${unallocatedBudget >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
              {totalBudget > 0 ? `${Math.round((unallocatedBudget / totalBudget) * 100)}%` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. NAVIGATION ENTRE VUES BUDGÉTAIRES ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveViewTab('cbs')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              activeViewTab === 'cbs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Ventilation WBS (CBS)
          </button>
          <button
            type="button"
            onClick={() => setActiveViewTab('scurve')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              activeViewTab === 'scurve'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Courbe en S & Trésorerie
          </button>
          <button
            type="button"
            onClick={() => setActiveViewTab('analytics')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              activeViewTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <PieChart className="h-3.5 w-3.5" />
            Analyse & Répartition
          </button>
          <button
            type="button"
            onClick={() => setActiveViewTab('lines')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              activeViewTab === 'lines'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            Lignes Budgétaires ({projBudget?.lines?.length || 0})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            className="text-xs h-8 bg-white border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
            title="Exporter la ventilation budgétaire au format CSV"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* ── TAB 1: CBS (Cost Breakdown Structure) ── */}
      {activeViewTab === 'cbs' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b px-5 py-4 bg-slate-50/70">
            <div>
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-indigo-600" />
                Ventilation & Planification des Coûts par Structure WBS (CBS)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consultez, modifiez ou calculez le coût détaillé de chaque tâche (cliquez sur une ligne ou sur le bouton Calculer)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="text"
                placeholder="Filtrer les éléments..."
                value={cbsFilter}
                onChange={(e: any) => setCbsFilter(e.target.value)}
                className="h-8 text-xs w-48 bg-white"
              />
              <span className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full font-mono">
                Total WBS : {fmt(totalWbsEstimatedCost)}
              </span>
            </div>
          </div>

          {planItems.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Aucun élément dans le WBS pour ventiler les coûts. Créez des phases et des tâches dans l'onglet WBS.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Code WBS</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left">Élément de travail</th>
                    <th className="px-5 py-3 text-left">Période</th>
                    <th className="px-5 py-3 text-right">Coût Planifié (PV)</th>
                    <th className="px-5 py-3 text-right">% WBS</th>
                    <th className="px-5 py-3 text-left">Responsable (RACI)</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...planItems]
                    .filter((item: any) => {
                      if (!cbsFilter.trim()) return true;
                      const f = cbsFilter.toLowerCase();
                      return (
                        (item.wbs || '').toLowerCase().includes(f) ||
                        (item.title || '').toLowerCase().includes(f)
                      );
                    })
                    .sort((a: any, b: any) => a.wbs.localeCompare(b.wbs, undefined, { numeric: true }))
                    .map((item: any) => {
                      const depth = Math.max(0, (item.wbs || '').split('.').length - 1);
                      const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.task;
                      const cost = parseFloat(item.estimatedCost || '0');
                      const pctBudget = totalWbsEstimatedCost > 0 ? Math.round((cost / totalWbsEstimatedCost) * 100) : 0;
                      const isContainer = item.type === 'phase' || item.type === 'activity';
                      const isMilestone = item.type === 'milestone';
                      const assignee = members.find((m: any) => m.id === item.assigneePartyId);
                      const isInlineEditing = editingCostTaskId === item.id;

                      return (
                        <tr
                          key={item.id}
                          onClick={() => {
                            if (!isInlineEditing) onSelectTask(item);
                          }}
                          className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                            isContainer ? 'bg-slate-50/40 font-semibold' : ''
                          }`}
                          title="Cliquer pour ouvrir le modal et calculer les coûts"
                        >
                          <td className="px-5 py-3 font-mono text-xs font-bold text-slate-600">{item.wbs}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${typeCfg.badgeClass}`}>
                              <span>{typeCfg.icon}</span>
                              {typeCfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div
                              className={`flex items-center gap-1.5 ${
                                item.type === 'phase'
                                  ? 'text-purple-950 font-bold text-sm'
                                  : item.type === 'activity'
                                  ? 'text-indigo-950 font-semibold'
                                  : isMilestone
                                  ? 'text-amber-900 font-medium'
                                  : 'text-slate-800'
                              }`}
                              style={{ paddingLeft: `${depth * 16}px` }}
                            >
                              {depth > 0 && <span className="text-slate-300 font-mono">↳</span>}
                              <span>{item.title}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500 font-mono">
                            {item.startDate && item.endDate ? (
                              <span>{item.startDate} → {item.endDate}</span>
                            ) : item.startDate ? (
                              <span>{item.startDate}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td
                            className="px-5 py-3 text-right"
                            onClick={(e: any) => {
                              if (!isContainer && !isMilestone) {
                                e.stopPropagation();
                              }
                            }}
                          >
                            {isContainer ? (
                              <span className="font-bold text-indigo-900 font-mono text-sm">
                                {fmt(cost)}
                              </span>
                            ) : isMilestone ? (
                              <span className="text-amber-700 font-mono text-xs font-bold">0 $</span>
                            ) : isInlineEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Input
                                  type="number"
                                  autoFocus
                                  value={editCostVal}
                                  onChange={(e: any) => setEditCostVal(e.target.value)}
                                  onKeyDown={(e: any) => {
                                    if (e.key === 'Enter') handleSaveInlineCost(item.id);
                                    if (e.key === 'Escape') setEditingCostTaskId(null);
                                  }}
                                  className="h-7 w-24 text-right font-mono font-bold text-xs bg-white border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineCost(item.id)}
                                  disabled={isSavingCost}
                                  className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                                  title="Enregistrer le coût"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCostTaskId(null)}
                                  className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300"
                                  title="Annuler"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-800 text-sm">{fmt(cost)}</span>
                                <button
                                  type="button"
                                  onClick={(e: any) => {
                                    e.stopPropagation();
                                    setEditingCostTaskId(item.id);
                                    setEditCostVal(String(cost));
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                  title="Saisie directe du coût"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full ${isContainer ? 'bg-purple-500' : 'bg-indigo-500'}`}
                                  style={{ width: `${Math.min(100, pctBudget)}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs text-slate-600 w-8 text-right font-bold">{pctBudget}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-600">
                            {assignee ? (
                              <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                                <Users className="h-3 w-3 text-slate-400" />
                                {assignee.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Non assigné</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e: any) => {
                                  e.stopPropagation();
                                  onSelectTask(item);
                                }}
                                className="h-7 px-2.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-semibold"
                              >
                                Détails
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                  <tr>
                    <td colSpan={4} className="px-5 py-3 text-sm">
                      Total Coûts Prévisionnels WBS (Planned Value - PV)
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-indigo-900 text-base">
                      {fmt(totalWbsEstimatedCost)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono">100%</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: COURBE EN S & TRÉSORERIE (MULTI-GRANULARITY & ADAPTIVE SCALE) ── */}
      {activeViewTab === 'scurve' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  Courbe en S Prévisionnelle & Étalement Temporel des Dépenses (Cash Flow)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Échéancier financier calculé au prorata des jours de chaque tâche planifiée
                </p>
              </div>

              {/* Granularity & Scale Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Granularity Switcher */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSCurveGranularity('day')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      sCurveGranularity === 'day' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Par Jour
                  </button>
                  <button
                    type="button"
                    onClick={() => setSCurveGranularity('week')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      sCurveGranularity === 'week' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Par Semaine
                  </button>
                  <button
                    type="button"
                    onClick={() => setSCurveGranularity('month')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      sCurveGranularity === 'month' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Par Mois
                  </button>
                </div>

                {/* Scale Switcher */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSCurveScaleMode('wbs_pv')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      sCurveScaleMode === 'wbs_pv' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Ajuste l'échelle verticale sur le total des coûts planifiés WBS"
                  >
                    Zoom Courbe PV ({fmt(totalWbsEstimatedCost)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSCurveScaleMode('budget_bac')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      sCurveScaleMode === 'budget_bac' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Ajuste l'échelle sur le budget total alloué (BAC)"
                  >
                    Échelle Budget BAC ({fmt(totalBudget)})
                  </button>
                </div>
              </div>
            </div>

            {cashFlowTimeSeries.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-400">
                Aucune date ou coût planifié sur les tâches pour générer la courbe en S. Définissez les dates et coûts des tâches dans le WBS.
              </div>
            ) : (
              <div className="space-y-6">
                {/* SVG Visual S-Curve */}
                <div className="overflow-x-auto bg-slate-50/40 rounded-xl p-2 border border-slate-100">
                  <svg
                    viewBox={`0 0 ${sCurveWidth} ${sCurveHeight}`}
                    className="w-full h-auto max-h-[280px] select-none"
                  >
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                      const y = sCurveHeight - sCurvePadding - pct * (sCurveHeight - sCurvePadding * 2);
                      const val = maxChartY * pct;
                      return (
                        <g key={idx}>
                          <line
                            x1={sCurvePadding}
                            y1={y}
                            x2={sCurveWidth - sCurvePadding}
                            y2={y}
                            stroke="#e2e8f0"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={sCurvePadding - 6}
                            y={y + 3}
                            textAnchor="end"
                            fontSize="9"
                            fill="#94a3b8"
                            fontFamily="monospace"
                          >
                            {fmt(val)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Reference Line for Total WBS if in BAC mode */}
                    {sCurveScaleMode === 'budget_bac' && totalWbsEstimatedCost > 0 && (
                      <g>
                        <line
                          x1={sCurvePadding}
                          y1={getSvgY(totalWbsEstimatedCost, maxChartY)}
                          x2={sCurveWidth - sCurvePadding}
                          y2={getSvgY(totalWbsEstimatedCost, maxChartY)}
                          stroke="#8b5cf6"
                          strokeWidth="1.5"
                          strokeDasharray="6 3"
                        />
                        <text
                          x={sCurveWidth - sCurvePadding}
                          y={getSvgY(totalWbsEstimatedCost, maxChartY) - 5}
                          textAnchor="end"
                          fontSize="9"
                          fill="#7c3aed"
                          fontWeight="bold"
                        >
                          Cible WBS : {fmt(totalWbsEstimatedCost)}
                        </text>
                      </g>
                    )}

                    {/* Period Bars (Flux Périodique) */}
                    {cashFlowTimeSeries.map((p, idx) => {
                      const x = getSvgX(idx, cashFlowTimeSeries.length);
                      const availableWidth = (sCurveWidth - sCurvePadding * 2) / Math.max(1, cashFlowTimeSeries.length);
                      const barWidth = Math.max(6, Math.min(28, availableWidth * 0.6));
                      const barH = (p.periodCost / maxChartY) * (sCurveHeight - sCurvePadding * 2);
                      const barY = sCurveHeight - sCurvePadding - barH;

                      // Skip some X labels if too crowded in day mode
                      const showLabel =
                        sCurveGranularity !== 'day' ||
                        idx % Math.ceil(cashFlowTimeSeries.length / 10) === 0 ||
                        idx === cashFlowTimeSeries.length - 1;

                      return (
                        <g key={`bar-${idx}`}>
                          <rect
                            x={x - barWidth / 2}
                            y={barY}
                            width={barWidth}
                            height={Math.max(1, barH)}
                            rx={2}
                            fill="#c7d2fe"
                            opacity={0.85}
                          />
                          {showLabel && (
                            <text
                              x={x}
                              y={sCurveHeight - sCurvePadding + 16}
                              textAnchor="middle"
                              fontSize="9"
                              fill="#64748b"
                              fontWeight="600"
                            >
                              {p.label}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* S-Curve Area Gradient */}
                    <defs>
                      <linearGradient id="scurveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {cashFlowTimeSeries.length > 1 && (
                      <polygon
                        points={`${getSvgX(0, cashFlowTimeSeries.length)},${sCurveHeight - sCurvePadding} ${sCurvePath} ${getSvgX(cashFlowTimeSeries.length - 1, cashFlowTimeSeries.length)},${sCurveHeight - sCurvePadding}`}
                        fill="url(#scurveGradient)"
                      />
                    )}

                    {/* S-Curve Continuous Line */}
                    <polyline
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={sCurvePath}
                    />

                    {/* S-Curve Data Dots */}
                    {cashFlowTimeSeries.map((p, idx) => {
                      const x = getSvgX(idx, cashFlowTimeSeries.length);
                      const y = getSvgY(p.cumulativeCost, maxChartY);
                      const isLast = idx === cashFlowTimeSeries.length - 1;
                      const isFirst = idx === 0;

                      // Display label only for a subset if many points
                      const showVal =
                        isLast ||
                        isFirst ||
                        cashFlowTimeSeries.length <= 8 ||
                        idx % Math.ceil(cashFlowTimeSeries.length / 5) === 0;

                      return (
                        <g key={`dot-${idx}`}>
                          <circle cx={x} cy={y} r="5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2.5" />
                          <circle cx={x} cy={y} r="2" fill="#4f46e5" />
                          {showVal && (
                            <text
                              x={x}
                              y={y - 9}
                              textAnchor="middle"
                              fontSize="9"
                              fontWeight="bold"
                              fill="#3730a3"
                              fontFamily="monospace"
                            >
                              {fmt(p.cumulativeCost)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* S-Curve Legend & Metrics */}
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-indigo-600"></span>
                      <span className="font-semibold text-slate-800">Courbe en S (PV Cumulé)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-indigo-200"></span>
                      <span className="font-semibold text-slate-800">Décaissement de la période</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span>Points tracés : <strong>{cashFlowTimeSeries.length}</strong></span>
                    <span>Durée couverte : <strong>{cashFlowTimeSeries[0]?.label} → {cashFlowTimeSeries[cashFlowTimeSeries.length - 1]?.label}</strong></span>
                  </div>
                </div>

                {/* Detailed Period Table */}
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b font-semibold uppercase text-slate-600">
                      <tr>
                        <th className="px-4 py-2.5 text-left">Période ({sCurveGranularity === 'day' ? 'Jour' : sCurveGranularity === 'week' ? 'Semaine' : 'Mois'})</th>
                        <th className="px-4 py-2.5 text-right">Décaissement Prévu (PV)</th>
                        <th className="px-4 py-2.5 text-right">Cumul Prévisionnel</th>
                        <th className="px-4 py-2.5 text-right">% Progression Financière</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {cashFlowTimeSeries.map((p) => (
                        <tr key={p.key} className="hover:bg-slate-50/80">
                          <td className="px-4 py-2.5 font-sans font-bold text-slate-800">{p.label}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-indigo-700">{fmt(p.periodCost)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900">{fmt(p.cumulativeCost)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{p.pctOfTotal}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: VISUAL ANALYTICS & BREAKDOWN ── */}
      {activeViewTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phase Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-3">
              <PieChart className="h-4 w-4 text-purple-600" />
              Répartition des Coûts par Phase WBS
            </h3>
            {phaseBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400">Aucune phase définie dans le projet.</p>
            ) : (
              <div className="space-y-4">
                {phaseBreakdown.map((ph: any) => (
                  <div key={ph.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        {ph.wbs} — {ph.title}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-indigo-900">{fmt(ph.cost)}</span>
                        <span className="text-slate-500 font-medium">({ph.pct}%)</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                        style={{ width: `${Math.min(100, ph.pct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">{ph.taskCount} tâche(s) incluse(s)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reconciliation Top-Down vs Bottom-Up */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-3">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Rapprochement Budgétaire (Top-Down vs Bottom-Up)
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Enveloppe Allouée (Top-Down)</span>
                  <span className="text-[11px] text-slate-500">Total des lignes budgétaires de direction</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">{fmt(totalBudget)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/70 border border-indigo-200">
                <div>
                  <span className="font-bold text-indigo-900 block">Coûts Opérationnels (Bottom-Up)</span>
                  <span className="text-[11px] text-indigo-700">Somme des tâches planifiées sur le terrain</span>
                </div>
                <span className="font-mono font-bold text-indigo-900 text-sm">{fmt(totalWbsEstimatedCost)}</span>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  unallocatedBudget >= 0
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/70 border-rose-200 text-rose-950'
                }`}
              >
                <div>
                  <span className="font-bold block">
                    {unallocatedBudget >= 0 ? 'Marge de prévoyance restante' : 'Écart / Dépassement budgétaire'}
                  </span>
                  <span className="text-[11px] opacity-80">Différence Enveloppe - Coûts WBS</span>
                </div>
                <span className="font-mono font-bold text-sm">
                  {unallocatedBudget >= 0 ? `+${fmt(unallocatedBudget)}` : fmt(unallocatedBudget)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: FORMAL BUDGET LINES ── */}
      {activeViewTab === 'lines' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4 bg-slate-50/70">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Lignes Budgétaires par Catégorie Métier</h2>
              <p className="text-xs text-slate-500 mt-0.5">Budget formel ventilé par poste de dépense (Personnel, Matériel, etc.)</p>
            </div>
            <Button size="sm" onClick={() => setShowAddLineForm(!showAddLineForm)} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Ajouter une ligne
            </Button>
          </div>

          {showAddLineForm && (
            <div className="border-b bg-indigo-50/60 p-4 space-y-3">
              <h4 className="text-xs font-bold text-indigo-900">Nouvelle ligne budgétaire</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Catégorie</label>
                  <select
                    value={blCategory}
                    onChange={(e: any) => setBlCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Description *</label>
                  <Input
                    value={blDescription}
                    onChange={(e: any) => setBlDescription(e.target.value)}
                    placeholder="Ex: Honoraires coordonnateur..."
                    className="bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Montant (CAD) *</label>
                  <Input
                    type="number"
                    value={blAmount}
                    onChange={(e: any) => setBlAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-white text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleAddLineSubmit}
                  disabled={!blDescription.trim() || !blAmount || isSavingLine}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isSavingLine ? 'Enregistrement...' : 'Enregistrer la ligne'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddLineForm(false)} className="text-xs">
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {(!projBudget?.lines || projBudget.lines.length === 0) ? (
            <div className="p-8 text-center text-sm text-slate-400">Aucune ligne budgétaire définie.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Catégorie</th>
                  <th className="px-5 py-3 text-left">Description</th>
                  <th className="px-5 py-3 text-right">Montant alloué</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projBudget.lines.map((line: any) => {
                  const isEditing = editingLineId === line.id;
                  if (isEditing) {
                    return (
                      <tr key={line.id} className="bg-indigo-50/50">
                        <td className="px-5 py-2.5">
                          <select
                            value={editBlCategory}
                            onChange={(e: any) => setEditBlCategory(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium"
                          >
                            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-2.5">
                          <Input
                            value={editBlDescription}
                            onChange={(e: any) => setEditBlDescription(e.target.value)}
                            placeholder="Description"
                            className="bg-white text-xs"
                          />
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <Input
                            type="number"
                            value={editBlAmount}
                            onChange={(e: any) => setEditBlAmount(e.target.value)}
                            placeholder="0.00"
                            className="bg-white text-xs text-right font-semibold"
                          />
                        </td>
                        <td className="px-5 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs bg-indigo-600 text-white font-bold"
                              disabled={!editBlDescription.trim() || !editBlAmount}
                              onClick={async () => {
                                await onUpdateBudgetLine(
                                  line.id,
                                  editBlCategory,
                                  editBlDescription.trim(),
                                  parseFloat(editBlAmount)
                                );
                                setEditingLineId(null);
                              }}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Enregistrer
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => setEditingLineId(null)}
                            >
                              Annuler
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={line.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {CATEGORY_LABELS[line.categoryCode] || line.categoryCode}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-800">{line.description}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                        {fmt(parseFloat(line.amount) || 0)}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingLineId(line.id);
                              setEditBlCategory(line.categoryCode || 'other');
                              setEditBlDescription(line.description || '');
                              setEditBlAmount(String(line.amount || '0'));
                            }}
                            className="h-7 px-2 text-xs text-slate-600 hover:text-indigo-600"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Modifier
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Supprimer la ligne "${line.description}" ?`)) {
                                onDeleteBudgetLine(line.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Supprimer cette ligne"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                <tr>
                  <td colSpan={2} className="px-5 py-3">Total Lignes Budgétaires (Budget Formel)</td>
                  <td className="px-5 py-3 text-right font-mono text-indigo-900">{fmt(totalBudget)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
