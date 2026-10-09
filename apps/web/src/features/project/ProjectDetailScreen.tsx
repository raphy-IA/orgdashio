import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@orgdashio/ui';
import {
  ArrowLeft,
  FolderKanban,
  Target,
  ListTodo,
  DollarSign,
  AlertTriangle,
  HandCoins,
  Plus,
  FileSpreadsheet,
  ChevronRight,
  CheckCircle2,
  Clock,
  Ban,
  CircleDot,
  Flame,
  TrendingUp,
  BarChart3,
  Pencil,
  Check,
  X,
  Flag,
  Layers,
  Milestone as MilestoneIcon,
  PackageCheck,
  ListOrdered,
  Calendar,
  Users,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  ExternalLink,
  Paperclip,
  Trash2,
  Send,
  Sparkles,
  Network,
  GitBranch,
  Scale,
  Sliders,
  Split,
  Link2,
  RefreshCw,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { PertNetworkDiagram } from './components/PertNetworkDiagram';
import { GanttChartInteractive } from './components/GanttChartInteractive';
import { EarnedValueManagementView } from './components/EarnedValueManagementView';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'strategy' | 'planning' | 'execution' | 'monitoring';

interface ProjectMember {
  id: string;
  projectId: string;
  userId?: string | null;
  partyId?: string | null;
  name: string;
  email?: string | null;
  role: 'manager' | 'coordinator' | 'contributor' | 'stakeholder' | 'expert' | 'beneficiary_rep';
  raciRole: 'R' | 'A' | 'C' | 'I';
  allocationPct: number;
  createdAt: string;
}

interface PlanItemRaci {
  id: string;
  projectId: string;
  planItemId: string;
  projectMemberId: string;
  raciRole: 'R' | 'A' | 'C' | 'I';
  createdAt: string;
  updatedAt: string;
}

interface PlanItemUpdate {
  id: string;
  planItemId: string;
  authorName: string;
  authorUserId?: string | null;
  progressPct?: number | null;
  status?: string | null;
  comment: string;
  blockerReason?: string | null;
  createdAt: string;
}

interface PlanItemDeliverable {
  id: string;
  planItemId: string;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
}

interface PlanItem {
  id: string;
  parentId?: string | null;
  resultNodeId?: string | null;
  type: 'phase' | 'activity' | 'task' | 'milestone' | 'deliverable';
  wbs: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number | null;
  estimatedCost?: string | number | null;
  optimisticDays?: number | null;
  mostLikelyDays?: number | null;
  pessimisticDays?: number | null;
  progressPct?: number | null;
  status: 'todo' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  assigneePartyId?: string | null;
}

interface ResultNode {
  id: string;
  parentId?: string | null;
  level: 'impact' | 'outcome' | 'output';
  title: string;
  description?: string | null;
}

interface RaidItem {
  id: string;
  type: 'risk' | 'issue' | 'assumption' | 'dependency';
  title: string;
  description?: string | null;
  probability?: number | null;
  impact?: number | null;
  ownerName?: string | null;
  status?: string | null;
}

const MEMBER_ROLE_LABELS: Record<string, { label: string; color: string }> = {
  manager: { label: 'Gestionnaire de Projet', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  coordinator: { label: 'Coordinateur d\'Activité', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  contributor: { label: 'Contributeur / Exécutant', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  stakeholder: { label: 'Partie Prenante Clé', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  expert: { label: 'Expert / Consultant', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  beneficiary_rep: { label: 'Représentant Bénéficiaires', color: 'bg-rose-100 text-rose-800 border-rose-200' },
};

const RACI_CONFIG: Record<
  string,
  { label: string; shortLabel: string; desc: string; color: string; badgeCls: string; pillCls: string }
> = {
  R: {
    label: 'Réalisateur (Responsible)',
    shortLabel: 'R',
    desc: 'Effectue le travail et produit les résultats au quotidien',
    color: 'bg-indigo-600 text-white',
    badgeCls: 'bg-indigo-600 text-white font-bold',
    pillCls: 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold',
  },
  A: {
    label: 'Approbateur / Décideur (Accountable)',
    shortLabel: 'A',
    desc: 'Porte la responsabilité globale du résultat et valide la conformité (1 seul recommandé par ligne)',
    color: 'bg-amber-600 text-white',
    badgeCls: 'bg-amber-600 text-white font-bold',
    pillCls: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
  },
  C: {
    label: 'Consulté (Consulted)',
    shortLabel: 'C',
    desc: 'Fournit son expertise ou des avis préalables requis',
    color: 'bg-purple-600 text-white',
    badgeCls: 'bg-purple-600 text-white font-bold',
    pillCls: 'bg-purple-100 text-purple-800 border border-purple-300 font-bold',
  },
  I: {
    label: 'Informé (Informed)',
    shortLabel: 'I',
    desc: 'Tenu au courant de l’avancement et de la finalisation',
    color: 'bg-teal-600 text-white',
    badgeCls: 'bg-teal-600 text-white font-bold',
    pillCls: 'bg-teal-100 text-teal-800 border border-teal-300 font-bold',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  todo: { label: 'À faire', color: 'text-slate-500 bg-slate-100', icon: <CircleDot className="h-3 w-3" /> },
  in_progress: { label: 'En cours', color: 'text-indigo-700 bg-indigo-100', icon: <Clock className="h-3 w-3" /> },
  blocked: { label: 'Bloqué', color: 'text-red-700 bg-red-100', icon: <Ban className="h-3 w-3" /> },
  completed: { label: 'Terminé', color: 'text-emerald-700 bg-emerald-100', icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelled: { label: 'Annulé', color: 'text-slate-400 bg-slate-100', icon: <X className="h-3 w-3" /> },
};

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode; badgeClass: string }
> = {
  phase: {
    label: 'Phase',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    badgeClass: 'bg-purple-100 text-purple-800 border border-purple-200',
    icon: <Layers className="h-3.5 w-3.5 text-purple-600" />,
  },
  activity: {
    label: 'Activité',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    badgeClass: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    icon: <ListOrdered className="h-3.5 w-3.5 text-indigo-600" />,
  },
  task: {
    label: 'Tâche',
    color: 'text-sky-700 bg-sky-50 border-sky-200',
    badgeClass: 'bg-sky-100 text-sky-800 border border-sky-200',
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />,
  },
  milestone: {
    label: 'Jalon',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold',
    icon: <Flag className="h-3.5 w-3.5 text-amber-600 fill-amber-500/20" />,
  },
  deliverable: {
    label: 'Livrable',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    icon: <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />,
  },
};

const LEVEL_CONFIG = {
  impact: { label: 'Impact', color: 'bg-purple-100 text-purple-800 border-purple-200', indent: 0 },
  outcome: { label: 'Résultat', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', indent: 1 },
  output: { label: 'Extrant', color: 'bg-sky-100 text-sky-800 border-sky-200', indent: 2 },
};

const RAID_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  risk: { label: 'Risque', color: 'text-red-700 bg-red-100' },
  issue: { label: 'Enjeu', color: 'text-orange-700 bg-orange-100' },
  assumption: { label: 'Hypothèse', color: 'text-sky-700 bg-sky-100' },
  dependency: { label: 'Dépendance', color: 'text-violet-700 bg-violet-100' },
};

const CATEGORY_LABELS: Record<string, string> = {
  personnel: 'Personnel',
  material: 'Matériel',
  transport: 'Transport',
  premises: 'Locaux',
  communication: 'Communication',
  training: 'Formation',
  subcontracting: 'Sous-traitance',
  administrative: 'Administratif',
  direct_aid: 'Aide directe',
};

const FUNDING_TYPE_LABELS: Record<string, string> = {
  grant: 'Subvention',
  restricted_donation: 'Don restreint',
  unrestricted: 'Don non restreint',
  other: 'Autre',
};

function fmt(amount: number | string, currency = 'CAD') {
  return Number(amount).toLocaleString('fr-CA', { style: 'currency', currency });
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-indigo-500' : pct >= 30 ? 'bg-amber-500' : 'bg-slate-300';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs text-slate-500">{pct}%</span>
    </div>
  );
}

function SeverityBadge({ probability, impact }: { probability?: number | null; impact?: number | null }) {
  const score = (probability || 1) * (impact || 1);
  const cfg =
    score >= 15
      ? { label: 'Critique', cls: 'bg-red-100 text-red-800' }
      : score >= 9
        ? { label: 'Élevé', cls: 'bg-orange-100 text-orange-800' }
        : score >= 4
          ? { label: 'Modéré', cls: 'bg-amber-100 text-amber-800' }
          : { label: 'Faible', cls: 'bg-green-100 text-green-800' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label} ({score}/25)
    </span>
  );
}

// ─── Inline editable progress / status ────────────────────────────────────────
function InlineProgress({
  item,
  projectId,
  onSaved,
}: {
  item: PlanItem;
  projectId: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [localPct, setLocalPct] = useState(item.progressPct ?? 0);
  const [localStatus, setLocalStatus] = useState(item.status);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/plan-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressPct: localPct, status: localStatus }),
      });
      if (!res.ok) throw new Error('Erreur mise à jour');
      return res.json();
    },
    onSuccess: () => {
      setEditing(false);
      onSaved();
    },
  });

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <ProgressBar value={item.progressPct ?? 0} />
        <button
          onClick={() => setEditing(true)}
          className="rounded p-1 text-slate-400 opacity-0 transition hover:text-indigo-600 group-hover:opacity-100"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-indigo-200 bg-indigo-50 p-2">
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={localPct}
          onChange={(e) => setLocalPct(Number(e.target.value))}
          className="flex-1"
        />
        <span className="w-10 text-sm font-semibold text-indigo-700">{localPct}%</span>
      </div>
      <select
        value={localStatus}
        onChange={(e) => setLocalStatus(e.target.value as PlanItem['status'])}
        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
      >
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
      <div className="flex gap-1">
        <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="h-6 px-2 text-xs">
          <Check className="mr-1 h-3 w-3" /> Sauvegarder
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-6 px-2 text-xs">
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProjectDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Sub-tabs for 4 Lifecycle Pillars
  const [strategySubTab, setStrategySubTab] = useState<'logframe' | 'funding' | 'team'>('logframe');
  const [planningSubTab, setPlanningSubTab] = useState<'wbs' | 'gantt' | 'pert' | 'budget_plan'>('wbs');
  const [executionSubTab, setExecutionSubTab] = useState<'tasks' | 'expenses' | 'deliverables'>('tasks');
  const [monitoringSubTab, setMonitoringSubTab] = useState<'evm' | 'raid' | 'health'>('evm');

  // Modals & form state
  const [showResultNodeForm, setShowResultNodeForm] = useState(false);
  const [showPlanItemForm, setShowPlanItemForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showBudgetLineForm, setShowBudgetLineForm] = useState(false);
  const [showRaidForm, setShowRaidForm] = useState(false);
  const [showFundingForm, setShowFundingForm] = useState(false);

  // Result Node form
  const [rnLevel, setRnLevel] = useState<'impact' | 'outcome' | 'output'>('impact');
  const [rnTitle, setRnTitle] = useState('');
  const [rnDesc, setRnDesc] = useState('');
  const [rnParentId, setRnParentId] = useState('');

  // Plan Item form & Sub-views
  const [planSubView, setPlanSubView] = useState<'table' | 'gantt' | 'pert' | 'evm'>('table');
  const [piType, setPiType] = useState<PlanItem['type']>('task');
  const [piWbs, setPiWbs] = useState('');
  const [piTitle, setPiTitle] = useState('');
  const [piStart, setPiStart] = useState('');
  const [piEnd, setPiEnd] = useState('');
  const [piDuration, setPiDuration] = useState('5');
  const [piParentId, setPiParentId] = useState('');
  const [piEstimatedCost, setPiEstimatedCost] = useState('');
  const [piOptimistic, setPiOptimistic] = useState('');
  const [piMostLikely, setPiMostLikely] = useState('');
  const [piPessimistic, setPiPessimistic] = useState('');
  const [showPertInputs, setShowPertInputs] = useState(false);

  // Dependency Management state (inside task drawer)
  const [depPredId, setDepPredId] = useState('');
  const [depType, setDepType] = useState<'FS' | 'SS' | 'FF' | 'SF'>('FS');
  const [depLag, setDepLag] = useState('0');
  const [showAddDepForm, setShowAddDepForm] = useState(false);

  // Expense form
  const [expVendor, setExpVendor] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expBudgetLineId, setExpBudgetLineId] = useState('');

  // Budget Line form
  const [blCategory, setBlCategory] = useState('personnel');
  const [blDescription, setBlDescription] = useState('');
  const [blAmount, setBlAmount] = useState('');

  // Edit Budget Line state
  const [editingBlId, setEditingBlId] = useState<string | null>(null);
  const [editBlCategory, setEditBlCategory] = useState('personnel');
  const [editBlDescription, setEditBlDescription] = useState('');
  const [editBlAmount, setEditBlAmount] = useState('');

  // RAID form
  const [raidType, setRaidType] = useState<RaidItem['type']>('risk');
  const [raidTitle, setRaidTitle] = useState('');
  const [raidDesc, setRaidDesc] = useState('');
  const [raidProb, setRaidProb] = useState('3');
  const [raidImpact, setRaidImpact] = useState('3');
  const [raidOwner, setRaidOwner] = useState('');

  // Funding form
  const [fsName, setFsName] = useState('');
  const [fsType, setFsType] = useState('grant');
  const [fsAmount, setFsAmount] = useState('');
  const [fsDue, setFsDue] = useState('');

  // Team Member & Stakeholder form
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [tmSourceType, setTmSourceType] = useState<'personnel' | 'external'>('personnel');
  const [tmPartyId, setTmPartyId] = useState('');
  const [tmName, setTmName] = useState('');
  const [tmEmail, setTmEmail] = useState('');
  const [tmRole, setTmRole] = useState<ProjectMember['role']>('contributor');
  const [tmRaciRole, setTmRaciRole] = useState<ProjectMember['raciRole']>('R');
  const [tmAllocation, setTmAllocation] = useState('100');

  // RACI Matrix Filters & View
  const [raciFilterType, setRaciFilterType] = useState<string>('all');
  const [raciSearch, setRaciSearch] = useState('');

  // Task Drawer & Task Details
  const [selectedTask, setSelectedTask] = useState<PlanItem | null>(null);
  const [logComment, setLogComment] = useState('');
  const [logProgress, setLogProgress] = useState<number>(0);
  const [logIsBlocked, setLogIsBlocked] = useState(false);
  const [logBlocker, setLogBlocker] = useState('');

  // Task Estimation & Parameters (inside drawer)
  const [taskTitle, setTaskTitle] = useState('');
  const [taskWbs, setTaskWbs] = useState('');
  const [taskType, setTaskType] = useState<PlanItem['type']>('task');
  const [taskStart, setTaskStart] = useState('');
  const [taskEnd, setTaskEnd] = useState('');
  const [taskDuration, setTaskDuration] = useState('1');
  const [taskCost, setTaskCost] = useState('0');
  const [taskOptimistic, setTaskOptimistic] = useState('');
  const [taskMostLikely, setTaskMostLikely] = useState('');
  const [taskPessimistic, setTaskPessimistic] = useState('');
  const [showTaskPertEdit, setShowTaskPertEdit] = useState(false);

  useEffect(() => {
    if (selectedTask) {
      setTaskTitle(selectedTask.title || '');
      setTaskWbs(selectedTask.wbs || '');
      setTaskType(selectedTask.type || 'task');
      setTaskStart(selectedTask.startDate || '');
      setTaskEnd(selectedTask.endDate || '');
      setLogProgress(selectedTask.progressPct || 0);
      setLogIsBlocked(selectedTask.status === 'blocked');
      setTaskDuration(selectedTask.durationDays !== undefined && selectedTask.durationDays !== null ? String(selectedTask.durationDays) : '1');
      setTaskCost(selectedTask.estimatedCost !== undefined && selectedTask.estimatedCost !== null ? String(selectedTask.estimatedCost) : '0');
      setTaskOptimistic(selectedTask.optimisticDays !== undefined && selectedTask.optimisticDays !== null ? String(selectedTask.optimisticDays) : '');
      setTaskMostLikely(selectedTask.mostLikelyDays !== undefined && selectedTask.mostLikelyDays !== null ? String(selectedTask.mostLikelyDays) : '');
      setTaskPessimistic(selectedTask.pessimisticDays !== undefined && selectedTask.pessimisticDays !== null ? String(selectedTask.pessimisticDays) : '');
      setShowTaskPertEdit(!!selectedTask.optimisticDays || !!selectedTask.mostLikelyDays || !!selectedTask.pessimisticDays);
    }
  }, [selectedTask?.id]);

  // Deliverable form (inside drawer)
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [delivTitle, setDelivTitle] = useState('');
  const [delivDesc, setDelivDesc] = useState('');
  const [delivUrl, setDelivUrl] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['project', id] });

  // ── Fetch Org Personnel & Contacts ──
  const { data: orgPeople = [] } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const res = await fetch('/api/v1/people');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // ── Fetch full project ──
  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${id}/full`);
      if (!res.ok) throw new Error('Erreur chargement projet');
      return res.json();
    },
    enabled: !!id,
  });

  // ── Mutations ──
  const addResultNode = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${id}/result-nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: rnLevel,
          title: rnTitle,
          description: rnDesc || undefined,
          parentId: rnParentId || undefined,
        }),
      });
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setRnTitle(''); setRnDesc(''); setRnParentId(''); setShowResultNodeForm(false);
    },
  });

  const addPlanItem = useMutation({
    mutationFn: async () => {
      let calculatedDuration = parseInt(piDuration) || 1;
      let calculatedStart: string | undefined = piStart || undefined;
      let calculatedEnd: string | undefined = piEnd || undefined;

      if (piType === 'milestone') {
        calculatedDuration = 0;
        calculatedStart = piStart || piEnd || undefined;
        calculatedEnd = calculatedStart;
      } else if (piType === 'phase' || piType === 'activity') {
        calculatedDuration = 1;
        calculatedStart = undefined;
        calculatedEnd = undefined;
      } else {
        // Tâche ou livrable opérationnel
        if (piOptimistic && piMostLikely && piPessimistic) {
          const o = parseInt(piOptimistic);
          const m = parseInt(piMostLikely);
          const p = parseInt(piPessimistic);
          const te = Math.round(((o + 4 * m + p) / 6) * 10) / 10;
          calculatedDuration = Math.max(1, Math.round(te));
        }

        if (calculatedStart && !calculatedEnd) {
          const d = new Date(calculatedStart + 'T00:00:00Z');
          d.setUTCDate(d.getUTCDate() + calculatedDuration);
          calculatedEnd = d.toISOString().split('T')[0];
        }
      }

      const res = await fetch(`/api/v1/projects/${id}/plan-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: piType,
          wbs: piWbs || undefined,
          title: piTitle,
          startDate: calculatedStart,
          endDate: calculatedEnd,
          parentId: piParentId || undefined,
          durationDays: calculatedDuration,
          estimatedCost: piEstimatedCost ? parseFloat(piEstimatedCost) : 0,
          optimisticDays: piOptimistic ? parseInt(piOptimistic) : undefined,
          mostLikelyDays: piMostLikely ? parseInt(piMostLikely) : undefined,
          pessimisticDays: piPessimistic ? parseInt(piPessimistic) : undefined,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la création de l\'élément');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setPiTitle(''); setPiWbs(''); setPiStart(''); setPiEnd(''); setPiParentId(''); setPiDuration('5');
      setPiEstimatedCost(''); setPiOptimistic(''); setPiMostLikely(''); setPiPessimistic('');
      setShowPlanItemForm(false);
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });

  const syncPertScheduleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${id}/sync-pert-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la synchronisation du calendrier PERT/CPM");
      }
      return res.json();
    },
    onSuccess: (res: any) => {
      invalidate();
      alert(`✅ Calendrier synchronisé avec succès !\n• ${res.updatedCount} tâches et jalons réalignés au plus tôt\n• Durée totale calculée : ${res.projectDurationDays} jours\n• Période : du ${res.projectEarlyStartDate} au ${res.projectEarlyFinishDate}`);
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });

  const updateProjectStartDateMutation = useMutation({
    mutationFn: async (newStartDate: string) => {
      const res = await fetch(`/api/v1/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: newStartDate || undefined }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la mise à jour de la date de démarrage');
      }
      // Re-synchroniser automatiquement le calendrier PERT avec la nouvelle date
      if (newStartDate) {
        await fetch(`/api/v1/projects/${id}/sync-pert-schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });


  const addDependencyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTask || !depPredId) return;

      if (depPredId === 'PROJECT_START') {
        const baseStart = data?.project?.startDate || new Date().toISOString().split('T')[0];
        const lag = parseInt(depLag) || 0;
        const d = new Date(baseStart + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() + lag);
        const targetStartDate = d.toISOString().split('T')[0];

        let dur = parseInt(taskDuration) || selectedTask.durationDays || 1;
        if (selectedTask.type === 'milestone') dur = 0;
        const dEnd = new Date(targetStartDate + 'T00:00:00Z');
        dEnd.setUTCDate(dEnd.getUTCDate() + dur);
        const targetEndDate = dEnd.toISOString().split('T')[0];

        const res = await fetch(`/api/v1/projects/${id}/plan-items/${selectedTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: targetStartDate,
            endDate: targetEndDate,
            durationDays: dur,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Erreur lors de la mise à jour du décalage de démarrage');
        }
        await fetch(`/api/v1/projects/${id}/sync-pert-schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        return res.json();
      }

      const res = await fetch(`/api/v1/projects/${id}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predecessorId: depPredId,
          successorId: selectedTask.id,
          type: depType,
          lagDays: parseInt(depLag) || 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de l\'ajout du prédécesseur (boucle circulaire détectée ?)');
      }
      await fetch(`/api/v1/projects/${id}/sync-pert-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.json();
    },
    onSuccess: async () => {
      await invalidate();
      setDepPredId('');
      setDepLag('0');
      setShowAddDepForm(false);
    },
    onError: (err: any) => alert(err.message),
  });

  const deleteDependencyMutation = useMutation({
    mutationFn: async (depId: string) => {
      const res = await fetch(`/api/v1/projects/${id}/dependencies/${depId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de la suppression de la dépendance');
      }
      await fetch(`/api/v1/projects/${id}/sync-pert-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => alert(err.message),
  });

  const updateTaskParamsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTask) return;
      const opt = taskOptimistic ? parseInt(taskOptimistic) : undefined;
      const ml = taskMostLikely ? parseInt(taskMostLikely) : undefined;
      const pess = taskPessimistic ? parseInt(taskPessimistic) : undefined;

      let dur = parseInt(taskDuration);
      if (opt !== undefined && ml !== undefined && pess !== undefined && !isNaN(opt) && !isNaN(ml) && !isNaN(pess)) {
        dur = Math.round((opt + 4 * ml + pess) / 6);
      }
      if (isNaN(dur) || dur < 0) dur = 1;

      let calculatedStart: string | undefined = taskStart || undefined;
      let calculatedEnd: string | undefined = taskEnd || undefined;
      if (taskType === 'milestone') {
        calculatedEnd = calculatedStart;
        dur = 0;
      } else if (calculatedStart && dur > 0 && !calculatedEnd) {
        const d = new Date(calculatedStart + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() + dur);
        calculatedEnd = d.toISOString().split('T')[0];
      }

      const res = await fetch(`/api/v1/projects/${id}/plan-items/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim() || undefined,
          wbs: taskWbs.trim() || undefined,
          type: taskType,
          startDate: calculatedStart,
          endDate: calculatedEnd,
          durationDays: dur,
          estimatedCost: taskCost ? parseFloat(taskCost) : 0,
          optimisticDays: opt,
          mostLikelyDays: ml,
          pessimisticDays: pess,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de la mise à jour des paramètres');
      }
      await fetch(`/api/v1/projects/${id}/sync-pert-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.json();
    },
    onSuccess: async () => {
      await invalidate();
      setSelectedTask(null);
    },
    onError: (err: any) => alert(err.message),
  });

  const addExpense = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor: expVendor,
          amount: parseFloat(expAmount),
          date: expDate,
          budgetLineId: expBudgetLineId,
          taxTps: 0,
          taxTvq: 0,
        }),
      });
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setExpVendor(''); setExpAmount(''); setExpBudgetLineId(''); setShowExpenseForm(false);
    },
  });

  const addBudgetLine = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${id}/budget-lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryCode: blCategory, description: blDescription, amount: parseFloat(blAmount) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de la création de la ligne');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setBlDescription(''); setBlAmount(''); setShowBudgetLineForm(false);
    },
    onError: (err: any) => alert(err.message),
  });

  const updateBudgetLine = useMutation({
    mutationFn: async ({ lineId, categoryCode, description, amount }: { lineId: string; categoryCode: string; description: string; amount: number }) => {
      const res = await fetch(`/api/v1/projects/${id}/budget-lines/${lineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryCode, description, amount }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de la modification de la ligne');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setEditingBlId(null);
    },
    onError: (err: any) => alert(err.message),
  });

  const deleteBudgetLine = useMutation({
    mutationFn: async (lineId: string) => {
      const res = await fetch(`/api/v1/projects/${id}/budget-lines/${lineId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de la suppression de la ligne');
      }
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => alert(err.message),
  });

  const addRaidItem = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${id}/raid-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: raidType,
          title: raidTitle,
          description: raidDesc || undefined,
          probability: parseInt(raidProb),
          impact: parseInt(raidImpact),
          ownerName: raidOwner || undefined,
        }),
      });
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setRaidTitle(''); setRaidDesc(''); setRaidOwner(''); setShowRaidForm(false);
    },
  });

  const addFunding = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${id}/funding-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: fsName,
          fundingType: fsType,
          amount: parseFloat(fsAmount),
          currency: 'CAD',
          reportDueAt: fsDue || undefined,
        }),
      });
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setFsName(''); setFsAmount(''); setFsDue(''); setShowFundingForm(false);
    },
  });

  const deletePlanItem = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/v1/projects/${id}/plan-items/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de la suppression');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setSelectedTask(null);
    },
    onError: (err: any) => alert(err.message),
  });

  const deleteResultNode = useMutation({
    mutationFn: async (nodeId: string) => {
      const res = await fetch(`/api/v1/projects/${id}/result-nodes/${nodeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => alert(err.message),
  });

  const deleteFundingSource = useMutation({
    mutationFn: async (sourceId: string) => {
      const res = await fetch(`/api/v1/projects/${id}/funding-sources/${sourceId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => alert(err.message),
  });

  const deleteRaidItem = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/v1/projects/${id}/raid-items/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => alert(err.message),
  });

  const approveExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      const res = await fetch(`/api/v1/projects/${id}/expenses/${expenseId}/approve`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Erreur approbation');
      return res.json();
    },
    onSuccess: () => invalidate(),
  });

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: tmPartyId || undefined,
          name: tmName,
          email: tmEmail || undefined,
          role: tmRole,
          raciRole: tmRaciRole,
          allocationPct: parseInt(tmAllocation) || 100,
        }),
      });
      if (!res.ok) throw new Error('Erreur ajout membre');
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setTmName('');
      setTmEmail('');
      setTmPartyId('');
      setShowMemberForm(false);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/v1/projects/${id}/members/${memberId}/remove`, { method: 'POST' });
      if (!res.ok) throw new Error('Erreur suppression membre');
      return res.json();
    },
    onSuccess: () => invalidate(),
  });

  const setRaciMutation = useMutation({
    mutationFn: async ({
      planItemId,
      projectMemberId,
      raciRole,
    }: {
      planItemId: string;
      projectMemberId: string;
      raciRole: 'R' | 'A' | 'C' | 'I' | null;
    }) => {
      const res = await fetch(`/api/v1/projects/${id}/raci`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planItemId,
          projectMemberId,
          raciRole,
        }),
      });
      if (!res.ok) throw new Error('Erreur enregistrement RACI');
      return res.json();
    },
    onSuccess: () => invalidate(),
  });

  const addUpdateLogMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTask) return;
      const taskAssignee = members.find((m: any) => m.id === selectedTask.assigneePartyId);
      const computedStatus = logIsBlocked
        ? 'blocked'
        : logProgress >= 100
          ? 'completed'
          : logProgress > 0
            ? 'in_progress'
            : 'todo';

      const res = await fetch(`/api/v1/projects/${id}/plan-items/${selectedTask.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: taskAssignee?.name || 'Responsable de la tâche',
          progressPct: logProgress,
          status: computedStatus,
          comment: logComment,
          blockerReason: logIsBlocked ? logBlocker : undefined,
        }),
      });
      if (!res.ok) throw new Error('Erreur publication mise à jour');
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setLogComment('');
      setLogBlocker('');
      setLogIsBlocked(false);
    },
  });

  const addDeliverableMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTask) return;
      const res = await fetch(`/api/v1/projects/${id}/plan-items/${selectedTask.id}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: delivTitle,
          description: delivDesc || undefined,
          fileUrl: delivUrl || undefined,
        }),
      });
      if (!res.ok) throw new Error('Erreur dépôt livrable');
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setDelivTitle(''); setDelivDesc(''); setDelivUrl(''); setShowDeliverableModal(false);
    },
  });

  const verifyDeliverableMutation = useMutation({
    mutationFn: async ({ deliverableId, status }: { deliverableId: string; status: 'approved' | 'rejected' }) => {
      if (!selectedTask) return;
      const res = await fetch(`/api/v1/projects/${id}/plan-items/${selectedTask.id}/deliverables/${deliverableId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          verifiedBy: 'Gestionnaire de Projet',
        }),
      });
      if (!res.ok) throw new Error('Erreur validation livrable');
      return res.json();
    },
    onSuccess: () => invalidate(),
  });

  // ── Loading ──
  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Chargement du projet…</span>
        </div>
      </div>
    );
  }

  const {
    project: proj,
    fundingSources = [],
    resultNodes = [],
    planItems = [],
    dependencies = [],
    budget: projBudget,
    expenses = [],
    raidItems = [],
    members = [],
    raci = [],
    updates = [],
    deliverables = [],
  } = data;

  // ── Derived stats & Real Progress Rollup ──
  const totalBudget = (projBudget?.lines || []).reduce((s: number, l: any) => s + parseFloat(l.amount || '0'), 0);
  const totalApprovedExpenses = expenses
    .filter((e: any) => e.status === 'approved' || e.status === 'paid')
    .reduce((s: number, e: any) => s + parseFloat(e.amount || '0'), 0);
  const totalPendingExpenses = expenses
    .filter((e: any) => e.status === 'submitted')
    .reduce((s: number, e: any) => s + parseFloat(e.amount || '0'), 0);
  const totalFunding = fundingSources.reduce((s: number, f: any) => s + parseFloat(f.amount || '0'), 0);
  const remaining = totalBudget - totalApprovedExpenses;

  // Calcul d'avancement réel pondéré WBS (Rollup racines)
  const rootPlanItems = planItems.filter((p: any) => !p.parentId);
  const totalWbsEstimatedCost = rootPlanItems.length > 0
    ? rootPlanItems.reduce((s: number, p: any) => s + parseFloat(p.estimatedCost || '0'), 0)
    : planItems.reduce((s: number, p: any) => s + parseFloat(p.estimatedCost || '0'), 0);
  const totalRootWeight = rootPlanItems.reduce((s: number, p: any) => s + (p.durationDays || 1), 0);
  const overallProgress =
    rootPlanItems.length > 0 && totalRootWeight > 0
      ? Math.round(
          rootPlanItems.reduce((s: number, p: any) => s + (p.progressPct || 0) * (p.durationDays || 1), 0) /
            totalRootWeight
        )
      : planItems.length > 0
        ? Math.round(planItems.reduce((s: number, p: any) => s + (p.progressPct || 0), 0) / planItems.length)
        : 0;

  const totalTasks = planItems.length;
  const completedTasks = planItems.filter((p: any) => p.status === 'completed' || (p.progressPct ?? 0) === 100).length;
  const inProgressTasks = planItems.filter((p: any) => (p.progressPct ?? 0) > 0 && (p.progressPct ?? 0) < 100).length;
  const blockedTasks = planItems.filter((p: any) => p.status === 'blocked').length;

  // Calcul de la santé temporelle des phases (Comparaison dates réelles vs temps écoulé vs % réalisé)
  const todayStr = new Date().toISOString().split('T')[0];
  const phasesWithHealth = rootPlanItems.map((phase: any) => {
    const childTasks = planItems.filter((item: any) => item.parentId === phase.id);
    const completedChildCount = childTasks.filter(
      (c: any) => c.status === 'completed' || (c.progressPct ?? 0) === 100
    ).length;

    const pct = phase.progressPct || 0;
    let health: 'completed' | 'delayed' | 'at_risk' | 'on_track' | 'upcoming' = 'upcoming';
    let healthLabel = 'À venir';
    let healthColor = 'bg-slate-100 text-slate-700 border-slate-200';

    if (pct === 100 || phase.status === 'completed') {
      health = 'completed';
      healthLabel = 'Terminée';
      healthColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (phase.endDate && todayStr > phase.endDate) {
      health = 'delayed';
      healthLabel = 'En retard';
      healthColor = 'bg-red-100 text-red-800 border-red-300';
    } else if (phase.startDate && todayStr >= phase.startDate) {
      if (phase.endDate) {
        const startTs = new Date(phase.startDate).getTime();
        const endTs = new Date(phase.endDate).getTime();
        const nowTs = new Date().getTime();
        const totalDuration = Math.max(endTs - startTs, 1);
        const elapsed = Math.min(Math.max(nowTs - startTs, 0), totalDuration);
        const expectedPct = Math.round((elapsed / totalDuration) * 100);

        if (pct < expectedPct - 15) {
          health = 'at_risk';
          healthLabel = 'À risque';
          healthColor = 'bg-amber-100 text-amber-800 border-amber-300';
        } else {
          health = 'on_track';
          healthLabel = 'Sur les rails';
          healthColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
      } else {
        health = pct > 0 ? 'on_track' : 'at_risk';
        healthLabel = pct > 0 ? 'Sur les rails' : 'À démarrer';
        healthColor = pct > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';
      }
    }

    return {
      ...phase,
      childTasks,
      childCount: childTasks.length,
      completedChildCount,
      health,
      healthLabel,
      healthColor,
    };
  });

  const isProjectDelayed = phasesWithHealth.some((ph: any) => ph.health === 'delayed') || blockedTasks > 0;
  const isProjectAtRisk = phasesWithHealth.some((ph: any) => ph.health === 'at_risk');
  const projectHealth =
    overallProgress === 100
      ? { label: 'Projet Terminé', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
      : isProjectDelayed
      ? { label: 'Attention : En retard', color: 'bg-red-100 text-red-800 border-red-300' }
      : isProjectAtRisk
      ? { label: 'Vigilance : À risque', color: 'bg-amber-100 text-amber-800 border-amber-300' }
      : { label: 'Sur les rails', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

    const TABS = [
    { key: 'overview' as TabKey, label: "Vue d'ensemble", icon: FolderKanban },
    { key: 'strategy' as TabKey, label: "1. Cadrage & Stratégie", icon: Target },
    { key: 'planning' as TabKey, label: "2. Planification", icon: ListTodo },
    { key: 'execution' as TabKey, label: "3. Exécution & Opérations", icon: CheckCircle2 },
    { key: 'monitoring' as TabKey, label: "4. Suivi & Performance", icon: BarChart3 },
  ];

  const PROJECT_STATUS_LABELS: Record<string, string> = {
    planned: 'Planifié',
    active: 'Actif',
    suspended: 'Suspendu',
    closed: 'Terminé',
    cancelled: 'Annulé',
  };

  const PROJECT_STATUS_COLORS: Record<string, string> = {
    planned: 'bg-sky-100 text-sky-800',
    active: 'bg-emerald-100 text-emerald-800',
    suspended: 'bg-amber-100 text-amber-800',
    closed: 'bg-slate-100 text-slate-700',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── Header ── */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/projects')}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Projets
              </button>
              <ChevronRight className="h-4 w-4 text-slate-300" />
              <div className="flex items-center gap-3">
                <span className="rounded bg-indigo-100 px-2 py-0.5 font-mono text-xs font-bold text-indigo-800">
                  {proj.code}
                </span>
                <h1 className="text-lg font-bold text-slate-900">{proj.name}</h1>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    PROJECT_STATUS_COLORS[proj.status] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {PROJECT_STATUS_LABELS[proj.status] || proj.status}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.open(`/api/v1/projects/${id}/expenses/export`, '_blank')}>
              <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
              Exporter CSV
            </Button>
          </div>

          {/* Quick stats strip */}
          <div className="flex flex-wrap items-center gap-6 pb-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
              <strong className="text-slate-800 font-bold">{overallProgress}%</strong> avancement WBS
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${projectHealth.color}`}>
              <CheckCircle2 className="h-3 w-3" />
              {projectHealth.label}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <strong className="text-slate-700">{completedTasks}</strong>/{totalTasks} tâches & jalons terminés
            </span>
            {inProgressTasks > 0 && (
              <span className="flex items-center gap-1 text-sky-600">
                <Clock className="h-3.5 w-3.5" />
                <strong>{inProgressTasks}</strong> en cours
              </span>
            )}
            {blockedTasks > 0 && (
              <span className="flex items-center gap-1 text-red-600 font-semibold">
                <Flame className="h-3.5 w-3.5" />
                <strong>{blockedTasks}</strong> bloqué{blockedTasks > 1 ? 's' : ''}
              </span>
            )}
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              <strong className="text-slate-700">{fmt(totalFunding)}</strong> financé
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
              <strong className="text-slate-700">{fmt(remaining)}</strong> solde budget
            </span>
          </div>

          {/* Tab navigation */}
          <div className="-mb-px flex gap-0 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-indigo-700 font-bold'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

            {/* ── Content ── */}
      <main className="mx-auto max-w-7xl p-6">
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: VUE D'ENSEMBLE                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Budget planifié</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{fmt(totalBudget)}</p>
                  </div>
                  <div className="rounded-lg bg-indigo-50 p-2">
                    <DollarSign className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Dépenses approuvées</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{fmt(totalApprovedExpenses)}</p>
                    {totalPendingExpenses > 0 && (
                      <p className="mt-0.5 text-xs text-amber-600">+{fmt(totalPendingExpenses)} en attente</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Solde disponible</p>
                    <p className={`mt-1 text-2xl font-bold ${remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {fmt(remaining)}
                    </p>
                  </div>
                  <div className={`rounded-lg p-2 ${remaining >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <BarChart3 className={`h-5 w-5 ${remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Financement total</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{fmt(totalFunding)}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{fundingSources.length} bailleur{fundingSources.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="rounded-lg bg-violet-50 p-2">
                    <HandCoins className="h-5 w-5 text-violet-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Évolution & Progression WBS */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Carte Avancement Global du Projet */}
              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800">Avancement Global du Projet</h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${projectHealth.color}`}>
                    {projectHealth.label}
                  </span>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-xs font-medium text-slate-500">Complétion WBS pondérée</span>
                    <span className="font-extrabold text-indigo-700 text-base">{overallProgress}%</span>
                  </div>
                  <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                    <div
                      className="h-3.5 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 transition-all duration-500"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Calculé en temps réel à partir de la durée et du statut de chaque tâche racine.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const count = planItems.filter((p: any) => p.status === key).length;
                    return (
                      <div key={key} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                        <span className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                        <span className="font-bold text-slate-800">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Évolution des Phases & Santé Calendrier */}
              <div className="rounded-xl border bg-white p-5 shadow-sm lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <h2 className="text-sm font-bold text-slate-800">Évolution des Phases & Calendrier (WBS)</h2>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {phasesWithHealth.length} phase{phasesWithHealth.length > 1 ? 's' : ''}
                  </span>
                </div>

                {phasesWithHealth.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Aucune phase définie. Ajoutez des phases dans l'onglet « Planification » pour structurer le WBS.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {phasesWithHealth.map((phase: any) => {
                      const phaseProgress = phase.progressPct || 0;
                      return (
                        <div
                          key={phase.id}
                          className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 hover:border-slate-300 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-indigo-800 shrink-0">
                                {phase.wbs}
                              </span>
                              <span className="font-bold text-slate-800 text-xs sm:text-sm">{phase.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${phase.healthColor}`}
                              >
                                {phase.healthLabel}
                              </span>
                              <span className="text-xs font-bold text-indigo-700 font-mono w-10 text-right">
                                {phaseProgress}%
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                phaseProgress === 100
                                  ? 'bg-emerald-500'
                                  : phase.health === 'delayed'
                                  ? 'bg-red-500'
                                  : phase.health === 'at_risk'
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-600'
                              }`}
                              style={{ width: `${phaseProgress}%` }}
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {phase.startDate ? new Date(phase.startDate).toLocaleDateString('fr-CA') : '—'} au{' '}
                                {phase.endDate ? new Date(phase.endDate).toLocaleDateString('fr-CA') : '—'}
                              </span>
                              {phase.durationDays && (
                                <span className="font-mono text-slate-400">({phase.durationDays} jours)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 font-medium">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>
                                {phase.completedChildCount} / {phase.childCount} tâche{phase.childCount > 1 ? 's' : ''} terminée{phase.childCount > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RAID & Financements */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* RAID summary */}
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-slate-700">Registre RAID — Synthèse</h2>
                {raidItems.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucun élément RAID enregistré.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(RAID_TYPE_CONFIG).map(([type, cfg]) => {
                      const items = raidItems.filter((r: any) => r.type === type);
                      if (items.length === 0) return null;
                      const high = items.filter((r: any) => (r.probability || 1) * (r.impact || 1) >= 9);
                      return (
                        <div key={type} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-600">{items.length} total</span>
                            {high.length > 0 && (
                              <span className="font-semibold text-red-600">{high.length} élevé{high.length > 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Funding sources mini list */}
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-slate-700">Sources de financement</h2>
                {fundingSources.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune source de financement enregistrée.</p>
                ) : (
                  <div className="space-y-2">
                    {fundingSources.map((fs: any) => (
                      <div key={fs.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <span className="text-slate-700 font-medium">{fs.donorName}</span>
                        <span className="font-semibold text-indigo-700">{fmt(fs.amount, fs.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PILIER 1: CADRAGE & STRATÉGIE                                   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'strategy' && (
          <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl w-fit border border-slate-300 shadow-2xs">
              <button
                onClick={() => setStrategySubTab('logframe')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  strategySubTab === 'logframe' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Target className="h-3.5 w-3.5" />
                Cadre Logique & Objectifs
              </button>
              <button
                onClick={() => setStrategySubTab('funding')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  strategySubTab === 'funding' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HandCoins className="h-3.5 w-3.5" />
                Bailleurs & Financements ({fundingSources.length})
              </button>
              <button
                onClick={() => setStrategySubTab('team')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  strategySubTab === 'team' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Équipe & Matrice RACI ({members.length})
              </button>
            </div>

            {/* Sub-tab 1: Cadre Logique */}
            {strategySubTab === 'logframe' && (
              <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Cadre Logique (Chaîne de Résultats)</h2>
                <p className="text-sm text-slate-500">Hiérarchie Impact → Résultat → Extrant</p>
              </div>
              <Button size="sm" onClick={() => setShowResultNodeForm(!showResultNodeForm)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un nœud
              </Button>
            </div>

            {/* Add Result Node Form */}
            {showResultNodeForm && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-indigo-800">Nouveau nœud de résultat</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Niveau</label>
                    <select
                      value={rnLevel}
                      onChange={(e) => setRnLevel(e.target.value as typeof rnLevel)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="impact">Impact</option>
                      <option value="outcome">Résultat (Outcome)</option>
                      <option value="output">Extrant (Output)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Nœud parent (optionnel)</label>
                    <select
                      value={rnParentId}
                      onChange={(e) => setRnParentId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">— Aucun (racine) —</option>
                      {resultNodes.map((rn: any) => (
                        <option key={rn.id} value={rn.id}>
                          [{LEVEL_CONFIG[rn.level as keyof typeof LEVEL_CONFIG]?.label}] {rn.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Titre *</label>
                    <Input value={rnTitle} onChange={(e) => setRnTitle(e.target.value)} placeholder="Ex: Améliorer l'accès à la formation..." />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Description (optionnel)</label>
                    <textarea
                      value={rnDesc}
                      onChange={(e) => setRnDesc(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Contexte, indicateurs visés..."
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => addResultNode.mutate()} disabled={!rnTitle.trim() || addResultNode.isPending}>
                    Enregistrer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowResultNodeForm(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {/* Result Nodes Tree */}
            {resultNodes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                <Target className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">Aucun nœud de résultat défini</p>
                <p className="mt-1 text-xs text-slate-400">Commencez par définir l'impact principal du projet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(['impact', 'outcome', 'output'] as const).map((level) => {
                  const nodes = resultNodes.filter((n: any) => n.level === level);
                  if (nodes.length === 0) return null;
                  const cfg = LEVEL_CONFIG[level];
                  return (
                    <div key={level}>
                      <div className={`mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider`} style={{ paddingLeft: `${cfg.indent * 24}px` }}>
                        <span className={`rounded-full border px-2 py-0.5 ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      {nodes.map((node: any) => (
                        <div
                          key={node.id}
                          className={`mb-2 rounded-lg border bg-white p-4 shadow-sm flex items-start justify-between gap-4`}
                          style={{ marginLeft: `${cfg.indent * 24}px` }}
                        >
                          <div>
                            <p className="font-medium text-slate-800">{node.title}</p>
                            {node.description && (
                              <p className="mt-1 text-sm text-slate-500">{node.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Supprimer le nœud de résultat "${node.title}" ?`)) {
                                deleteResultNode.mutate(node.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors flex-shrink-0"
                            title="Supprimer ce nœud"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
            )}

            {/* Sub-tab 2: Bailleurs & Financements */}
            {strategySubTab === 'funding' && (
              <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Sources de Financement</h2>
                <p className="text-sm text-slate-500">Bailleurs de fonds, subventions et dons</p>
              </div>
              <Button size="sm" onClick={() => setShowFundingForm(!showFundingForm)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un bailleur
              </Button>
            </div>

            {/* Funding form */}
            {showFundingForm && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-violet-800">Nouveau bailleur de fonds</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Nom du bailleur *</label>
                    <Input value={fsName} onChange={(e) => setFsName(e.target.value)} placeholder="Ex: Fondation XYZ, MSSS..." />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Type de financement</label>
                    <select
                      value={fsType}
                      onChange={(e) => setFsType(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      {Object.entries(FUNDING_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Montant (CAD) *</label>
                    <Input type="number" value={fsAmount} onChange={(e) => setFsAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Date de rapport due</label>
                    <Input type="date" value={fsDue} onChange={(e) => setFsDue(e.target.value)} />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => addFunding.mutate()} disabled={!fsName.trim() || !fsAmount || addFunding.isPending}>
                    Enregistrer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowFundingForm(false)}>Annuler</Button>
                </div>
              </div>
            )}

            {/* Total */}
            {fundingSources.length > 0 && (
              <div className="flex items-center justify-between rounded-xl border bg-violet-50 px-5 py-4">
                <span className="text-sm font-semibold text-violet-800">Total financé</span>
                <span className="text-xl font-bold text-violet-900">{fmt(totalFunding)}</span>
              </div>
            )}

            {/* Funding cards */}
            {fundingSources.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                <HandCoins className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">Aucune source de financement</p>
                <p className="mt-1 text-xs text-slate-400">Ajoutez les bailleurs de fonds du projet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fundingSources.map((fs: any) => (
                  <div key={fs.id} className="relative rounded-xl border bg-white p-5 shadow-sm group">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                        <HandCoins className="h-5 w-5 text-violet-600" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {FUNDING_TYPE_LABELS[fs.fundingType] || fs.fundingType}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-slate-300 hover:text-red-600 hover:bg-red-50"
                          title="Supprimer cette source de financement"
                          onClick={() => {
                            if (window.confirm(`Supprimer le financement "${fs.donorName}" (${fmt(fs.amount)}) ?`)) {
                              deleteFundingSource.mutate(fs.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-800">{fs.donorName}</h3>
                    <p className="mt-1 text-xl font-bold text-violet-700">{fmt(fs.amount, fs.currency || 'CAD')}</p>
                    {fs.reportDueAt && (
                      <p className="mt-2 text-xs text-slate-400">
                        Rapport dû: <span className="font-medium text-slate-600">{fs.reportDueAt}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
            )}

            {/* Sub-tab 3: Équipe & RACI */}
            {strategySubTab === 'team' && (() => {
              // Sort items for RACI Matrix
          const sortedPlanItems = [...planItems].sort((a: any, b: any) => {
            const partsA = (a.wbs || '').split('.').map((n: string) => parseInt(n, 10) || 0);
            const partsB = (b.wbs || '').split('.').map((n: string) => parseInt(n, 10) || 0);
            const len = Math.max(partsA.length, partsB.length);
            for (let i = 0; i < len; i++) {
              const valA = partsA[i] ?? -1;
              const valB = partsB[i] ?? -1;
              if (valA !== valB) return valA - valB;
            }
            return (a.title || '').localeCompare(b.title || '');
          });

          // Filter plan items for RACI view
          const filteredRaciItems = sortedPlanItems.filter((item: any) => {
            if (raciFilterType !== 'all' && item.type !== raciFilterType) return false;
            if (raciSearch.trim() && !item.title.toLowerCase().includes(raciSearch.toLowerCase()) && !item.wbs.includes(raciSearch)) {
              return false;
            }
            return true;
          });

          // Compute overall RACI coverage (items with at least 1 R and 1 A)
          const compliantItemsCount = planItems.filter((item: any) => {
            const itemRacis = raci.filter((r: any) => r.planItemId === item.id);
            const countA = itemRacis.filter((r: any) => r.raciRole === 'A').length;
            const countR = itemRacis.filter((r: any) => r.raciRole === 'R').length;
            return countA === 1 && countR >= 1;
          }).length;

          const raciCoveragePct = planItems.length > 0 ? Math.round((compliantItemsCount / planItems.length) * 100) : 0;

          return (
            <div className="space-y-8">
              {/* Header & KPI Summary */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-indigo-600" />
                    Parties Prenantes & Matrice RACI
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Affectation des membres de l'organisation et gouvernance fine des responsabilités par Phase, Activité et Livrable
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setShowMemberForm(true);
                    setTmSourceType('personnel');
                    setTmPartyId('');
                    setTmName('');
                    setTmEmail('');
                  }}
                  className="shadow-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une partie prenante
                </Button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Parties prenantes</span>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{members.length}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Affectées à ce projet</p>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Éléments WBS couverts</span>
                  <p className="mt-1 text-2xl font-bold text-indigo-600">{compliantItemsCount} / {planItems.length}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Avec Approbateur (A) & Réalisateur (R)</p>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Conformité RACI</span>
                  <p className={`mt-1 text-2xl font-bold ${raciCoveragePct >= 80 ? 'text-emerald-600' : raciCoveragePct >= 50 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {raciCoveragePct}%
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Qualité de la gouvernance</p>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Affectations actives</span>
                  <p className="mt-1 text-2xl font-bold text-purple-600">{raci.length}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Rôles attribués dans la grille</p>
                </div>
              </div>

              {/* Stakeholder Addition Modal / Form */}
              {showMemberForm && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-6 shadow-md animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-indigo-950 flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-indigo-600" />
                        Ajouter une partie prenante ou un membre au projet
                      </h3>
                      <p className="text-xs text-slate-600">
                        Sélectionnez un membre existant du personnel ou ajoutez un partenaire / consultant externe
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowMemberForm(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="mb-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTmSourceType('personnel');
                        setTmPartyId('');
                        setTmName('');
                        setTmEmail('');
                      }}
                      className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                        tmSourceType === 'personnel'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border'
                      }`}
                    >
                      👥 Personnel / Membre de l'organisation
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTmSourceType('external');
                        setTmPartyId('');
                        setTmName('');
                        setTmEmail('');
                      }}
                      className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                        tmSourceType === 'external'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border'
                      }`}
                    >
                      🌐 Partie prenante externe / Consultant / Partenaire
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Personnel Selector from Org People Directory */}
                    {tmSourceType === 'personnel' ? (
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          Sélectionner un membre du personnel / contact existant *
                        </label>
                        <select
                          value={tmPartyId}
                          onChange={(e) => {
                            const pId = e.target.value;
                            setTmPartyId(pId);
                            const found = orgPeople.find((p: any) => p.id === pId);
                            if (found) {
                              setTmName(`${found.firstName || ''} ${found.lastName || ''}`.trim() || 'Sans nom');
                              setTmEmail(found.email || '');
                            } else {
                              setTmName('');
                              setTmEmail('');
                            }
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">— Choisir dans le répertoire de l'organisation —</option>
                          {orgPeople.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.firstName} {p.lastName} {p.email ? `(${p.email})` : ''}
                            </option>
                          ))}
                        </select>
                        {orgPeople.length === 0 && (
                          <p className="mt-1 text-xs text-amber-600">
                            Aucune personne enregistrée dans l'annuaire. Vous pouvez basculer en mode externe ou enregistrer du personnel dans le module Personnes.
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-700">Nom complet *</label>
                          <Input
                            value={tmName}
                            onChange={(e) => setTmName(e.target.value)}
                            placeholder="Ex: Jean Dupont"
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-700">Courriel</label>
                          <Input
                            type="email"
                            value={tmEmail}
                            onChange={(e) => setTmEmail(e.target.value)}
                            placeholder="jean.dupont@partenaire.org"
                            className="bg-white"
                          />
                        </div>
                      </>
                    )}

                    {/* Role in Project */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">Rôle dans le projet *</label>
                      <select
                        value={tmRole}
                        onChange={(e) => setTmRole(e.target.value as ProjectMember['role'])}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      >
                        {Object.entries(MEMBER_ROLE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Allocation % */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">Taux d'allocation prévisionnel (%)</label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={tmAllocation}
                        onChange={(e) => setTmAllocation(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowMemberForm(false)}>
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => addMemberMutation.mutate()}
                      disabled={!tmName.trim() || addMemberMutation.isPending}
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      Confirmer l'affectation
                    </Button>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* SECTION 1: RÉPERTOIRE DES PARTIES PRENANTES & ÉQUIPE PROJET */}
              {/* ─────────────────────────────────────────────────────────── */}
              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">
                  <div>
                    <h3 className="font-bold text-slate-900">1. Répertoire des Parties Prenantes & Équipe Projet</h3>
                    <p className="text-xs text-slate-500">Liste des intervenants avec bilan de leurs responsabilités sur le projet</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{members.length} membre(s)</span>
                </div>

                {members.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium">Aucune partie prenante affectée au projet.</p>
                    <p className="text-xs mt-1">Ajoutez des membres de l'organisation pour pouvoir leur assigner des rôles RACI.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-slate-50/70 text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-6 py-3">Nom & Contact</th>
                        <th className="px-6 py-3">Provenance</th>
                        <th className="px-6 py-3">Rôle projet</th>
                        <th className="px-6 py-3 text-center">Implication</th>
                        <th className="px-6 py-3 text-center">Bilan des Rôles RACI</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members.map((member: any) => {
                        const roleCfg = MEMBER_ROLE_LABELS[member.role] || MEMBER_ROLE_LABELS.contributor;
                        const memberRacis = raci.filter((r: any) => r.projectMemberId === member.id);
                        const countR = memberRacis.filter((r: any) => r.raciRole === 'R').length;
                        const countA = memberRacis.filter((r: any) => r.raciRole === 'A').length;
                        const countC = memberRacis.filter((r: any) => r.raciRole === 'C').length;
                        const countI = memberRacis.filter((r: any) => r.raciRole === 'I').length;

                        return (
                          <tr key={member.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3">
                              <div className="font-bold text-slate-900">{member.name}</div>
                              {member.email && <div className="text-xs text-slate-400">{member.email}</div>}
                            </td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                member.partyId || member.userId
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {member.partyId || member.userId ? '🏢 Membre Organisation' : '🌐 Externe / Partenaire'}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${roleCfg.color}`}>
                                {roleCfg.label}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-center font-mono text-xs font-bold text-slate-700">
                              {member.allocationPct}%
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <span title="Réalisateur (R)" className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  R: {countR}
                                </span>
                                <span title="Approbateur (A)" className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  A: {countA}
                                </span>
                                <span title="Consulté (C)" className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  C: {countC}
                                </span>
                                <span title="Informé (I)" className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                                  I: {countI}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8 w-8 p-0"
                                onClick={() => removeMemberMutation.mutate(member.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* ─────────────────────────────────────────────────────────── */}
              {/* SECTION 2: MATRICE RACI 2D PAR PHASE / ACTIVITÉ / TÂCHE     */}
              {/* ─────────────────────────────────────────────────────────── */}
              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                {/* RACI Matrix Header & Toolbar */}
                <div className="border-b bg-slate-50 p-6 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-indigo-600" />
                        2. Matrice RACI 2D par Phase, Activité et Livrable
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Définissez les responsabilités précises pour chaque élément WBS en attribuant les rôles aux parties prenantes
                      </p>
                    </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    {/* Type filter buttons */}
                    <div className="flex flex-wrap gap-1">
                      {[
                        { key: 'all', label: 'Tout afficher' },
                        { key: 'phase', label: 'Phases' },
                        { key: 'activity', label: 'Activités' },
                        { key: 'task', label: 'Tâches' },
                        { key: 'deliverable', label: 'Livrables' },
                      ].map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setRaciFilterType(f.key)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            raciFilterType === f.key
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white text-slate-600 border hover:bg-slate-100'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Quick Search */}
                    <div className="w-64">
                      <Input
                        value={raciSearch}
                        onChange={(e) => setRaciSearch(e.target.value)}
                        placeholder="Rechercher une phase ou activité..."
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* RACI Matrix Table */}
                {planItems.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">
                    <Layers className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium">Aucun élément dans le WBS pour l'instant.</p>
                    <p className="text-xs mt-1">Créez des phases, activités ou tâches dans l'onglet Planification (WBS) pour construire la matrice RACI.</p>
                  </div>
                ) : members.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">
                    <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium">Veuillez d'abord ajouter au moins une partie prenante ci-dessus.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="border-b bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10">
                        <tr>
                          {/* WBS Item Column */}
                          <th className="min-w-[280px] max-w-[340px] px-4 py-3.5 border-r border-slate-200">
                            Élément du Projet (WBS)
                          </th>

                          {/* Dynamic Member Columns */}
                          {members.map((member: any) => (
                            <th key={member.id} className="min-w-[130px] px-3 py-3 text-center border-r border-slate-200 bg-slate-50/60">
                              <div className="font-bold text-slate-900 truncate" title={member.name}>
                                {member.name}
                              </div>
                              <div className="text-[10px] font-medium text-slate-500 truncate" title={MEMBER_ROLE_LABELS[member.role]?.label || member.role}>
                                {MEMBER_ROLE_LABELS[member.role]?.label || member.role}
                              </div>
                            </th>
                          ))}

                          {/* Governance Checker Column */}
                          <th className="min-w-[170px] px-4 py-3.5 text-center bg-slate-100">
                            Gouvernance RACI
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {filteredRaciItems.map((item: any) => {
                          const depth = (item.wbs.split('.').length - 1);
                          const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.activity;

                          // Governance check
                          const itemRacis = raci.filter((r: any) => r.planItemId === item.id);
                          const countA = itemRacis.filter((r: any) => r.raciRole === 'A').length;
                          const countR = itemRacis.filter((r: any) => r.raciRole === 'R').length;

                          const isCompliant = countA === 1 && countR >= 1;

                          return (
                            <tr key={item.id} className={`hover:bg-indigo-50/30 transition ${item.type === 'phase' ? 'bg-slate-50/60 font-semibold' : ''}`}>
                              {/* WBS Title & Info */}
                              <td className="px-4 py-3 border-r border-slate-200">
                                <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 14}px` }}>
                                  <span className="font-mono text-[11px] font-bold text-slate-500">{item.wbs}</span>
                                  <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${typeCfg.badgeClass}`}>
                                    {typeCfg.icon}
                                    {typeCfg.label}
                                  </span>
                                  <span className="font-medium text-slate-900 truncate" title={item.title}>
                                    {item.title}
                                  </span>
                                </div>
                              </td>

                              {/* Member RACI Cells */}
                              {members.map((member: any) => {
                                const assignment = raci.find(
                                  (r: any) => r.planItemId === item.id && r.projectMemberId === member.id
                                );
                                const currentRole = assignment?.raciRole as ('R' | 'A' | 'C' | 'I' | undefined);

                                return (
                                  <td key={member.id} className="px-2 py-2 text-center border-r border-slate-200">
                                    <div className="flex items-center justify-center">
                                      <select
                                        value={currentRole || ''}
                                        onChange={(e) => {
                                          const val = e.target.value as 'R' | 'A' | 'C' | 'I' | '';
                                          setRaciMutation.mutate({
                                            planItemId: item.id,
                                            projectMemberId: member.id,
                                            raciRole: val ? val : null,
                                          });
                                        }}
                                        className={`w-24 rounded-lg px-2 py-1 text-xs font-bold text-center border cursor-pointer transition ${
                                          currentRole === 'R'
                                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                                            : currentRole === 'A'
                                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                              : currentRole === 'C'
                                                ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                                                : currentRole === 'I'
                                                  ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                                        }`}
                                      >
                                        <option value="">— Aucun —</option>
                                        <option value="R">R (Réalisateur)</option>
                                        <option value="A">A (Approbateur)</option>
                                        <option value="C">C (Consulté)</option>
                                        <option value="I">I (Informé)</option>
                                      </select>
                                    </div>
                                  </td>
                                );
                              })}

                              {/* Governance status */}
                              <td className="px-4 py-2 text-center">
                                {isCompliant ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Conforme (1 A, {countR} R)
                                  </span>
                                ) : countA === 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900" title="Chaque élément du projet devrait avoir un décideur / approbateur unique">
                                    <AlertTriangle className="h-3 w-3 text-amber-700" />
                                    Aucun Approbateur (A)
                                  </span>
                                ) : countA > 1 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800" title="Il est déconseillé d'avoir plusieurs 'A' (confusion sur la responsabilité finale)">
                                    <AlertTriangle className="h-3 w-3 text-red-700" />
                                    Conflit ({countA} 'A')
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                                    ℹ️ Aucun Réalisateur (R)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      {/* Summary Footer: Totals per member */}
                      <tfoot className="border-t-2 border-slate-300 bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <td className="px-4 py-3 border-r border-slate-200">
                            Total des Rôles par Partie Prenante
                          </td>
                          {members.map((member: any) => {
                            const memberRacis = raci.filter((r: any) => r.projectMemberId === member.id);
                            const countR = memberRacis.filter((r: any) => r.raciRole === 'R').length;
                            const countA = memberRacis.filter((r: any) => r.raciRole === 'A').length;
                            const countC = memberRacis.filter((r: any) => r.raciRole === 'C').length;
                            const countI = memberRacis.filter((r: any) => r.raciRole === 'I').length;

                            return (
                              <td key={member.id} className="px-2 py-3 text-center border-r border-slate-200">
                                <div className="flex flex-col gap-0.5 text-[10px]">
                                  <span className="text-indigo-700">R: {countR}</span>
                                  <span className="text-amber-700">A: {countA}</span>
                                  <span className="text-purple-700">C: {countC}</span>
                                  <span className="text-teal-700">I: {countI}</span>
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center text-[11px] text-slate-500">
                            {raci.length} rôles attribués
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* RACI Best Practices & Legend Guide */}
              <div className="rounded-xl border bg-slate-50 p-6">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  Guide Méthodologique RACI & Bonnes Pratiques de Gestion de Projet
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(RACI_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="rounded-lg border bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${cfg.color}`}>
                          {key}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">{cfg.label}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{cfg.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-900">
                  💡 <strong>Règle d'or de la gouvernance :</strong> Chaque phase, activité ou tâche doit comporter <strong>exactement 1 Approbateur (A)</strong> (évite la dilution des responsabilités) et au moins <strong>1 Réalisateur (R)</strong>. Les parties prenantes consultées (C) et informées (I) facilitent la coordination sans alourdir la décision.
                </div>
              </div>
            </div>
          );
            })()}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PILIER 2: PLANIFICATION INTÉGRALE                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'planning' && (
          <div className="space-y-6">
            {/* Sub-tab Navigation & PERT CPM Synchronizer */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl w-fit border border-slate-300 shadow-2xs">
                <button
                  onClick={() => setPlanningSubTab('wbs')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    planningSubTab === 'wbs' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListTodo className="h-3.5 w-3.5" />
                  Arborescence WBS ({planItems.length})
                </button>
                <button
                  onClick={() => setPlanningSubTab('gantt')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    planningSubTab === 'gantt' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Diagramme de Gantt
                </button>
                <button
                  onClick={() => setPlanningSubTab('pert')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    planningSubTab === 'pert' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Flame className="h-3.5 w-3.5" />
                  Réseau PERT & Chemin Critique
                </button>
                <button
                  onClick={() => setPlanningSubTab('budget_plan')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    planningSubTab === 'budget_plan' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  Budget Prévisionnel ({projBudget?.lines?.length || 0})
                </button>
              </div>

              {/* PERT CPM Auto-Scheduling Bar & Project Start Date (T0) */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                    Date début projet (T₀) :
                  </span>
                  <input
                    type="date"
                    value={proj.startDate ? proj.startDate.split('T')[0] : ''}
                    onChange={(e) => updateProjectStartDateMutation.mutate(e.target.value)}
                    disabled={updateProjectStartDateMutation.isPending}
                    className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-indigo-900 focus:bg-white focus:outline-indigo-500"
                    title="Date de référence T0 du projet. La modifier ventile automatiquement toutes les dates du réseau PERT/CPM."
                  />
                  {updateProjectStartDateMutation.isPending && (
                    <span className="text-[10px] text-indigo-600 font-medium animate-pulse">Ventilation...</span>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => syncPertScheduleMutation.mutate()}
                  disabled={syncPertScheduleMutation.isPending || planItems.length === 0}
                  className="text-xs font-bold border-indigo-300 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 flex items-center gap-1.5 shadow-2xs"
                  title="Recalcule automatiquement les dates de début et de fin de toutes les tâches et conteneurs selon la logique du réseau PERT/CPM"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncPertScheduleMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>{syncPertScheduleMutation.isPending ? 'Synchronisation...' : '🔄 Synchroniser PERT/CPM'}</span>
                </Button>
              </div>
            </div>

            {/* Sub-tab 1: WBS Table (Baseline Planning) */}
            {planningSubTab === 'wbs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Structure de Découpage du Travail (WBS)</h2>
                    <p className="text-sm text-slate-500">Planification des phases, activités, tâches opérationnelles, jalons et coûts prévisionnels (PV)</p>
                  </div>
                  <Button size="sm" onClick={() => setShowPlanItemForm(!showPlanItemForm)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un élément
                  </Button>
                </div>

                {showPlanItemForm && (() => {
                  const rootPhases = planItems.filter((p: any) => p.type === 'phase');
                  const allActivities = planItems.filter((p: any) => p.type === 'activity');
                  const selectedParent = planItems.find((p: any) => p.id === piParentId);
                  
                  const getSuggestedWbs = () => {
                    if (piWbs) return piWbs;
                    if (piType === 'phase') {
                      return `${rootPhases.length + 1}`;
                    }
                    if (selectedParent) {
                      const siblings = planItems.filter((p: any) => p.parentId === piParentId);
                      return `${selectedParent.wbs}.${siblings.length + 1}`;
                    }
                    const rootItems = planItems.filter((p: any) => !p.parentId);
                    return `${rootItems.length + 1}`;
                  };

                  const suggestedWbs = getSuggestedWbs();

                  return (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
                        <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-indigo-600" />
                          <span>Ajouter un élément au plan WBS</span>
                        </h3>
                        <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded font-mono font-bold">
                          Code suggéré : {suggestedWbs}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            1. Type d'élément *
                          </label>
                          <select
                            value={piType}
                            onChange={(e) => {
                              const newType = e.target.value as PlanItem['type'];
                              setPiType(newType);
                              setPiWbs('');
                              
                              if (newType === 'phase') {
                                setPiParentId('');
                              } else if (newType === 'activity' && rootPhases.length > 0) {
                                if (!piParentId || !rootPhases.some((p: any) => p.id === piParentId)) {
                                  setPiParentId(rootPhases[0].id);
                                }
                              } else if (newType === 'task' && allActivities.length > 0) {
                                if (!piParentId || !allActivities.some((a: any) => a.id === piParentId)) {
                                  setPiParentId(allActivities[0].id);
                                }
                              }

                              if (newType === 'milestone') {
                                const dateToUse = piEnd || piStart;
                                setPiStart(dateToUse);
                                setPiEnd(dateToUse);
                              }
                            }}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold shadow-xs"
                          >
                            <option value="phase">🏛️ Phase (Niveau 1 — Macro)</option>
                            <option value="activity">📦 Activité / Lot (Niveau 2)</option>
                            <option value="task">📋 Tâche opérationnelle (Niveau 3)</option>
                            <option value="milestone">🚩 Jalon clé (Date cible)</option>
                            <option value="deliverable">📄 Livrable formel</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            2. Élément parent (Rattachement)
                          </label>
                          {piType === 'phase' ? (
                            <div className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500 font-medium">
                              Niveau 1 (Racine du projet)
                            </div>
                          ) : (
                            <select
                              value={piParentId}
                              onChange={(e) => {
                                const newParentId = e.target.value;
                                setPiParentId(newParentId);
                                setPiWbs('');
                                const parent = planItems.find((p: any) => p.id === newParentId);
                                if (parent) {
                                  if (piType === 'milestone') {
                                    setPiStart(parent.endDate || parent.startDate || '');
                                    setPiEnd(parent.endDate || parent.startDate || '');
                                  } else {
                                    if (parent.startDate && !piStart) setPiStart(parent.startDate);
                                  }
                                }
                              }}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium shadow-xs"
                            >
                              <option value="">— Aucun parent (Racine) —</option>
                              {planItems
                                .filter((p: any) => p.type === 'phase' || p.type === 'activity')
                                .map((p: any) => (
                                  <option key={p.id} value={p.id}>
                                    {p.wbs} — {p.title} ({p.type === 'phase' ? 'Phase' : 'Activité'})
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            3. Code WBS
                          </label>
                          <Input
                            value={piWbs}
                            onChange={(e) => setPiWbs(e.target.value)}
                            placeholder={suggestedWbs}
                            className="bg-white font-mono font-bold text-xs"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            4. Titre de l'élément *
                          </label>
                          <Input
                            value={piTitle}
                            onChange={(e) => setPiTitle(e.target.value)}
                            placeholder="Ex: Analyse préliminaire des besoins..."
                            className="bg-white text-xs font-medium"
                          />
                        </div>

                        {piType === 'milestone' ? (
                          <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                            <div>
                              <label className="mb-1 block text-xs font-bold text-amber-900">
                                Date cible / Échéance contractuelle (optionnelle)
                              </label>
                              <Input
                                type="date"
                                value={piEnd || piStart}
                                onChange={(e) => {
                                  setPiStart(e.target.value);
                                  setPiEnd(e.target.value);
                                }}
                                className="bg-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold text-amber-900">
                                Coût / Facturation associée (CAD) - Optionnel
                              </label>
                              <Input
                                type="number"
                                value={piEstimatedCost}
                                onChange={(e) => setPiEstimatedCost(e.target.value)}
                                placeholder="0.00"
                                className="bg-white text-xs font-bold"
                              />
                            </div>
                            <div className="sm:col-span-2 text-xs text-amber-900 bg-amber-100/60 p-2.5 rounded-lg border border-amber-200/80 space-y-1">
                              <span className="font-bold block">🚩 Jalon clé (Durée = 0 jour) :</span>
                              <p className="text-[11px] text-amber-800 leading-relaxed">
                                Un jalon est un événement charnière ou point de validation. Sa date de franchissement est <strong>calculée automatiquement par le réseau PERT</strong> dès que toutes ses tâches antécédentes (prédécesseurs) sont terminées.
                              </p>
                            </div>
                          </div>
                        ) : piType === 'phase' || piType === 'activity' ? (
                          <div className="sm:col-span-3 bg-purple-50/70 p-3 rounded-lg border border-purple-200 text-xs text-purple-900 leading-relaxed">
                            🏛️ <strong>Conteneur WBS :</strong> Les dates, durées et budgets de cette {piType === 'phase' ? 'phase' : 'activité'} seront consolidés automatiquement par roll-up à partir de ses sous-tâches.
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Durée estimée (jours ouvrés) *
                              </label>
                              <Input
                                type="number"
                                min={1}
                                value={piDuration}
                                onChange={(e) => setPiDuration(e.target.value)}
                                placeholder="5"
                                className="bg-white text-xs font-bold font-mono"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Coût estimé planifié (CAD) - PV
                              </label>
                              <Input
                                type="number"
                                value={piEstimatedCost}
                                onChange={(e) => setPiEstimatedCost(e.target.value)}
                                placeholder="0.00"
                                className="bg-white text-xs font-bold"
                              />
                            </div>

                            <div className="sm:col-span-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2">
                              <Calendar className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-slate-800">Ordonnancement automatique (PERT / CPM) :</span> Les dates de début et de fin au calendrier seront calculées automatiquement à partir de la date de démarrage du projet et des contraintes de précédence (liaisons FS, SS, FF, SF).
                              </div>
                            </div>

                            <div className="sm:col-span-3 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setShowPertInputs(!showPertInputs)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                                  showPertInputs
                                    ? 'bg-indigo-600 text-white border-indigo-700'
                                    : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                                }`}
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                {showPertInputs ? 'Masquer estimation PERT 3-points' : '🎯 Estimation avancée PERT à 3 points (O, M, P)'}
                              </button>
                            </div>

                            {showPertInputs && (
                              <div className="sm:col-span-3 rounded-lg bg-white border border-indigo-100 p-3 space-y-2">
                                <span className="text-[11px] font-bold text-indigo-900 block">
                                  Estimation PERT probabiliste : Durée moyenne attendue Te = (O + 4M + P) / 6
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="mb-1 block text-[10px] font-bold text-slate-600">Durée Optimiste (O) [jours]</label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={piOptimistic}
                                      onChange={(e) => {
                                        setPiOptimistic(e.target.value);
                                        if (e.target.value && piMostLikely && piPessimistic) {
                                          const te = Math.round(((parseInt(e.target.value) + 4 * parseInt(piMostLikely) + parseInt(piPessimistic)) / 6) * 10) / 10;
                                          setPiDuration(String(Math.max(1, Math.round(te))));
                                        }
                                      }}
                                      placeholder="Ex: 2"
                                      className="text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-bold text-slate-600">Durée la plus Probable (M) [jours]</label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={piMostLikely}
                                      onChange={(e) => {
                                        setPiMostLikely(e.target.value);
                                        if (piOptimistic && e.target.value && piPessimistic) {
                                          const te = Math.round(((parseInt(piOptimistic) + 4 * parseInt(e.target.value) + parseInt(piPessimistic)) / 6) * 10) / 10;
                                          setPiDuration(String(Math.max(1, Math.round(te))));
                                        }
                                      }}
                                      placeholder="Ex: 5"
                                      className="text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-bold text-slate-600">Durée Pessimiste (P) [jours]</label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={piPessimistic}
                                      onChange={(e) => {
                                        setPiPessimistic(e.target.value);
                                        if (piOptimistic && piMostLikely && e.target.value) {
                                          const te = Math.round(((parseInt(piOptimistic) + 4 * parseInt(piMostLikely) + parseInt(e.target.value)) / 6) * 10) / 10;
                                          setPiDuration(String(Math.max(1, Math.round(te))));
                                        }
                                      }}
                                      placeholder="Ex: 12"
                                      className="text-xs"
                                    />
                                  </div>
                                </div>
                                {piOptimistic && piMostLikely && piPessimistic && (
                                  <div className="text-[11px] text-indigo-700 font-mono bg-indigo-50 p-2 rounded">
                                    Durée retenue Te : <strong>{Math.round(((parseInt(piOptimistic) + 4 * parseInt(piMostLikely) + parseInt(piPessimistic)) / 6) * 10) / 10} jours</strong> (Écart-type σ: ±{Math.round(((parseInt(piPessimistic) - parseInt(piOptimistic)) / 6) * 10) / 10} j)
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-indigo-200/60">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!piWbs && suggestedWbs) {
                              setPiWbs(suggestedWbs);
                            }
                            if (piType === 'milestone') {
                              const milestoneDate = piEnd || piStart;
                              setPiStart(milestoneDate);
                              setPiEnd(milestoneDate);
                            }
                            addPlanItem.mutate();
                          }}
                          disabled={!piTitle.trim() || addPlanItem.isPending}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                        >
                          {addPlanItem.isPending ? 'Enregistrement...' : 'Enregistrer dans le WBS'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowPlanItemForm(false)} className="text-xs">
                          Annuler
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {planItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                    <ListTodo className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Aucun élément de plan défini</p>
                    <p className="mt-1 text-xs text-slate-400">Structurez le projet en phases (1, 2), activités (1.1, 1.2), tâches (1.1.1) et jalons.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-slate-50">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-3">WBS</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Titre de l'élément</th>
                          <th className="px-4 py-3">Période / Dates</th>
                          <th className="px-4 py-3 text-center">Durée</th>
                          <th className="px-4 py-3">Prédécesseurs (PERT)</th>
                          <th className="px-4 py-3 text-right">Coût estimé (PV)</th>
                          <th className="px-4 py-3">Responsable (RACI)</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[...planItems]
                          .sort((a: any, b: any) => a.wbs.localeCompare(b.wbs, undefined, { numeric: true }))
                          .map((item: any) => {
                            const depth = Math.max(0, (item.wbs || '').split('.').length - 1);
                            const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.task;
                            const isMilestone = item.type === 'milestone';
                            const isContainer = item.type === 'phase' || item.type === 'activity';
                            const assignee = members.find((m: any) => m.id === item.assigneePartyId);
                            const itemPreds = (dependencies || []).filter((d: any) => d.successorId === item.id);

                            return (
                              <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600">{item.wbs}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${typeCfg.badgeClass}`}>
                                    {typeCfg.icon}
                                    {typeCfg.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div
                                    className={`flex items-center gap-1.5 ${isMilestone ? 'text-amber-900 font-bold' : item.type === 'phase' ? 'text-purple-950 font-bold text-sm' : item.type === 'activity' ? 'text-indigo-950 font-semibold' : 'text-slate-800 font-medium'}`}
                                    style={{ paddingLeft: `${depth * 18}px` }}
                                  >
                                    {depth > 0 && <span className="text-slate-300 font-mono">↳</span>}
                                    <span>{item.title}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600">
                                  {isMilestone ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-800 border border-amber-200">
                                      <Flag className="h-3 w-3 text-amber-600" />
                                      {item.endDate || item.startDate || '—'}
                                    </span>
                                  ) : item.startDate && item.endDate ? (
                                    <span className="flex items-center gap-1 font-medium">
                                      <Calendar className="h-3 w-3 text-slate-400" />
                                      {item.startDate} → {item.endDate}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">
                                      {isContainer ? 'Calculé au roll-up' : item.startDate || 'Non planifié'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center text-xs font-mono font-medium">
                                  {isMilestone ? (
                                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">0 j</span>
                                  ) : (
                                    <span className={isContainer ? 'text-purple-700 font-bold' : 'text-slate-700'}>
                                      {item.durationDays || 0} j {isContainer ? '(roll-up)' : ''}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  {itemPreds.length === 0 ? (
                                    <span className="text-slate-300">—</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {itemPreds.map((pred: any) => {
                                        const predTask = planItems.find((p: any) => p.id === pred.predecessorId);
                                        return (
                                          <span
                                            key={pred.id}
                                            className="inline-flex items-center gap-1 bg-violet-50 text-violet-800 border border-violet-200 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold"
                                            title={`Prédécesseur : ${predTask?.title || 'Tâche'}`}
                                          >
                                            <Link2 className="h-2.5 w-2.5 text-violet-600" />
                                            {predTask?.wbs || '?'}:{pred.type}{pred.lagDays ? `+${pred.lagDays}j` : ''}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right text-xs">
                                  {isContainer ? (
                                    <div className="flex flex-col items-end">
                                      <span className="font-bold text-indigo-900 font-mono">
                                        {fmt(item.estimatedCost || 0)}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-normal">roll-up</span>
                                    </div>
                                  ) : (
                                    <span className="font-semibold text-slate-800 font-mono">
                                      {fmt(item.estimatedCost || 0)}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600">
                                  {assignee ? (
                                    <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                                      <Users className="h-3 w-3 text-slate-400" />
                                      {assignee.name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">Non assigné</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setSelectedTask(item)}
                                      className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                      title="Modifier et paramétrer cet élément"
                                    >
                                      <Pencil className="h-3.5 w-3.5 mr-1" />
                                      Modifier
                                    </Button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const children = planItems.filter((p: any) => p.parentId === item.id);
                                        const confirmMsg = children.length > 0
                                          ? `Supprimer "${item.wbs} — ${item.title}" supprimera également ses ${children.length} sous-élément(s) rattaché(s). Confirmer ?`
                                          : `Êtes-vous sûr de vouloir supprimer l'élément "${item.wbs} — ${item.title}" ?`;
                                        if (window.confirm(confirmMsg)) {
                                          deletePlanItem.mutate(item.id);
                                        }
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                                      title="Supprimer cet élément"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}{/* Sub-tab 2: Gantt */}
            {planningSubTab === 'gantt' && (
              <GanttChartInteractive
                tasks={planItems}
                dependencies={dependencies}
                onSelectTask={(t) => {
                  setSelectedTask(t);
                  setLogProgress(t.progressPct || 0);
                  setLogIsBlocked(t.status === 'blocked');
                }}
              />
            )}

            {/* Sub-tab 3: PERT Network Diagram */}
            {planningSubTab === 'pert' && (
              <PertNetworkDiagram
                tasks={planItems}
                dependencies={dependencies}
                onSelectTask={(t) => {
                  setSelectedTask(t);
                  setLogProgress(t.progressPct || 0);
                  setLogIsBlocked(t.status === 'blocked');
                }}
              />
            )}

            {/* Sub-tab 4: Budget Prévisionnel */}
            {planningSubTab === 'budget_plan' && (
              <div className="space-y-6">
                {/* Budget KPI Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Budget total alloué</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{fmt(totalBudget)}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{projBudget?.lines?.length || 0} ligne(s) budgétaire(s)</p>
                  </div>
                  <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Coûts estimés WBS (PV)</p>
                    <p className="mt-1 text-2xl font-bold text-indigo-700">{fmt(totalWbsEstimatedCost)}</p>
                    <p className="mt-0.5 text-xs text-slate-400">Somme des tâches & lots</p>
                  </div>
                  <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Dépenses réelles (AC)</p>
                    <p className="mt-1 text-2xl font-bold text-amber-600">{fmt(totalApprovedExpenses)}</p>
                    <p className="mt-0.5 text-xs text-slate-400">Factures approuvées</p>
                  </div>
                  <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Solde budgétaire disponible</p>
                    <p className={`mt-1 text-2xl font-bold ${remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {fmt(remaining)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">Budget - Dépensé</p>
                  </div>
                </div>

                {/* Section 1 : Ventilation des Coûts par Structure WBS (Cost Breakdown Structure - CBS) */}
                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between border-b px-5 py-4 bg-slate-50/50">
                    <div>
                      <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-indigo-600" />
                        Ventilation & Planification des Coûts par Phase, Activité et Tâche (CBS)
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Coûts prévisionnels (PV) affectés à chaque niveau de l'arborescence du projet
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full font-mono">
                      Total WBS : {fmt(totalWbsEstimatedCost)}
                    </span>
                  </div>

                  {planItems.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                      Aucun élément dans le WBS pour ventiler les coûts. Créez des phases et des tâches dans l'arborescence WBS.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                          <tr>
                            <th className="px-5 py-3 text-left">Code WBS</th>
                            <th className="px-5 py-3 text-left">Type</th>
                            <th className="px-5 py-3 text-left">Élément de travail</th>
                            <th className="px-5 py-3 text-right">Coût Planifié (PV)</th>
                            <th className="px-5 py-3 text-right">% du Budget WBS</th>
                            <th className="px-5 py-3 text-left">Responsable / Statut</th>
                            <th className="px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[...planItems]
                            .sort((a: any, b: any) => a.wbs.localeCompare(b.wbs, undefined, { numeric: true }))
                            .map((item: any) => {
                              const depth = Math.max(0, (item.wbs || '').split('.').length - 1);
                              const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.task;
                              const cost = parseFloat(item.estimatedCost || '0');
                              const pctBudget = totalWbsEstimatedCost > 0 ? Math.round((cost / totalWbsEstimatedCost) * 100) : 0;
                              const isContainer = item.type === 'phase' || item.type === 'activity';
                              const assignee = members.find((m: any) => m.id === item.assigneePartyId);

                              return (
                                <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isContainer ? 'bg-slate-50/40 font-semibold' : ''}`}>
                                  <td className="px-5 py-3 font-mono text-xs font-bold text-slate-600">{item.wbs}</td>
                                  <td className="px-5 py-3">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${typeCfg.badgeClass}`}>
                                      {typeCfg.icon}
                                      {typeCfg.label}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3">
                                    <div
                                      className={`flex items-center gap-1.5 ${item.type === 'phase' ? 'text-purple-950 font-bold' : item.type === 'activity' ? 'text-indigo-950 font-semibold' : 'text-slate-700'}`}
                                      style={{ paddingLeft: `${depth * 18}px` }}
                                    >
                                      {depth > 0 && <span className="text-slate-300 font-mono">↳</span>}
                                      <span>{item.title}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3 text-right font-mono">
                                    {isContainer ? (
                                      <div className="flex flex-col items-end">
                                        <span className="font-bold text-indigo-900">{fmt(cost)}</span>
                                        <span className="text-[10px] text-slate-400 font-normal">roll-up</span>
                                      </div>
                                    ) : (
                                      <span className="font-semibold text-slate-800">{fmt(cost)}</span>
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
                                      <span className="font-mono text-xs text-slate-600 w-8 text-right">{pctBudget}%</span>
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
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setSelectedTask(item)}
                                      className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                      title="Consulter et ajuster les coûts et paramètres"
                                    >
                                      Détails
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                          <tr>
                            <td colSpan={3} className="px-5 py-3">Total Coûts Prévisionnels WBS (PV)</td>
                            <td className="px-5 py-3 text-right font-mono text-indigo-900">{fmt(totalWbsEstimatedCost)}</td>
                            <td className="px-5 py-3 text-right font-mono">100%</td>
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 2 : Lignes Budgétaires par Catégorie Métier */}
                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                      <h2 className="font-semibold text-slate-800 text-sm">Lignes Budgétaires par Catégorie Métier</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Budget formel ventilé par poste de dépense (Personnel, Matériel, etc.)</p>
                    </div>
                    <Button size="sm" onClick={() => setShowBudgetLineForm(!showBudgetLineForm)}>
                      <Plus className="mr-1 h-4 w-4" />
                      Ajouter une ligne
                    </Button>
                  </div>
                  {showBudgetLineForm && (
                    <div className="border-b bg-indigo-50 p-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Catégorie</label>
                          <select
                            value={blCategory}
                            onChange={(e) => setBlCategory(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                          >
                            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Description *</label>
                          <Input value={blDescription} onChange={(e) => setBlDescription(e.target.value)} placeholder="Ex: Salaire coordonnateur..." />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Montant (CAD) *</label>
                          <Input type="number" value={blAmount} onChange={(e) => setBlAmount(e.target.value)} placeholder="0.00" />
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={() => addBudgetLine.mutate()} disabled={!blDescription.trim() || !blAmount || addBudgetLine.isPending}>
                          Enregistrer
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowBudgetLineForm(false)}>Annuler</Button>
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
                          <th className="px-5 py-3 text-right">Montant planifié</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {projBudget.lines.map((line: any) => {
                          const isEditing = editingBlId === line.id;
                          if (isEditing) {
                            return (
                              <tr key={line.id} className="bg-indigo-50/50">
                                <td className="px-5 py-2.5">
                                  <select
                                    value={editBlCategory}
                                    onChange={(e) => setEditBlCategory(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                  >
                                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                                      <option key={k} value={k}>{v}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-5 py-2.5">
                                  <Input
                                    value={editBlDescription}
                                    onChange={(e) => setEditBlDescription(e.target.value)}
                                    placeholder="Description"
                                    className="bg-white text-xs"
                                  />
                                </td>
                                <td className="px-5 py-2.5 text-right">
                                  <Input
                                    type="number"
                                    value={editBlAmount}
                                    onChange={(e) => setEditBlAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="bg-white text-xs text-right font-semibold"
                                  />
                                </td>
                                <td className="px-5 py-2.5 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      className="h-7 px-2.5 text-xs"
                                      disabled={!editBlDescription.trim() || !editBlAmount || updateBudgetLine.isPending}
                                      onClick={() => {
                                        updateBudgetLine.mutate({
                                          lineId: line.id,
                                          categoryCode: editBlCategory,
                                          description: editBlDescription.trim(),
                                          amount: parseFloat(editBlAmount),
                                        });
                                      }}
                                    >
                                      <Check className="h-3.5 w-3.5 mr-1" />
                                      Enregistrer
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => setEditingBlId(null)}
                                    >
                                      Annuler
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={line.id} className="hover:bg-slate-50 group">
                              <td className="px-5 py-3">
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                  {CATEGORY_LABELS[line.categoryCode] || line.categoryCode}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-slate-700 font-medium">{line.description}</td>
                              <td className="px-5 py-3 text-right font-semibold text-slate-900">{fmt(line.amount)}</td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    title="Modifier cette ligne budgétaire"
                                    onClick={() => {
                                      setEditingBlId(line.id);
                                      setEditBlCategory(line.categoryCode);
                                      setEditBlDescription(line.description);
                                      setEditBlAmount(line.amount);
                                    }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    title="Supprimer cette ligne budgétaire"
                                    onClick={() => {
                                      if (window.confirm(`Supprimer la ligne budgétaire "${line.description}" (${fmt(line.amount)}) ?`)) {
                                        deleteBudgetLine.mutate(line.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                          <td colSpan={2} className="px-5 py-3 font-bold text-slate-700">Total Lignes Budgétaires</td>
                          <td className="px-5 py-3 text-right font-bold text-slate-900">{fmt(totalBudget)}</td>
                          <td className="px-5 py-3"></td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PILIER 3: EXÉCUTION & OPÉRATIONS                                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'execution' && (
          <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl w-fit border border-slate-300 shadow-2xs">
              <button
                onClick={() => setExecutionSubTab('tasks')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  executionSubTab === 'tasks' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tâches & Tableau Kanban ({totalTasks})
              </button>
              <button
                onClick={() => setExecutionSubTab('expenses')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  executionSubTab === 'expenses' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                Dépenses Réelles & Factures ({expenses.length})
              </button>
              <button
                onClick={() => setExecutionSubTab('deliverables')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  executionSubTab === 'deliverables' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PackageCheck className="h-3.5 w-3.5" />
                Registre des Livrables ({deliverables.length})
              </button>
            </div>

            {/* Sub-tab 1: Tâches & Kanban */}
            {executionSubTab === 'tasks' && (
              <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Centre d'Évolution des Tâches & Livrables</h2>
                <p className="text-sm text-slate-500">
                  Cliquez sur n'importe quelle tâche pour ouvrir son journal d'évolution, consigner des logs, signaler un blocage ou déposer un livrable.
                </p>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
              {Object.entries(STATUS_CONFIG).map(([statusKey, cfg]) => {
                const items = planItems.filter((p: any) => p.status === statusKey && (p.type === 'task' || p.type === 'milestone'));
                return (
                  <div key={statusKey} className="space-y-3">
                    <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${cfg.color}`}>
                      <span className="flex items-center gap-1.5">{cfg.icon} {cfg.label}</span>
                      <span className="rounded-full bg-white/70 px-2 py-0.5 font-bold">{items.length}</span>
                    </div>
                    {items.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-300">
                        Aucune tâche
                      </div>
                    )}
                    {items.map((item: any) => {
                      const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.task;
                      const isMilestone = item.type === 'milestone';
                      const taskUpdates = updates.filter((u: any) => u.planItemId === item.id);
                      const taskDeliverables = deliverables.filter((d: any) => d.planItemId === item.id);
                      const hasBlocker = item.status === 'blocked';

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedTask(item);
                            setLogProgress(item.progressPct || 0);
                            setLogIsBlocked(item.status === 'blocked');
                          }}
                          className={`cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition hover:border-indigo-400 hover:shadow-md ${
                            hasBlocker ? 'border-red-300 bg-red-50/30' : ''
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-500">{item.wbs}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${typeCfg.badgeClass}`}>
                              {typeCfg.icon}
                              {typeCfg.label}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          
                          {item.endDate && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                              {isMilestone ? <Flag className="h-3.5 w-3.5 text-amber-500" /> : <Calendar className="h-3.5 w-3.5 text-slate-400" />}
                              {isMilestone ? `Jalon le : ${item.endDate}` : `Échéance : ${item.endDate}`}
                            </p>
                          )}

                          <div className="mt-3">
                            <ProgressBar value={item.progressPct || 0} />
                          </div>

                          {/* Mini badges for updates and deliverables */}
                          <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-indigo-500" />
                              {taskUpdates.length} log{taskUpdates.length !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <PackageCheck className="h-3 w-3 text-emerald-500" />
                              {taskDeliverables.length} livrable{taskDeliverables.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Non-task items (phases, activities, deliverables) */}
            {planItems.filter((p: any) => p.type === 'phase' || p.type === 'activity' || p.type === 'deliverable').length > 0 && (
              <div className="mt-8">
                <h3 className="mb-3 text-sm font-bold text-slate-700">Phases, Activités & Livrables Globaux</h3>
                <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                        <th className="px-4 py-3">WBS</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Titre</th>
                        <th className="px-4 py-3">Logs & Livrables</th>
                        <th className="px-4 py-3">Avancement</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {planItems
                        .filter((p: any) => p.type === 'phase' || p.type === 'activity' || p.type === 'deliverable')
                        .sort((a: any, b: any) => a.wbs.localeCompare(b.wbs, undefined, { numeric: true }))
                        .map((item: any) => {
                          const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.activity;
                          const taskUpdates = updates.filter((u: any) => u.planItemId === item.id);
                          const taskDeliverables = deliverables.filter((d: any) => d.planItemId === item.id);

                          return (
                            <tr key={item.id} className="group hover:bg-slate-50">
                              <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-400">{item.wbs}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeCfg.badgeClass}`}>
                                  {typeCfg.icon}
                                  {typeCfg.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800">{item.title}</td>
                              <td className="px-4 py-3 text-xs text-slate-500">
                                <span className="mr-3 inline-flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3 text-indigo-500" /> {taskUpdates.length}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <PackageCheck className="h-3 w-3 text-emerald-500" /> {taskDeliverables.length}
                                </span>
                              </td>
                              <td className="w-44 px-4 py-3">
                                <ProgressBar value={item.progressPct || 0} />
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setSelectedTask(item);
                                    setLogProgress(item.progressPct || 0);
                                    setLogIsBlocked(item.status === 'blocked');
                                  }}
                                >
                                  Ouvrir journal
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
            )}

            {/* Sub-tab 2: Dépenses Réelles */}
            {executionSubTab === 'expenses' && (
              <div className="space-y-6">
                {/* Expenses */}
            <div className="rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="font-semibold text-slate-800">Dépenses</h2>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.open(`/api/v1/projects/${id}/expenses/export`, '_blank')}>
                    <FileSpreadsheet className="mr-1 h-4 w-4 text-emerald-600" />
                    Exporter CSV
                  </Button>
                  <Button size="sm" onClick={() => setShowExpenseForm(!showExpenseForm)}>
                    <Plus className="mr-1 h-4 w-4" />
                    Saisir une dépense
                  </Button>
                </div>
              </div>
              {showExpenseForm && (
                <div className="border-b bg-indigo-50 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Ligne budgétaire *</label>
                      <select
                        value={expBudgetLineId}
                        onChange={(e) => setExpBudgetLineId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">— Sélectionner —</option>
                        {(projBudget?.lines || []).map((line: any) => (
                          <option key={line.id} value={line.id}>
                            {CATEGORY_LABELS[line.categoryCode] || line.categoryCode} — {line.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Fournisseur *</label>
                      <Input value={expVendor} onChange={(e) => setExpVendor(e.target.value)} placeholder="Nom du fournisseur" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Montant (CAD) *</label>
                      <Input type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Date *</label>
                      <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => addExpense.mutate()}
                      disabled={!expVendor.trim() || !expAmount || !expBudgetLineId || addExpense.isPending}
                    >
                      Soumettre
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowExpenseForm(false)}>Annuler</Button>
                  </div>
                </div>
              )}
              {expenses.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">Aucune dépense enregistrée.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Fournisseur</th>
                      <th className="px-5 py-3 text-right">Montant</th>
                      <th className="px-5 py-3 text-center">Statut</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((exp: any) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 text-slate-500">{exp.date}</td>
                        <td className="px-5 py-3 font-medium text-slate-900">{exp.vendor}</td>
                        <td className="px-5 py-3 text-right font-mono">
                          {fmt(exp.amount)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            exp.status === 'approved' || exp.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : exp.status === 'submitted'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {exp.status === 'approved' ? 'Approuvée' : exp.status === 'submitted' ? 'En attente' : exp.status === 'paid' ? 'Payée' : exp.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {exp.status === 'submitted' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveExpense.mutate(exp.id)}
                              disabled={approveExpense.isPending}
                              className="text-emerald-700 hover:bg-emerald-50"
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Approuver
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
              </div>
            )}

            {/* Sub-tab 3: Registre des Livrables */}
            {executionSubTab === 'deliverables' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Registre Général des Livrables</h2>
                    <p className="text-sm text-slate-500">Validation formelle des livrables et preuves de réalisation</p>
                  </div>
                </div>

                {deliverables.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                    <PackageCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Aucun livrable déposé</p>
                    <p className="mt-1 text-xs text-slate-400">Les livrables sont déposés par les responsables de tâches dans le tiroir d'exécution.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-3 text-left">Livrable & Document</th>
                          <th className="px-5 py-3 text-left">Tâche / Activité rattachée</th>
                          <th className="px-5 py-3 text-center">Statut</th>
                          <th className="px-5 py-3 text-left">Vérification</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deliverables.map((deliv: any) => {
                          const parentTask = planItems.find((p: any) => p.id === deliv.planItemId);
                          return (
                            <tr key={deliv.id} className="hover:bg-slate-50">
                              <td className="px-5 py-3">
                                <div className="font-semibold text-slate-900">{deliv.title}</div>
                                {deliv.description && <p className="text-xs text-slate-500 mt-0.5">{deliv.description}</p>}
                                {deliv.fileUrl && (
                                  <a
                                    href={deliv.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 mt-1"
                                  >
                                    <Paperclip className="h-3 w-3" />
                                    Voir le fichier / lien
                                  </a>
                                )}
                              </td>
                              <td className="px-5 py-3 text-slate-700">
                                {parentTask ? (
                                  <button
                                    onClick={() => setSelectedTask(parentTask)}
                                    className="text-left text-xs font-medium text-indigo-700 hover:underline flex items-center gap-1"
                                  >
                                    <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] font-bold text-indigo-800">{parentTask.wbs}</span>
                                    <span>{parentTask.title}</span>
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400">Élément #{deliv.planItemId.slice(0, 8)}</span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    deliv.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : deliv.status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {deliv.status === 'approved' && <Check className="h-3 w-3" />}
                                  {deliv.status === 'rejected' && <X className="h-3 w-3" />}
                                  {deliv.status === 'pending' && <Clock className="h-3 w-3" />}
                                  {deliv.status === 'approved' ? 'Approuvé' : deliv.status === 'rejected' ? 'Rejeté' : 'En attente'}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-xs text-slate-500">
                                {deliv.verifiedBy ? (
                                  <div>
                                    <span className="font-medium text-slate-700">{deliv.verifiedBy}</span>
                                    {deliv.verifiedAt && <span className="block text-[11px] text-slate-400">{new Date(deliv.verifiedAt).toLocaleDateString('fr-CA')}</span>}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">Non vérifié</span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {deliv.status === 'pending' && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          if (parentTask) setSelectedTask(parentTask);
                                          verifyDeliverableMutation.mutate({ deliverableId: deliv.id, status: 'approved' });
                                        }}
                                        disabled={verifyDeliverableMutation.isPending}
                                        className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                                        title="Approuver le livrable"
                                      >
                                        <Check className="mr-1 h-3 w-3" /> Approuver
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          if (parentTask) setSelectedTask(parentTask);
                                          verifyDeliverableMutation.mutate({ deliverableId: deliv.id, status: 'rejected' });
                                        }}
                                        disabled={verifyDeliverableMutation.isPending}
                                        className="h-7 px-2 text-xs text-red-700 hover:bg-red-50 border-red-300"
                                        title="Rejeter le livrable"
                                      >
                                        <X className="mr-1 h-3 w-3" /> Rejeter
                                      </Button>
                                    </>
                                  )}
                                  {parentTask && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setSelectedTask(parentTask)}
                                      className="h-7 px-2 text-xs text-slate-600 hover:text-indigo-600"
                                    >
                                      Ouvrir la tâche
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PILIER 4: SUIVI & CONTRÔLE DE PERFORMANCE                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl w-fit border border-slate-300 shadow-2xs">
              <button
                onClick={() => setMonitoringSubTab('evm')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  monitoringSubTab === 'evm' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Valeur Acquise & EVM (Courbe en S)
              </button>
              <button
                onClick={() => setMonitoringSubTab('raid')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  monitoringSubTab === 'raid' ? 'bg-white text-orange-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Registre RAID ({raidItems.length})
              </button>
              <button
                onClick={() => setMonitoringSubTab('health')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  monitoringSubTab === 'health' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Radar de Santé & Alertes de Dérives
              </button>
            </div>

            {/* Sub-tab 1: EVM */}
            {monitoringSubTab === 'evm' && (
              <EarnedValueManagementView
                tasks={planItems}
                expenses={expenses}
                budgetTotal={totalBudget}
              />
            )}

            {/* Sub-tab 2: RAID */}
            {monitoringSubTab === 'raid' && (
              <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Registre RAID</h2>
                <p className="text-sm text-slate-500">Risques · Hypothèses · Enjeux · Dépendances</p>
              </div>
              <Button size="sm" onClick={() => setShowRaidForm(!showRaidForm)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un élément
              </Button>
            </div>

            {/* RAID form */}
            {showRaidForm && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-orange-800">Nouvel élément RAID</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
                    <select
                      value={raidType}
                      onChange={(e) => setRaidType(e.target.value as RaidItem['type'])}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      {Object.entries(RAID_TYPE_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Titre *</label>
                    <Input value={raidTitle} onChange={(e) => setRaidTitle(e.target.value)} placeholder="Décrivez le risque ou l'enjeu..." />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                    <textarea
                      value={raidDesc}
                      onChange={(e) => setRaidDesc(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Contexte, mitigation, notes..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Probabilité (1-5)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min={1} max={5} value={raidProb}
                        onChange={(e) => setRaidProb(e.target.value)}
                        className="flex-1"
                      />
                      <span className="w-6 text-center font-bold text-orange-700">{raidProb}</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Impact (1-5)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min={1} max={5} value={raidImpact}
                        onChange={(e) => setRaidImpact(e.target.value)}
                        className="flex-1"
                      />
                      <span className="w-6 text-center font-bold text-orange-700">{raidImpact}</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Responsable</label>
                    <Input value={raidOwner} onChange={(e) => setRaidOwner(e.target.value)} placeholder="Nom du responsable" />
                  </div>
                </div>
                <div className="mt-2 rounded-lg bg-white/60 px-3 py-2 text-xs text-orange-700">
                  Score de sévérité: <strong>{parseInt(raidProb) * parseInt(raidImpact)} / 25</strong>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => addRaidItem.mutate()} disabled={!raidTitle.trim() || addRaidItem.isPending}>
                    Enregistrer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowRaidForm(false)}>Annuler</Button>
                </div>
              </div>
            )}

            {/* RAID Table grouped by type */}
            {raidItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">Aucun élément RAID enregistré</p>
                <p className="mt-1 text-xs text-slate-400">Identifiez et documentez les risques du projet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(['risk', 'issue', 'assumption', 'dependency'] as const).map((type) => {
                  const items = raidItems.filter((r: any) => r.type === type);
                  if (items.length === 0) return null;
                  const cfg = RAID_TYPE_CONFIG[type];
                  return (
                    <div key={type} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                      <div className={`border-b px-5 py-3`}>
                        <h3 className={`text-sm font-bold`}>
                          <span className={`mr-2 rounded-full px-2 py-0.5 ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-slate-400">({items.length})</span>
                        </h3>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                          <tr>
                            <th className="px-5 py-2 text-left">Titre</th>
                            <th className="px-5 py-2 text-left">Description</th>
                            <th className="px-5 py-2 text-center">Sévérité</th>
                            <th className="px-5 py-2 text-left">Responsable</th>
                            <th className="px-5 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[...items]
                            .sort((a: any, b: any) => (b.probability || 1) * (b.impact || 1) - (a.probability || 1) * (a.impact || 1))
                            .map((item: any) => (
                              <tr key={item.id} className="hover:bg-slate-50">
                                <td className="px-5 py-3 font-medium text-slate-800">{item.title}</td>
                                <td className="px-5 py-3 text-slate-500">{item.description || '—'}</td>
                                <td className="px-5 py-3 text-center">
                                  <SeverityBadge probability={item.probability} impact={item.impact} />
                                </td>
                                <td className="px-5 py-3 text-slate-600">{item.ownerName || '—'}</td>
                                <td className="px-5 py-3 text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    title="Supprimer cet élément RAID"
                                    onClick={() => {
                                      if (window.confirm(`Supprimer l'élément "${item.title}" ?`)) {
                                        deleteRaidItem.mutate(item.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
            )}

            {/* Sub-tab 3: Radar de Santé */}
            {monitoringSubTab === 'health' && (
              <div className="space-y-6">
                {/* Health Banner */}
                <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${projectHealth.color}`}>
                        <CheckCircle2 className="h-4 w-4" />
                        {projectHealth.label}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">• Santé calculée selon délais et blocages</span>
                    </div>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">Diagnostic de Santé et Dérives du Projet</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Suivi en continu du respect des jalons, des blocages opérationnels et de la cadence de réalisation.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-50 px-4 py-2 text-center border border-indigo-100">
                      <span className="block text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Avancement Global</span>
                      <span className="text-xl font-extrabold text-indigo-900">{overallProgress}%</span>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-4 py-2 text-center border border-slate-200">
                      <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tâches Finies</span>
                      <span className="text-xl font-extrabold text-slate-800">{completedTasks} / {totalTasks}</span>
                    </div>
                  </div>
                </div>

                {/* Blocked Tasks Alert Box */}
                {blockedTasks > 0 && (
                  <div className="rounded-xl border border-red-300 bg-red-50/80 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-red-600" />
                        <h3 className="text-sm font-bold text-red-900">
                          {blockedTasks} Tâche{blockedTasks > 1 ? 's' : ''} actuellement bloquée{blockedTasks > 1 ? 's' : ''}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-red-700">Action requise</span>
                    </div>
                    <div className="divide-y divide-red-200/60 rounded-lg bg-white border border-red-200">
                      {planItems.filter((p: any) => p.status === 'blocked').map((t: any) => {
                        const taskUpdates = updates.filter((u: any) => u.planItemId === t.id && u.blockerReason);
                        const latestBlocker = taskUpdates[taskUpdates.length - 1]?.blockerReason || 'Motif non précisé';
                        const assignee = members.find((m: any) => m.id === t.assigneePartyId);
                        return (
                          <div key={t.id} className="p-3.5 flex items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded">{t.wbs}</span>
                                <span className="font-bold text-sm text-slate-900">{t.title}</span>
                                {assignee && (
                                  <span className="text-xs text-slate-500">({assignee.name})</span>
                                )}
                              </div>
                              <p className="text-xs text-red-700 mt-1 font-medium">
                                🛑 <strong>Blocage :</strong> {latestBlocker}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setSelectedTask(t)}
                              className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
                            >
                              Débloquer / Intervenir
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Phases Health Breakdown */}
                <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Santé par Phase de Projet</h3>
                      <p className="text-xs text-slate-500">Contrôle des délais et cadence de complétion par phase</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {phasesWithHealth.map((ph: any) => (
                      <div key={ph.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">{ph.wbs}</span>
                            <h4 className="font-bold text-sm text-slate-900 mt-1">{ph.title}</h4>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border ${ph.healthColor}`}>
                            {ph.healthLabel}
                          </span>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500 font-medium">Avancement</span>
                            <span className="font-bold text-indigo-700">{ph.progressPct || 0}%</span>
                          </div>
                          <ProgressBar value={ph.progressPct || 0} />
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                          <span>{ph.completedChildCount} / {ph.childCount} tâches achevées</span>
                          {ph.startDate && ph.endDate && (
                            <span className="text-[11px] text-slate-400">{ph.startDate} → {ph.endDate}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DRAWER / MODAL: CONTEXTUEL (PLANIFICATION vs EXÉCUTION)        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {selectedTask && (() => {
        const currentTask = planItems.find((p: any) => p.id === selectedTask.id) || selectedTask;
        const isPlanningMode = activeTab === 'planning';
        const typeCfg = TYPE_CONFIG[currentTask.type] || TYPE_CONFIG.task;
        const taskUpdates = updates.filter((u: any) => u.planItemId === currentTask.id);
        const taskDeliverables = deliverables.filter((d: any) => d.planItemId === currentTask.id);
        const taskAssignee = members.find((m: any) => m.id === currentTask.assigneePartyId);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm">
            <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b bg-slate-50 p-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{currentTask.wbs}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeCfg.badgeClass}`}>
                      {typeCfg.icon}
                      {typeCfg.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isPlanningMode ? 'bg-indigo-100 text-indigo-800' : (STATUS_CONFIG[currentTask.status]?.color || 'bg-slate-100 text-slate-600')
                    }`}>
                      {isPlanningMode ? '📐 Mode Planification' : (STATUS_CONFIG[currentTask.status]?.label || currentTask.status)}
                    </span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">{currentTask.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                      Période calculée :
                      <strong className="font-bold text-indigo-950 font-mono">
                        {currentTask.startDate && currentTask.endDate ? `${currentTask.startDate} → ${currentTask.endDate}` : 'Calculée au réseau'}
                      </strong>
                      <span className="text-indigo-700 font-medium">({currentTask.durationDays || taskDuration || 1}j)</span>
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {/* ══════════════════════════════════════════════════════════════ */}
                {/* MODE 1 : PLANIFICATION & BASELINE (Strictement planification) */}
                {/* ══════════════════════════════════════════════════════════════ */}
                {isPlanningMode ? (
                  <div className="space-y-5">
                    {/* A. Édition des Informations & Rattachement WBS */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                      <div className="border-b pb-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Pencil className="h-4 w-4 text-indigo-600" />
                          <span>Paramètres WBS & Identification</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Définissez le titre, le code hiérarchique WBS et le type de l'élément de plan.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">Code WBS *</label>
                          <Input
                            value={taskWbs}
                            onChange={(e) => setTaskWbs(e.target.value)}
                            placeholder="Ex: 1.1"
                            className="bg-white font-mono font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">Type d'élément *</label>
                          <select
                            value={taskType}
                            onChange={(e) => setTaskType(e.target.value as PlanItem['type'])}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700"
                          >
                            <option value="phase">🏛️ Phase</option>
                            <option value="activity">📦 Activité / Lot</option>
                            <option value="task">📋 Tâche</option>
                            <option value="milestone">🚩 Jalon</option>
                            <option value="deliverable">📄 Livrable</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">Responsable Assigné</label>
                          <select
                            value={currentTask.assigneePartyId || ''}
                            onChange={async (e) => {
                              const newAssigneeId = e.target.value || null;
                              await fetch(`/api/v1/projects/${id}/plan-items/${currentTask.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ assigneePartyId: newAssigneeId }),
                              });
                              invalidate();
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700"
                          >
                            <option value="">— Non assigné —</option>
                            {members.map((m: any) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.raciRole})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="mb-1 block text-xs font-semibold text-slate-700">Titre de l'élément *</label>
                          <Input
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            placeholder="Titre de l'élément..."
                            className="bg-white text-xs font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* B. Délais, Dates Cibles & Coût Estimé (PV) */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                      <div className="border-b pb-3">
                        <h3 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                          <TrendingUp className="h-4 w-4 text-indigo-600" />
                          Planification des Délais & Coût (PV)
                        </h3>
                        <p className="text-xs text-slate-500">
                          Durée nominale et budget prévisionnel alloué.
                        </p>
                      </div>

                      {taskType === 'milestone' ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Date cible contractuelle (optionnelle)
                              </label>
                              <Input
                                type="date"
                                value={taskStart || taskEnd}
                                onChange={(e) => {
                                  setTaskStart(e.target.value);
                                  setTaskEnd(e.target.value);
                                }}
                                className="bg-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Coût / Facturation associée (CAD) - PV
                              </label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={taskCost}
                                onChange={(e) => setTaskCost(e.target.value)}
                                placeholder="0.00"
                                className="bg-white text-xs font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      ) : taskType === 'phase' || taskType === 'activity' ? (
                        <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 space-y-2 text-xs text-purple-900">
                          <div className="font-bold flex items-center gap-1.5 text-sm">
                            🏛️ Conteneur WBS consolidé ({taskType === 'phase' ? 'Phase' : 'Activité'})
                          </div>
                          <p>
                            Les dates, durées et budgets des conteneurs WBS sont calculés automatiquement par agrégation ascendante (roll-up) de leurs sous-éléments.
                          </p>
                          <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-medium">
                            <div className="bg-white/80 p-2 rounded border border-purple-100">
                              <span className="text-purple-600 block text-[10px] uppercase font-bold">Période Roll-up</span>
                              <strong>{currentTask.startDate || '—'} → {currentTask.endDate || '—'}</strong>
                            </div>
                            <div className="bg-white/80 p-2 rounded border border-purple-100">
                              <span className="text-purple-600 block text-[10px] uppercase font-bold">Durée cumulée</span>
                              <strong>{currentTask.durationDays || 0} jours ouvrés</strong>
                            </div>
                            <div className="bg-white/80 p-2 rounded border border-purple-100">
                              <span className="text-purple-600 block text-[10px] uppercase font-bold">Budget PV consolidé</span>
                              <strong>{fmt(currentTask.estimatedCost || 0)}</strong>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Durée estimée (jours ouvrés) *</label>
                              <Input
                                type="number"
                                min="1"
                                value={taskDuration}
                                onChange={(e) => setTaskDuration(e.target.value)}
                                placeholder="5"
                                className="bg-white font-mono font-bold text-xs"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Coût Estimé Planifié (CAD) - PV</label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={taskCost}
                                onChange={(e) => setTaskCost(e.target.value)}
                                placeholder="0.00"
                                className="bg-white text-xs font-bold"
                              />
                            </div>
                          </div>

                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setShowTaskPertEdit(!showTaskPertEdit)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition"
                            >
                              <span>🎯 {showTaskPertEdit ? 'Masquer l\'estimation PERT 3-Points' : 'Estimer la durée par PERT 3-Points (Optimiste / Probable / Pessimiste)'}</span>
                            </button>
                          </div>

                          {showTaskPertEdit && (
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-2 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-900">Estimation PERT probabiliste (3 Points)</span>
                                <span className="font-mono text-[11px] text-indigo-600">Te = (O + 4M + P) / 6</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-slate-600">Optimiste (O)</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={taskOptimistic}
                                    onChange={(e) => {
                                      setTaskOptimistic(e.target.value);
                                      const o = parseFloat(e.target.value);
                                      const m = parseFloat(taskMostLikely);
                                      const p = parseFloat(taskPessimistic);
                                      if (!isNaN(o) && !isNaN(m) && !isNaN(p)) {
                                        setTaskDuration(String(Math.max(1, Math.round((o + 4 * m + p) / 6))));
                                      }
                                    }}
                                    placeholder="Min j"
                                    className="bg-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-slate-600">Plus probable (M)</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={taskMostLikely}
                                    onChange={(e) => {
                                      setTaskMostLikely(e.target.value);
                                      const o = parseFloat(taskOptimistic);
                                      const m = parseFloat(e.target.value);
                                      const p = parseFloat(taskPessimistic);
                                      if (!isNaN(o) && !isNaN(m) && !isNaN(p)) {
                                        setTaskDuration(String(Math.max(1, Math.round((o + 4 * m + p) / 6))));
                                      }
                                    }}
                                    placeholder="Moy j"
                                    className="bg-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-slate-600">Pessimiste (P)</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={taskPessimistic}
                                    onChange={(e) => {
                                      setTaskPessimistic(e.target.value);
                                      const o = parseFloat(taskOptimistic);
                                      const m = parseFloat(taskMostLikely);
                                      const p = parseFloat(e.target.value);
                                      if (!isNaN(o) && !isNaN(m) && !isNaN(p)) {
                                        setTaskDuration(String(Math.max(1, Math.round((o + 4 * m + p) / 6))));
                                      }
                                    }}
                                    placeholder="Max j"
                                    className="bg-white text-xs"
                                  />
                                </div>
                              </div>
                              {taskOptimistic && taskMostLikely && taskPessimistic && (
                                <div className="mt-2 flex items-center justify-between rounded-lg bg-white p-2.5 text-xs font-mono text-indigo-800">
                                  <span>Durée calculée Te : <strong>{((parseFloat(taskOptimistic) + 4 * parseFloat(taskMostLikely) + parseFloat(taskPessimistic)) / 6).toFixed(1)} j</strong></span>
                                  <span>Écart-type σ : ±{((parseFloat(taskPessimistic) - parseFloat(taskOptimistic)) / 6).toFixed(2)} j</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* C. Liaisons Réseau PDM & Dépendances */}
                    {(() => {
                      const incomingDeps = (dependencies || []).filter((d: any) => d.successorId === currentTask.id);
                      const outgoingDeps = (dependencies || []).filter((d: any) => d.predecessorId === currentTask.id);
                      const availablePredecessors = planItems.filter(
                        (p: any) =>
                          p.id !== currentTask.id &&
                          (p.type === 'task' || p.type === 'milestone' || p.type === 'deliverable')
                      );

                      const DEP_TYPE_LABELS: Record<string, string> = {
                        FS: 'Fin à Début (FS)',
                        SS: 'Début à Début (SS)',
                        FF: 'Fin à Fin (FF)',
                        SF: 'Début à Fin (SF)',
                      };

                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b pb-3">
                            <div>
                              <h3 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                                <GitBranch className="h-4 w-4 text-violet-600" />
                                Contraintes de Précédence & Réseau PERT (PDM)
                              </h3>
                              <p className="text-xs text-slate-500">
                                Définissez les antécédents requis avant cette tâche. Les successeurs sont calculés automatiquement.
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setShowAddDepForm(!showAddDepForm); setDepPredId(''); setDepLag('0'); }}
                              className="text-xs font-semibold"
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              Ajouter un prédécesseur
                            </Button>
                          </div>

                          {showAddDepForm && (
                            <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 space-y-3">
                              <h4 className="text-xs font-bold text-violet-900">Ajouter un antécédent (Tâche requise avant)</h4>

                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="sm:col-span-1">
                                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    Tâche Antécédente (Prédécesseur) *
                                  </label>
                                  <select
                                    value={depPredId}
                                    onChange={(e) => setDepPredId(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700"
                                  >
                                    <option value="">— Sélectionner l'antécédent —</option>
                                    <option value="PROJECT_START" className="font-bold text-emerald-800 bg-emerald-50">
                                      🟢 Démarrage du Projet (T₀ : {data?.project?.startDate || 'Date initiale'})
                                    </option>
                                    {availablePredecessors.map((p: any) => (
                                      <option key={p.id} value={p.id}>
                                        {p.wbs} — {p.title} ({p.type === 'milestone' ? 'Jalon' : `${p.durationDays || 1}j`})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-semibold text-slate-700">Type de liaison</label>
                                  <select
                                    value={depType}
                                    onChange={(e) => setDepType(e.target.value as any)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700"
                                  >
                                    <option value="FS">Fin à Début (FS - Standard)</option>
                                    <option value="SS">Début à Début (SS - Parallèle)</option>
                                    <option value="FF">Fin à Fin (FF - Synchronisé)</option>
                                    <option value="SF">Début à Fin (SF - Inverse)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-semibold text-slate-700">Décalage / Lag (jours)</label>
                                  <Input
                                    type="number"
                                    value={depLag}
                                    onChange={(e) => setDepLag(e.target.value)}
                                    placeholder="0"
                                    className="bg-white text-xs font-bold"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 pt-1">
                                <Button
                                  size="sm"
                                  onClick={() => addDependencyMutation.mutate()}
                                  disabled={!depPredId || addDependencyMutation.isPending}
                                  className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold"
                                >
                                  {addDependencyMutation.isPending ? 'Enregistrement...' : 'Lier le prédécesseur'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setShowAddDepForm(false)} className="text-xs">
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* List of Incoming and Outgoing */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-800">
                                  ⏮️ Prédécesseurs (Requis avant) :
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">{incomingDeps.length} liaison{incomingDeps.length > 1 ? 's' : ''}</span>
                              </div>
                              {(() => {
                                const projStartDate = data?.project?.startDate || currentTask.startDate;
                                let lagDaysFromProj = 0;
                                if (currentTask.startDate && projStartDate) {
                                  const sProj = new Date(projStartDate + 'T00:00:00Z').getTime();
                                  const sTask = new Date(currentTask.startDate + 'T00:00:00Z').getTime();
                                  lagDaysFromProj = Math.round((sTask - sProj) / (1000 * 60 * 60 * 24));
                                }

                                if (incomingDeps.length === 0) {
                                  return (
                                    <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">T₀</span>
                                        <span className="font-medium text-emerald-950">Démarrage du Projet</span>
                                        <span className="bg-emerald-200 text-emerald-900 rounded px-1 text-[10px] font-semibold">SS</span>
                                        {lagDaysFromProj !== 0 ? (
                                          <span className="text-[10px] text-emerald-900 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                                            {lagDaysFromProj > 0 ? `+${lagDaysFromProj}j` : `${lagDaysFromProj}j`} décalage
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-emerald-700 font-mono">+0j (Immédiat)</span>
                                        )}
                                      </div>
                                      {lagDaysFromProj !== 0 && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 text-[11px] text-emerald-800 hover:bg-emerald-100 px-2 font-semibold"
                                          onClick={async () => {
                                            const baseStart = data?.project?.startDate || new Date().toISOString().split('T')[0];
                                            let dur = currentTask.durationDays || 1;
                                            if (currentTask.type === 'milestone') dur = 0;
                                            const d = new Date(baseStart + 'T00:00:00Z');
                                            d.setUTCDate(d.getUTCDate() + dur);
                                            const dEnd = d.toISOString().split('T')[0];
                                            await fetch(`/api/v1/projects/${id}/plan-items/${currentTask.id}`, {
                                              method: 'PATCH',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ startDate: baseStart, endDate: dEnd }),
                                            });
                                            await fetch(`/api/v1/projects/${id}/sync-pert-schedule`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
                                            invalidate();
                                          }}
                                          title="Réaligner sur le début exact du projet (+0j)"
                                        >
                                          Réaligner T₀
                                        </Button>
                                      )}
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-2">
                                    {incomingDeps.map((dep: any) => {
                                      const pred = planItems.find((p: any) => p.id === dep.predecessorId);
                                      return (
                                        <div key={dep.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{pred?.wbs || '—'}</span>
                                            <span className="font-medium text-slate-800 truncate max-w-[150px]">{pred?.title || 'Inconnu'}</span>
                                            <span className="bg-slate-200 text-slate-700 rounded px-1 text-[10px] font-semibold">{dep.type}</span>
                                            {dep.lagDays ? <span className="text-[10px] text-slate-500 font-mono font-bold">+{dep.lagDays}j</span> : null}
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                                            onClick={() => deleteDependencyMutation.mutate(dep.id)}
                                            title="Supprimer la contrainte"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-800">
                                  ⏭️ Successeurs (Automatique) :
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">{outgoingDeps.length} tâche{outgoingDeps.length > 1 ? 's' : ''}</span>
                              </div>
                              {outgoingDeps.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500">
                                  Aucune tâche subséquente.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {outgoingDeps.map((dep: any) => {
                                    const succ = planItems.find((p: any) => p.id === dep.successorId);
                                    return (
                                      <div key={dep.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">{succ?.wbs || '—'}</span>
                                          <span className="font-medium text-slate-800 truncate max-w-[150px]">{succ?.title || 'Inconnu'}</span>
                                          <span className="bg-slate-200 text-slate-700 rounded px-1 text-[10px] font-semibold">{dep.type}</span>
                                          {dep.lagDays ? <span className="text-[10px] text-slate-500 font-mono font-bold">+{dep.lagDays}j</span> : null}
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                                          onClick={() => deleteDependencyMutation.mutate(dep.id)}
                                          title="Supprimer la contrainte"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* ══════════════════════════════════════════════════════════════ */
                  /* MODE 2 : EXÉCUTION & OPÉRATIONS (Suivi, logs, blocages, livrables) */
                  /* ══════════════════════════════════════════════════════════════ */
                  <div className="space-y-5">
                    {/* Synthèse du cadrage planifié (Lecture seule) */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Code WBS</span>
                        <span className="font-mono font-bold text-slate-800">{selectedTask.wbs}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Période Planifiée</span>
                        <span className="font-medium text-slate-800">{selectedTask.startDate && selectedTask.endDate ? `${selectedTask.startDate} → ${selectedTask.endDate}` : 'Non planifié'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Budget Alloué (PV)</span>
                        <span className="font-bold text-indigo-700 font-mono">{fmt(selectedTask.estimatedCost || 0)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Responsable RACI</span>
                        <span className="font-medium text-slate-800">{taskAssignee ? taskAssignee.name : 'Non assigné'}</span>
                      </div>
                    </div>

                    {/* Évolution de l'avancement & Point d'étape */}
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
                            <Sparkles className="h-4 w-4 text-indigo-600" />
                            Faire évoluer l'avancement réel & Statut
                          </h3>
                          <p className="text-xs text-slate-500">
                            Ajustez l'avancement (%) pour consigner un point d'étape opérationnel et mettre à jour le statut.
                          </p>
                        </div>
                        <span className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-bold text-white shadow-sm">
                          {logProgress}%
                        </span>
                      </div>

                      {/* Slider */}
                      <div>
                        <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700">
                          <span>0% (À faire)</span>
                          <span>50% (En cours)</span>
                          <span>100% (Terminé)</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={logProgress}
                          onChange={(e) => setLogProgress(Number(e.target.value))}
                          className="h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-indigo-200 accent-indigo-600"
                        />
                      </div>

                      {/* Statut projeté automatique */}
                      <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-indigo-100 text-xs">
                        <span className="text-slate-600 font-medium">Statut résultant :</span>
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          logIsBlocked
                            ? 'text-red-700'
                            : logProgress >= 100
                              ? 'text-emerald-700'
                              : logProgress > 0
                                ? 'text-indigo-700'
                                : 'text-slate-600'
                        }`}>
                          {logIsBlocked
                            ? '🔴 Bloqué'
                            : logProgress >= 100
                              ? '✅ Terminé (100%)'
                              : logProgress > 0
                                ? '⏳ En cours'
                                : '⚪ À faire (0%)'}
                        </span>
                      </div>

                      {/* Option Signalement de blocage ou attente */}
                      <div className="rounded-lg border bg-white p-3">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={logIsBlocked}
                            onChange={(e) => setLogIsBlocked(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                          />
                          Signaler un blocage ou une attente extérieure
                        </label>
                        {logIsBlocked && (
                          <div className="mt-2">
                            <Input
                              value={logBlocker}
                              onChange={(e) => setLogBlocker(e.target.value)}
                              placeholder="Raison du blocage (ex: attente de validation, pièce manquante...)"
                              className="border-red-300 bg-red-50/50 text-xs"
                            />
                          </div>
                        )}
                      </div>

                      {/* Commentaire de compte-rendu */}
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Commentaire / Note d'évolution *
                        </label>
                        <textarea
                          value={logComment}
                          onChange={(e) => setLogComment(e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          placeholder="Ex: 50% réalisé, travaux en cours par l'équipe..."
                        />
                      </div>

                      <Button
                        size="sm"
                        onClick={() => addUpdateLogMutation.mutate()}
                        disabled={!logComment.trim() || addUpdateLogMutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Mettre à jour l'avancement
                      </Button>
                    </div>

                    {/* Livrables & Preuves d'achèvement */}
                    <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div>
                          <h3 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                            <PackageCheck className="h-5 w-5 text-emerald-600" />
                            Livrables & Preuves d'Achèvement
                          </h3>
                          <p className="text-xs text-slate-500">
                            Comptes-rendus, documents finaux et validation formelle.
                          </p>
                        </div>
                        <Button size="sm" onClick={() => setShowDeliverableModal(!showDeliverableModal)} className="text-xs">
                          <Plus className="mr-1 h-4 w-4" />
                          Déposer un livrable
                        </Button>
                      </div>

                      {showDeliverableModal && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                          <h4 className="text-xs font-bold text-emerald-900">Nouveau livrable de fin de tâche</h4>
                          <Input
                            value={delivTitle}
                            onChange={(e) => setDelivTitle(e.target.value)}
                            placeholder="Intitulé du livrable (ex: Rapport d'évaluation final)"
                            className="text-xs bg-white"
                          />
                          <textarea
                            value={delivDesc}
                            onChange={(e) => setDelivDesc(e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                            placeholder="Détails ou synthèse des résultats..."
                          />
                          <Input
                            value={delivUrl}
                            onChange={(e) => setDelivUrl(e.target.value)}
                            placeholder="URL du fichier (Drive, Cloud, etc.)"
                            className="text-xs bg-white"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => addDeliverableMutation.mutate()}
                              disabled={!delivTitle.trim() || addDeliverableMutation.isPending}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Enregistrer le livrable
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowDeliverableModal(false)} className="text-xs">
                              Annuler
                            </Button>
                          </div>
                        </div>
                      )}

                      {taskDeliverables.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Aucun livrable déposé pour cette tâche.</p>
                      ) : (
                        <div className="space-y-2">
                          {taskDeliverables.map((deliv: any) => (
                            <div key={deliv.id} className="rounded-lg border p-3 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-900 block">{deliv.title}</span>
                                {deliv.description && <p className="text-slate-500 mt-0.5">{deliv.description}</p>}
                                {deliv.fileUrl && (
                                  <a href={deliv.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline mt-1 inline-flex items-center gap-1">
                                    <Paperclip className="h-3 w-3" /> Voir le document
                                  </a>
                                )}
                              </div>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                deliv.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : deliv.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {deliv.status === 'approved' ? 'Approuvé' : deliv.status === 'rejected' ? 'Rejeté' : 'En attente'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Historique du journal de bord */}
                    <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span>Journal d'activité & Mises à jour ({taskUpdates.length})</span>
                      </h3>
                      {taskUpdates.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Aucun log enregistré pour cette tâche.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 space-y-2">
                          {taskUpdates.map((u: any) => (
                            <div key={u.id} className="pt-2 text-xs space-y-1">
                              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                                <span className="font-semibold text-slate-700">{u.authorName}</span>
                                <span>{new Date(u.createdAt).toLocaleDateString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-slate-800">{u.comment}</p>
                              {u.blockerReason && (
                                <p className="text-red-600 font-medium">🛑 Blocage : {u.blockerReason}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Sticky Footer */}
              <div className="border-t bg-slate-50 px-6 py-3.5 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTask(null)}
                  className="text-xs text-slate-600 hover:text-slate-900"
                >
                  Fermer
                </Button>
                {isPlanningMode && (
                  <Button
                    size="sm"
                    onClick={() => updateTaskParamsMutation.mutate()}
                    disabled={updateTaskParamsMutation.isPending || !taskTitle.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    {updateTaskParamsMutation.isPending ? 'Enregistrement...' : 'Enregistrer et fermer'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
