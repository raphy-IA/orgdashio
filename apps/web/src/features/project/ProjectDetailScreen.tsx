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
  Coins,
  Calculator,
  Upload,
  Download,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { PertNetworkDiagram } from './components/PertNetworkDiagram';
import { GanttChartInteractive } from './components/GanttChartInteractive';
import { EarnedValueManagementView } from './components/EarnedValueManagementView';
import { BudgetPlanningView } from './components/BudgetPlanningView';
import { TaskExecutionHub } from './components/TaskExecutionHub';
import { ProjectMonitoringHub } from './components/ProjectMonitoringHub';
import { ProjectOverviewView } from './components/ProjectOverviewView';
import { ProjectStrategicHub } from './components/strategy/ProjectStrategicHub';

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
  description?: string | null;
  objectives?: string | null;
  deliverablesExpected?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number | null;
  estimatedCost?: string | number | null;
  optimisticDays?: number | null;
  mostLikelyDays?: number | null;
  pessimisticDays?: number | null;
  progressPct?: number | null;
  status: 'todo' | 'in_progress' | 'review' | 'blocked' | 'completed' | 'cancelled';
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
  const [piDesc, setPiDesc] = useState('');
  const [piObjectives, setPiObjectives] = useState('');
  const [piDeliverablesExpected, setPiDeliverablesExpected] = useState('');
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
  const [logAttachmentUrl, setLogAttachmentUrl] = useState('');
  const [reviewRejectReason, setReviewRejectReason] = useState('');
  const [showReviewRejectInput, setShowReviewRejectInput] = useState(false);

  // Task Estimation & Parameters (inside drawer)
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskObjectives, setTaskObjectives] = useState('');
  const [taskDelivExpected, setTaskDelivExpected] = useState('');
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

  // Detailed Task Cost Estimator (inside drawer)
  const [showTaskCostCalc, setShowTaskCostCalc] = useState(false);
  const [costLaborRate, setCostLaborRate] = useState('0');
  const [costLaborDays, setCostLaborDays] = useState('1');
  const [costLaborChargesPct, setCostLaborChargesPct] = useState('0');
  const [costMaterial, setCostMaterial] = useState('0');
  const [costSubcontracting, setCostSubcontracting] = useState('0');
  const [costOther, setCostOther] = useState('0');

  useEffect(() => {
    if (selectedTask) {
      setTaskTitle(selectedTask.title || '');
      setTaskDesc(selectedTask.description || '');
      setTaskObjectives(selectedTask.objectives || '');
      setTaskDelivExpected(selectedTask.deliverablesExpected || '');
      setTaskWbs(selectedTask.wbs || '');
      setTaskType(selectedTask.type || 'task');
      setTaskStart(selectedTask.startDate || '');
      setTaskEnd(selectedTask.endDate || '');
      setLogProgress(selectedTask.progressPct || 0);
      setLogIsBlocked(selectedTask.status === 'blocked');
      setLogBlocker('');
      setLogAttachmentUrl('');
      setReviewRejectReason('');
      setShowReviewRejectInput(false);
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
  const [delivFileName, setDelivFileName] = useState('');
  const [delivAttachMode, setDelivAttachMode] = useState<'file' | 'link'>('file');

  // Evolution log attachment state
  const [logAttachMode, setLogAttachMode] = useState<'link' | 'file'>('file');
  const [logFileName, setLogFileName] = useState('');

  // Helper for uploading local file up to 1MB as Base64 Data URL
  const handleFileUpload = (
    file: File,
    setUrl: (url: string) => void,
    setName: (name: string) => void,
    maxSizeMb = 1
  ) => {
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`⚠️ Le fichier "${file.name}" dépasse la taille maximale autorisée de ${maxSizeMb} Mo (${(file.size / (1024 * 1024)).toFixed(2)} Mo). Veuillez sélectionner un fichier plus léger ou fournir un lien cloud.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUrl(result);
      setName(file.name);
    };
    reader.onerror = () => {
      alert('Erreur lors de la lecture du fichier.');
    };
    reader.readAsDataURL(file);
  };

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
    mutationFn: async (nodePayload?: { level?: string; title?: string; description?: string | null; parentId?: string | null }) => {
      const payload = nodePayload || {
        level: rnLevel,
        title: rnTitle,
        description: rnDesc || undefined,
        parentId: rnParentId || undefined,
      };
      const res = await fetch(`/api/v1/projects/${id}/result-nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          description: piDesc.trim() || undefined,
          objectives: piObjectives.trim() || undefined,
          deliverablesExpected: piDeliverablesExpected.trim() || undefined,
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
      setPiTitle(''); setPiDesc(''); setPiObjectives(''); setPiDeliverablesExpected(''); setPiWbs(''); setPiStart(''); setPiEnd(''); setPiParentId(''); setPiDuration('5');
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
          description: taskDesc.trim() || undefined,
          objectives: taskObjectives.trim() || undefined,
          deliverablesExpected: taskDelivExpected.trim() || undefined,
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
    mutationFn: async (params?: { categoryCode?: string; description?: string; amount?: number }) => {
      const cat = params?.categoryCode || blCategory;
      const desc = params?.description || blDescription;
      const amt = params?.amount !== undefined ? params.amount : parseFloat(blAmount);
      const res = await fetch(`/api/v1/projects/${id}/budget-lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryCode: cat, description: desc, amount: amt }),
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

  const updatePlanItemCostMutation = useMutation({
    mutationFn: async ({ taskId, newCost }: { taskId: string; newCost: number }) => {
      const res = await fetch(`/api/v1/projects/${id}/plan-items/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimatedCost: newCost }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de la modification du coût');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
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

  const updateProjectMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await fetch(`/api/v1/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour du projet');
      return res.json();
    },
    onSuccess: () => invalidate(),
  });

  const addFunding = useMutation({
    mutationFn: async (fundingPayload?: any) => {
      const payload = fundingPayload || {
        donorName: fsName,
        fundingType: fsType,
        amount: parseFloat(fsAmount),
        currency: 'CAD',
        reportDueAt: fsDue || undefined,
      };
      const res = await fetch(`/api/v1/projects/${id}/funding-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    mutationFn: async (memberPayload?: any) => {
      const payload = memberPayload || {
        partyId: tmPartyId || undefined,
        name: tmName,
        email: tmEmail || undefined,
        role: tmRole,
        raciRole: tmRaciRole,
        allocationPct: parseInt(tmAllocation) || 100,
      };
      const res = await fetch(`/api/v1/projects/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          ? 'review'
          : logProgress > 0
            ? 'in_progress'
            : 'todo';

      const res = await fetch(`/api/v1/projects/${id}/plan-items/${selectedTask.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: taskAssignee?.name || 'Responsable de la tâche (RACI R)',
          progressPct: logProgress,
          status: computedStatus,
          comment: logComment,
          blockerReason: logIsBlocked ? logBlocker : undefined,
          attachmentUrl: logAttachmentUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur publication mise à jour');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setLogComment('');
      setLogBlocker('');
      setLogAttachmentUrl('');
      setLogIsBlocked(false);
      setSelectedTask(null);
    },
    onError: (err: any) => alert(err.message),
  });

  const approveReviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTask) return;
      const res = await fetch(`/api/v1/projects/${id}/plan-items/${selectedTask.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: 'Approbateur RACI (A) / Manager',
          progressPct: 100,
          status: 'completed',
          comment: 'Validation et visa de conformité accordés (RACI A). Tâche clôturée avec succès.',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de la validation du visa');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setSelectedTask(null);
    },
    onError: (err: any) => alert(err.message),
  });

  const rejectReviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTask || !reviewRejectReason.trim()) return;
      const res = await fetch(`/api/v1/projects/${id}/plan-items/${selectedTask.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: 'Approbateur RACI (A) / Manager',
          progressPct: 80,
          status: 'in_progress',
          comment: `Demande de corrections / Révision requise : ${reviewRejectReason.trim()}`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors du renvoi pour révision');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setShowReviewRejectInput(false);
      setReviewRejectReason('');
      setSelectedTask(null);
    },
    onError: (err: any) => alert(err.message),
  });

  const updateTaskQuickStatusMutation = useMutation({
    mutationFn: async ({ taskId, status, progressPct }: { taskId: string; status: string; progressPct?: number }) => {
      const res = await fetch(`/api/v1/projects/${id}/plan-items/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, progressPct }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors du changement de statut');
      }
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => alert(err.message),
  });

  const addExpenseGenericMutation = useMutation({
    mutationFn: async (expenseData: { budgetLineId: string; amount: number; vendor: string; date: string; notes?: string }) => {
      const res = await fetch(`/api/v1/projects/${id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetLineId: expenseData.budgetLineId,
          amount: expenseData.amount,
          vendor: expenseData.vendor,
          date: expenseData.date,
          notes: expenseData.notes,
          taxTps: 0,
          taxTvq: 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de l\'enregistrement de la dépense');
      }
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => alert(err.message),
  });

  const addDeliverableGenericMutation = useMutation({
    mutationFn: async ({ planItemId, title, description, fileUrl }: { planItemId: string; title: string; description?: string; fileUrl?: string }) => {
      const res = await fetch(`/api/v1/projects/${id}/plan-items/${planItemId}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, fileUrl }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de l\'ajout du livrable');
      }
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => alert(err.message),
  });

  const verifyDeliverableGenericMutation = useMutation({
    mutationFn: async ({ planItemId, deliverableId, status, verifiedBy }: { planItemId: string; deliverableId: string; status: 'approved' | 'rejected'; verifiedBy?: string }) => {
      const res = await fetch(`/api/v1/projects/${id}/plan-items/${planItemId}/deliverables/${deliverableId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          verifiedBy: verifiedBy || 'Gestionnaire de Projet',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de la validation du livrable');
      }
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => alert(err.message),
  });

  const addDeliverableMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTask) return;
      if (!delivTitle.trim()) {
        throw new Error('Le titre du livrable est requis');
      }
      const res = await fetch(`/api/v1/projects/${id}/plan-items/${selectedTask.id}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: delivTitle.trim(),
          description: delivDesc.trim() || undefined,
          fileUrl: delivUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de l\'enregistrement du livrable');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setDelivTitle('');
      setDelivDesc('');
      setDelivUrl('');
      setDelivFileName('');
      setShowDeliverableModal(false);
    },
    onError: (err: any) => alert(err.message),
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
          <ProjectOverviewView
            project={proj}
            planItems={planItems}
            expenses={expenses}
            members={members}
            deliverables={deliverables}
            updates={updates}
            raidItems={raidItems}
            fundingSources={fundingSources}
            resultNodes={resultNodes}
            dependencies={dependencies}
            budget={projBudget}
            onNavigateTab={(tab, subTab) => {
              setActiveTab(tab);
              if (subTab) {
                if (tab === 'strategy') setStrategySubTab(subTab as any);
                if (tab === 'planning') setPlanningSubTab(subTab as any);
                if (tab === 'monitoring') setMonitoringSubTab(subTab as any);
              }
            }}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PILIER 1: CADRAGE & STRATÉGIE                                   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'strategy' && (
          <ProjectStrategicHub
            project={proj}
            fundingSources={fundingSources}
            members={members}
            planItems={planItems}
            resultNodes={resultNodes}
            raci={raci}
            orgPeople={orgPeople}
            initialSubTab={strategySubTab}
            onUpdateProject={async (updates) => {
              await updateProjectMutation.mutateAsync(updates);
            }}
            onAddResultNode={async (node) => {
              await addResultNode.mutateAsync(node);
            }}
            onDeleteResultNode={async (nodeId) => {
              await deleteResultNode.mutateAsync(nodeId);
            }}
            onAddFundingSource={async (source) => {
              await addFunding.mutateAsync(source);
            }}
            onDeleteFundingSource={async (sourceId) => {
              await deleteFundingSource.mutateAsync(sourceId);
            }}
            onAddMember={async (member) => {
              await addMemberMutation.mutateAsync(member);
            }}
            onRemoveMember={async (memberId) => {
              await removeMemberMutation.mutateAsync(memberId);
            }}
            onSetRaciRole={async (planItemId, projectMemberId, raciRole) => {
              await setRaciMutation.mutateAsync({ planItemId, projectMemberId, raciRole });
            }}
            onSelectTask={(task) => setSelectedTask(task)}
            onNavigateTab={(tab, subTab) => {
              setActiveTab(tab as TabKey);
              if (subTab && tab === 'planning') {
                setPlanningSubTab(subTab as any);
              } else if (subTab && tab === 'monitoring') {
                setMonitoringSubTab(subTab as any);
              }
            }}
          />
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

                        {/* Qualitative Framing */}
                        <div className="sm:col-span-3 space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            📝 Cadrage Qualitatif & Cahier des Charges
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                                Description & Contexte
                              </label>
                              <textarea
                                value={piDesc}
                                onChange={(e) => setPiDesc(e.target.value)}
                                rows={2}
                                placeholder="Périmètre, contexte et consignes d'exécution..."
                                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                                Objectifs & Critères (DoD)
                              </label>
                              <textarea
                                value={piObjectives}
                                onChange={(e) => setPiObjectives(e.target.value)}
                                rows={2}
                                placeholder="Objectifs opérationnels, critères de réussite..."
                                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                                Livrables Attendus
                              </label>
                              <textarea
                                value={piDeliverablesExpected}
                                onChange={(e) => setPiDeliverablesExpected(e.target.value)}
                                rows={2}
                                placeholder="Rapports, PV, code, maquette à livrer..."
                                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                              />
                            </div>
                          </div>
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

                            const projStartDate = data?.project?.startDate || item.startDate;
                            let lagDaysFromProj = 0;
                            if (item.startDate && projStartDate) {
                              const sProj = new Date(projStartDate + 'T00:00:00Z').getTime();
                              const sTask = new Date(item.startDate + 'T00:00:00Z').getTime();
                              lagDaysFromProj = Math.round((sTask - sProj) / (1000 * 60 * 60 * 24));
                            }

                            return (
                              <tr
                                key={item.id}
                                onClick={() => setSelectedTask(item)}
                                className="group hover:bg-indigo-50/40 cursor-pointer transition-colors"
                                title="Cliquer pour ouvrir et modifier cet élément"
                              >
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
                                      {item.durationDays || 0} j
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  {itemPreds.length === 0 ? (
                                    isContainer ? (
                                      <span className="text-slate-300">—</span>
                                    ) : (
                                      <span
                                        className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold"
                                        title={`Démarrage au début du projet (T0 : ${projStartDate || ''})`}
                                      >
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                        T0{lagDaysFromProj > 0 ? `+${lagDaysFromProj}j` : lagDaysFromProj < 0 ? `${lagDaysFromProj}j` : ''}
                                      </span>
                                    )
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {itemPreds.map((pred: any) => {
                                        const isProjStart = pred.predecessorId === 'PROJECT_START';
                                        const predTask = planItems.find((p: any) => p.id === pred.predecessorId);
                                        const label = isProjStart ? 'T0' : (predTask?.wbs || '?');
                                        return (
                                          <span
                                            key={pred.id}
                                            className={`inline-flex items-center gap-1 ${isProjStart ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-violet-50 text-violet-800 border-violet-200'} border rounded px-1.5 py-0.5 font-mono text-[11px] font-bold`}
                                            title={isProjStart ? 'Démarrage du projet (T0)' : `Prédécesseur : ${predTask?.title || 'Tâche'}`}
                                          >
                                            <Link2 className={`h-2.5 w-2.5 ${isProjStart ? 'text-emerald-600' : 'text-violet-600'}`} />
                                            {label}:{pred.type}{pred.lagDays ? `+${pred.lagDays}j` : ''}
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
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
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
              <BudgetPlanningView
                projectId={id!}
                projectStartDate={data?.project?.startDate}
                planItems={planItems}
                projBudget={projBudget}
                expenses={expenses}
                members={members}
                onSelectTask={(task) => setSelectedTask(task)}
                onUpdateTaskCost={async (taskId, newCost) => {
                  await updatePlanItemCostMutation.mutateAsync({ taskId, newCost });
                }}
                onAddBudgetLine={async (categoryCode, description, amount) => {
                  await addBudgetLine.mutateAsync({ categoryCode, description, amount });
                }}
                onUpdateBudgetLine={async (lineId, categoryCode, description, amount) => {
                  await updateBudgetLine.mutateAsync({ lineId, categoryCode, description, amount });
                }}
                onDeleteBudgetLine={async (lineId) => {
                  await deleteBudgetLine.mutateAsync(lineId);
                }}
                isUpdating={updatePlanItemCostMutation.isPending || addBudgetLine.isPending}
              />
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PILIER 3: EXÉCUTION & OPÉRATIONS                                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'execution' && (
          <TaskExecutionHub
            projectId={id!}
            planItems={planItems}
            members={members}
            raci={raci}
            budget={projBudget}
            expenses={expenses}
            deliverables={deliverables}
            updates={updates}
            onSelectTask={(task) => {
              setSelectedTask(task);
              setLogProgress(task.progressPct || 0);
              setLogIsBlocked(task.status === 'blocked');
            }}
            onUpdateTaskStatus={async (taskId, newStatus, newProgress) => {
              await updateTaskQuickStatusMutation.mutateAsync({ taskId, status: newStatus, progressPct: newProgress });
            }}
            onAddExpense={async (expenseData) => {
              await addExpenseGenericMutation.mutateAsync(expenseData);
            }}
            onApproveExpense={async (expenseId) => {
              await approveExpense.mutateAsync(expenseId);
            }}
            onAddDeliverable={async (planItemId, deliverableData) => {
              await addDeliverableGenericMutation.mutateAsync({ planItemId, ...deliverableData });
            }}
            onVerifyDeliverable={async (planItemId, deliverableId, status, verifiedBy) => {
              await verifyDeliverableGenericMutation.mutateAsync({ planItemId, deliverableId, status, verifiedBy });
            }}
            isUpdating={
              updateTaskQuickStatusMutation.isPending ||
              addExpenseGenericMutation.isPending ||
              approveExpense.isPending ||
              addDeliverableGenericMutation.isPending ||
              verifyDeliverableGenericMutation.isPending
            }
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PILIER 4: SUIVI & CONTRÔLE DE PERFORMANCE                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'monitoring' && (
          <ProjectMonitoringHub
            project={proj}
            planItems={planItems}
            expenses={expenses}
            members={members}
            deliverables={deliverables}
            updates={updates}
            raidItems={raidItems}
            fundingSources={fundingSources}
            onSelectTask={(task) => setSelectedTask(task)}
            onApproveDeliverable={async (delivId) => {
              const target = deliverables.find((d: any) => d.id === delivId);
              if (!target) return;
              await fetch(`/api/v1/projects/${id}/plan-items/${target.planItemId}/deliverables/${delivId}/verify`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: 'approved',
                  verifiedBy: 'Gestionnaire de Projet',
                }),
              });
              invalidate();
            }}
            onRejectDeliverable={async (delivId, reason) => {
              const target = deliverables.find((d: any) => d.id === delivId);
              if (!target) return;
              await fetch(`/api/v1/projects/${id}/plan-items/${target.planItemId}/deliverables/${delivId}/verify`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: 'rejected',
                  verifiedBy: 'Gestionnaire de Projet',
                  reviewComment: reason,
                }),
              });
              invalidate();
            }}
            onAddRaidItem={async (item) => {
              await addRaidItem.mutateAsync();
            }}
            onDeleteRaidItem={async (itemId) => {
              await deleteRaidItem.mutateAsync(itemId);
            }}
          />
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

                        <div className="sm:col-span-3">
                          <label className="mb-1 block text-xs font-semibold text-slate-700">Description & Périmètre d'action</label>
                          <textarea
                            value={taskDesc}
                            onChange={(e) => setTaskDesc(e.target.value)}
                            rows={2}
                            placeholder="Description détaillée, consignes techniques ou contexte d'exécution..."
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Objectifs opérationnels / Critères d'acceptation (DoD)</label>
                            <textarea
                              value={taskObjectives}
                              onChange={(e) => setTaskObjectives(e.target.value)}
                              rows={2}
                              placeholder="Critères de conformité et résultats précis attendus..."
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Livrables attendus (Justificatifs / Documents)</label>
                            <textarea
                              value={taskDelivExpected}
                              onChange={(e) => setTaskDelivExpected(e.target.value)}
                              rows={2}
                              placeholder="Fichiers, rapports, PV de recette ou maquettes à produire..."
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
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

                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setShowTaskCostCalc(!showTaskCostCalc);
                                if (!showTaskCostCalc && (!costLaborDays || costLaborDays === '0')) {
                                  setCostLaborDays(taskDuration || '1');
                                }
                              }}
                              className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1.5 transition"
                            >
                              <span>🧮 {showTaskCostCalc ? 'Masquer le calculateur de coût' : 'Calculer le coût unitaire détaillé (RH, Matériel, Prestations)'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowTaskPertEdit(!showTaskPertEdit)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition"
                            >
                              <span>🎯 {showTaskPertEdit ? 'Masquer l\'estimation PERT 3-Points' : 'Estimer la durée PERT 3-Points'}</span>
                            </button>
                          </div>

                          {showTaskCostCalc && (
                            <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 space-y-3 mt-2">
                              <div className="flex items-center justify-between border-b border-violet-200/80 pb-2">
                                <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                                  <Coins className="h-3.5 w-3.5 text-violet-600" />
                                  Calculateur Prévisionnel de Coût de Tâche (Bottom-Up)
                                </span>
                                <span className="text-[11px] font-mono font-bold text-violet-800 bg-violet-100 px-2 py-0.5 rounded">
                                  Total estimé : {fmt(
                                    (parseFloat(costLaborRate) || 0) * (parseFloat(costLaborDays) || 0) * (1 + (parseFloat(costLaborChargesPct) || 0) / 100) +
                                    (parseFloat(costMaterial) || 0) +
                                    (parseFloat(costSubcontracting) || 0) +
                                    (parseFloat(costOther) || 0)
                                  )}
                                </span>
                              </div>

                              {/* Section 1 : Main d'oeuvre / RH */}
                              <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">1. Main d'œuvre / Ressources Humaines</span>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="mb-1 block text-[10px] font-semibold text-slate-600">Jours-Homme</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={costLaborDays}
                                      onChange={(e) => setCostLaborDays(e.target.value)}
                                      placeholder="Jours"
                                      className="bg-white text-xs font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-semibold text-slate-600">Taux journalier ($/j)</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="10"
                                      value={costLaborRate}
                                      onChange={(e) => setCostLaborRate(e.target.value)}
                                      placeholder="Ex: 350"
                                      className="bg-white text-xs font-mono font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-semibold text-slate-600">Charges / Frais (%)</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={costLaborChargesPct}
                                      onChange={(e) => setCostLaborChargesPct(e.target.value)}
                                      placeholder="0%"
                                      className="bg-white text-xs font-mono"
                                    />
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono text-right">
                                  Sous-total RH : {fmt((parseFloat(costLaborRate) || 0) * (parseFloat(costLaborDays) || 0) * (1 + (parseFloat(costLaborChargesPct) || 0) / 100))}
                                </div>
                              </div>

                              {/* Section 2 : Achats, Matériel & Sous-traitance */}
                              <div className="space-y-1.5 pt-1 border-t border-violet-200/60">
                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">2. Matériel, Prestations & Imprévus</span>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="mb-1 block text-[10px] font-semibold text-slate-600">Matériel & Fournitures ($)</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={costMaterial}
                                      onChange={(e) => setCostMaterial(e.target.value)}
                                      placeholder="0.00"
                                      className="bg-white text-xs font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-semibold text-slate-600">Sous-traitance & Services ($)</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={costSubcontracting}
                                      onChange={(e) => setCostSubcontracting(e.target.value)}
                                      placeholder="0.00"
                                      className="bg-white text-xs font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-semibold text-slate-600">Autres frais / Contingence ($)</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={costOther}
                                      onChange={(e) => setCostOther(e.target.value)}
                                      placeholder="0.00"
                                      className="bg-white text-xs font-mono"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 italic">
                                  Cliquez pour affecter ce montant au Coût Planifié (PV)
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    const total =
                                      (parseFloat(costLaborRate) || 0) * (parseFloat(costLaborDays) || 0) * (1 + (parseFloat(costLaborChargesPct) || 0) / 100) +
                                      (parseFloat(costMaterial) || 0) +
                                      (parseFloat(costSubcontracting) || 0) +
                                      (parseFloat(costOther) || 0);
                                    setTaskCost(String(Math.round(total * 100) / 100));
                                    setShowTaskCostCalc(false);
                                  }}
                                  className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold"
                                >
                                  <Check className="mr-1 h-3.5 w-3.5" />
                                  Appliquer au coût PV ({fmt(
                                    (parseFloat(costLaborRate) || 0) * (parseFloat(costLaborDays) || 0) * (1 + (parseFloat(costLaborChargesPct) || 0) / 100) +
                                    (parseFloat(costMaterial) || 0) +
                                    (parseFloat(costSubcontracting) || 0) +
                                    (parseFloat(costOther) || 0)
                                  )})
                                </Button>
                              </div>
                            </div>
                          )}

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
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center justify-between rounded-lg bg-white p-2 text-xs font-mono text-indigo-800 border border-indigo-100">
                                    <span>Durée calculée Te : <strong>{((parseFloat(taskOptimistic) + 4 * parseFloat(taskMostLikely) + parseFloat(taskPessimistic)) / 6).toFixed(1)} j</strong></span>
                                    <span>Écart-type σ : ±{((parseFloat(taskPessimistic) - parseFloat(taskOptimistic)) / 6).toFixed(2)} j</span>
                                  </div>
                                  <div className="flex justify-end">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => {
                                        const o = parseFloat(taskOptimistic);
                                        const m = parseFloat(taskMostLikely);
                                        const p = parseFloat(taskPessimistic);
                                        if (!isNaN(o) && !isNaN(m) && !isNaN(p)) {
                                          setTaskDuration(String(Math.max(1, Math.round((o + 4 * m + p) / 6))));
                                        }
                                        setShowTaskPertEdit(false);
                                      }}
                                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                    >
                                      <Check className="mr-1 h-3.5 w-3.5" />
                                      Appliquer la durée ({Math.max(1, Math.round((parseFloat(taskOptimistic) + 4 * parseFloat(taskMostLikely) + parseFloat(taskPessimistic)) / 6))} j)
                                    </Button>
                                  </div>
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

                    {/* Cahier des Charges & Cadrage WBS (Référence d'Exécution) */}
                    {(currentTask.description || currentTask.objectives || currentTask.deliverablesExpected) && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3 text-xs">
                        <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                          📋 Cahier des Charges & Cadrage Opérationnel
                        </span>
                        {currentTask.description && (
                          <div>
                            <span className="font-semibold text-blue-900 block text-[11px]">Description & Périmètre :</span>
                            <p className="text-slate-700 mt-0.5 leading-relaxed">{currentTask.description}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-blue-100">
                          {currentTask.objectives && (
                            <div>
                              <span className="font-semibold text-blue-900 block text-[11px]">🎯 Objectifs & DoD :</span>
                              <p className="text-slate-700 mt-0.5 leading-relaxed">{currentTask.objectives}</p>
                            </div>
                          )}
                          {currentTask.deliverablesExpected && (
                            <div>
                              <span className="font-semibold text-blue-900 block text-[11px]">📦 Livrables attendus :</span>
                              <p className="text-slate-700 mt-0.5 leading-relaxed">{currentTask.deliverablesExpected}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Visa de Conformité RACI (A) si la tâche est en 'review' */}
                    {currentTask.status === 'review' && (
                      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 shadow-sm space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                              🛡️ Revue RACI Requise (100% déclaré)
                            </span>
                            <h4 className="mt-1.5 text-sm font-bold text-amber-950">
                              Visa de Conformité & Clôture Définitive
                            </h4>
                            <p className="mt-0.5 text-xs text-amber-800">
                              L'exécutant a déclaré l'achèvement à 100%. En tant qu'Approbateur RACI (A) ou Manager, vérifiez les livrables avant de délivrer le visa de conformité ou demandez des ajustements.
                            </p>
                          </div>
                        </div>

                        {!showReviewRejectInput ? (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Button
                              size="sm"
                              onClick={() => approveReviewMutation.mutate()}
                              disabled={approveReviewMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                            >
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              {approveReviewMutation.isPending ? 'Validation...' : 'Approuver et Clôturer (Visa A)'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowReviewRejectInput(true)}
                              className="border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs"
                            >
                              Demander des corrections
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-2 border-t border-amber-200">
                            <label className="block text-xs font-bold text-amber-900">Motif des corrections demandées *</label>
                            <textarea
                              value={reviewRejectReason}
                              onChange={(e) => setReviewRejectReason(e.target.value)}
                              rows={2}
                              placeholder="Précisez ce qui doit être corrigé ou complété avant nouvelle revue..."
                              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-800"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => rejectReviewMutation.mutate()}
                                disabled={!reviewRejectReason.trim() || rejectReviewMutation.isPending}
                                className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs"
                              >
                                {rejectReviewMutation.isPending ? 'Envoi...' : 'Renvoyer pour correction'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowReviewRejectInput(false)}
                                className="text-xs text-slate-600"
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Évolution de l'avancement & Point d'étape */}
                    {(() => {
                      const initialProgress = currentTask.progressPct || 0;
                      const initialBlocked = currentTask.status === 'blocked';
                      const hasPendingEvolution = logProgress !== initialProgress || logIsBlocked !== initialBlocked;

                      return (
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
                                <Sparkles className="h-4 w-4 text-indigo-600" />
                                Faire évoluer l'avancement réel & Statut
                              </h3>
                              <p className="text-xs text-slate-500">
                                Ajustez l'avancement (%) ou signalez un blocage pour consigner un point d'étape.
                              </p>
                            </div>
                            <span className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-bold text-white shadow-sm font-mono">
                              {logProgress}%
                            </span>
                          </div>

                          {/* Quick Preset Buttons */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[0, 25, 50, 75, 100].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => {
                                  setLogProgress(pct);
                                  if (pct === 100) setLogIsBlocked(false);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                                  logProgress === pct
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {pct === 0 ? '0% (À faire)' : pct === 100 ? '100% (Demander revue)' : `${pct}%`}
                              </button>
                            ))}
                          </div>

                          {/* Slider */}
                          <div>
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
                                  ? 'text-amber-700'
                                  : logProgress > 0
                                    ? 'text-indigo-700'
                                    : 'text-slate-600'
                            }`}>
                              {logIsBlocked
                                ? '🔴 Bloqué'
                                : logProgress >= 100
                                  ? '🛡️ En révision (Visa RACI A requis)'
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
                          </div>

                          {/* Zone conditionnelle : uniquement en cas d'évolution d'avancement ou blocage */}
                          {!hasPendingEvolution ? (
                            <div className="rounded-lg border border-dashed border-indigo-200 bg-white/70 p-3.5 text-center text-xs text-slate-500">
                              💡 <strong>Aucun changement en attente :</strong> Modifiez le curseur ci-dessus ou cochez un blocage pour consigner un point d'étape opérationnel.
                            </div>
                          ) : (
                            <div className="rounded-xl border-2 border-indigo-300 bg-white p-4 shadow-xs space-y-3 animate-in fade-in-50 duration-200">
                              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                  📝 Renseignement obligatoire du point d'étape
                                </span>
                                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                  {initialProgress}% → <strong>{logProgress}%</strong> {logIsBlocked ? '(Bloqué)' : ''}
                                </span>
                              </div>

                              {/* Raison du blocage (si coché) */}
                              {logIsBlocked && (
                                <div>
                                  <label className="mb-1 block text-xs font-bold text-red-700">
                                    Motif du blocage *
                                  </label>
                                  <Input
                                    value={logBlocker}
                                    onChange={(e) => setLogBlocker(e.target.value)}
                                    placeholder="Précisez la cause exacte du blocage (pièce manquante, attente de validation...)"
                                    className="border-red-300 bg-red-50/50 text-xs text-red-900 font-medium"
                                  />
                                </div>
                              )}

                              {/* Justificatif / Pièce jointe optionnelle (Lien URL ou Fichier direct max 1Mo) */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-semibold text-slate-700">
                                    {logProgress >= 100
                                      ? "Justificatif / Livrable de fin de tâche"
                                      : "Justificatif d'étape (optionnel)"}
                                  </label>
                                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md text-[10px] font-bold">
                                    <button
                                      type="button"
                                      onClick={() => setLogAttachMode('file')}
                                      className={`px-1.5 py-0.5 rounded ${logAttachMode === 'file' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                      📎 Fichier (1 Mo max)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setLogAttachMode('link')}
                                      className={`px-1.5 py-0.5 rounded ${logAttachMode === 'link' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                      🔗 Lien Cloud
                                    </button>
                                  </div>
                                </div>

                                {logAttachMode === 'file' ? (
                                  <div>
                                    {logFileName ? (
                                      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                                        <div className="flex items-center gap-1.5 truncate">
                                          <Paperclip className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                          <span className="font-semibold text-slate-800 truncate">{logFileName}</span>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => { setLogAttachmentUrl(''); setLogFileName(''); }}
                                          className="h-5 text-[10px] text-red-600 hover:bg-red-50 px-1.5 font-semibold"
                                        >
                                          Retirer
                                        </Button>
                                      </div>
                                    ) : (
                                      <label className="flex items-center justify-center border border-dashed border-slate-300 hover:border-indigo-400 bg-white rounded-lg p-2.5 cursor-pointer transition gap-2 text-xs text-slate-600">
                                        <Upload className="h-4 w-4 text-indigo-600" />
                                        <span>Joindre un fichier (Max 1 Mo - PDF, images, docs...)</span>
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.csv,.txt"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file, setLogAttachmentUrl, setLogFileName, 1);
                                          }}
                                        />
                                      </label>
                                    )}
                                  </div>
                                ) : (
                                  <Input
                                    value={logAttachmentUrl}
                                    onChange={(e) => setLogAttachmentUrl(e.target.value)}
                                    placeholder="https://drive.google.com/... ou https://sharepoint.com/..."
                                    className="bg-white text-xs"
                                  />
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
                                  placeholder="Détaillez l'état d'avancement des travaux, réalisations ou difficultés..."
                                />
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <Button
                                  size="sm"
                                  onClick={() => addUpdateLogMutation.mutate()}
                                  disabled={
                                    !logComment.trim() ||
                                    (logIsBlocked && !logBlocker.trim()) ||
                                    addUpdateLogMutation.isPending
                                  }
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                                >
                                  <Send className="mr-1.5 h-3.5 w-3.5" />
                                  {addUpdateLogMutation.isPending ? 'Enregistrement...' : 'Consigner le point d\'étape'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setLogProgress(initialProgress);
                                    setLogIsBlocked(initialBlocked);
                                    setLogBlocker('');
                                    setLogComment('');
                                    setLogAttachmentUrl('');
                                    setLogFileName('');
                                  }}
                                  className="text-xs text-slate-500 hover:text-slate-800"
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Livrables & Preuves d'achèvement : Affiché uniquement si la tâche est à 100%, en révision/terminée, ou a déjà des livrables */}
                    {(currentTask.progressPct >= 100 || currentTask.status === 'review' || currentTask.status === 'completed' || taskDeliverables.length > 0) && (
                      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                          <div>
                            <h3 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                              <PackageCheck className="h-5 w-5 text-emerald-600" />
                              Livrables & Preuves d'Achèvement
                            </h3>
                            <p className="text-xs text-slate-500">
                              Comptes-rendus, documents finaux et validation formelle de fin de tâche.
                            </p>
                          </div>
                          <Button size="sm" onClick={() => setShowDeliverableModal(!showDeliverableModal)} className="text-xs">
                            <Plus className="mr-1 h-4 w-4" />
                            Déposer un livrable
                          </Button>
                        </div>

                        {showDeliverableModal && (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3.5 animate-in fade-in-50 duration-150">
                            <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                              <PackageCheck className="h-4 w-4 text-emerald-600" />
                              Nouveau livrable de fin de tâche
                            </h4>
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-emerald-950">Intitulé du livrable *</label>
                              <Input
                                value={delivTitle}
                                onChange={(e) => setDelivTitle(e.target.value)}
                                placeholder="Intitulé du livrable (ex: Rapport d'évaluation final, PV de recette...)"
                                className="text-xs bg-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-emerald-950">Détails ou synthèse des résultats</label>
                              <textarea
                                value={delivDesc}
                                onChange={(e) => setDelivDesc(e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                                placeholder="Détails ou synthèse des résultats..."
                              />
                            </div>

                            {/* Pièce jointe / Livrable (Fichier 1Mo ou Lien) */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-emerald-950">Fichier / Justificatif joint</label>
                                <div className="flex items-center gap-1 p-0.5 bg-emerald-100 rounded-md text-[10px] font-bold">
                                  <button
                                    type="button"
                                    onClick={() => setDelivAttachMode('file')}
                                    className={`px-1.5 py-0.5 rounded ${delivAttachMode === 'file' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-emerald-700 hover:text-emerald-900'}`}
                                  >
                                    📎 Fichier direct (1 Mo max)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDelivAttachMode('link')}
                                    className={`px-1.5 py-0.5 rounded ${delivAttachMode === 'link' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-emerald-700 hover:text-emerald-900'}`}
                                  >
                                    🔗 Lien Cloud / Drive
                                  </button>
                                </div>
                              </div>

                              {delivAttachMode === 'file' ? (
                                <div>
                                  {delivFileName ? (
                                    <div className="flex items-center justify-between bg-white border border-emerald-300 rounded-lg p-2 text-xs">
                                      <div className="flex items-center gap-1.5 truncate">
                                        <Paperclip className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                        <span className="font-semibold text-emerald-950 truncate">{delivFileName}</span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setDelivUrl(''); setDelivFileName(''); }}
                                        className="h-5 text-[10px] text-red-600 hover:bg-red-50 px-1.5 font-semibold"
                                      >
                                        Retirer
                                      </Button>
                                    </div>
                                  ) : (
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white rounded-lg p-3.5 cursor-pointer transition gap-1 text-xs text-emerald-900">
                                      <Upload className="h-5 w-5 text-emerald-600" />
                                      <span className="font-bold">Cliquez pour joindre un fichier</span>
                                      <span className="text-[10px] text-slate-500">PDF, Word, Excel, Images, Zip (Taille max : 1 Mo)</span>
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.csv,.txt"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleFileUpload(file, setDelivUrl, setDelivFileName, 1);
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>
                              ) : (
                                <Input
                                  value={delivUrl}
                                  onChange={(e) => setDelivUrl(e.target.value)}
                                  placeholder="URL du fichier (https://drive.google.com/...)"
                                  className="text-xs bg-white"
                                />
                              )}
                            </div>

                            <div className="flex gap-2 pt-1 border-t border-emerald-200">
                              <Button
                                size="sm"
                                onClick={() => addDeliverableMutation.mutate()}
                                disabled={!delivTitle.trim() || addDeliverableMutation.isPending}
                                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              >
                                {addDeliverableMutation.isPending ? 'Enregistrement...' : 'Enregistrer le livrable'}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setShowDeliverableModal(false)} className="text-xs text-slate-600">
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
                                    <div className="mt-1.5">
                                      {deliv.fileUrl.startsWith('data:') ? (
                                        <a
                                          href={deliv.fileUrl}
                                          download={deliv.title ? `${deliv.title.replace(/[^a-zA-Z0-9_-]/g, '_')}` : 'livrable'}
                                          className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 hover:bg-emerald-100 text-[11px] transition shadow-2xs"
                                        >
                                          <Download className="h-3.5 w-3.5" /> Télécharger la pièce jointe
                                        </a>
                                      ) : (
                                        <a
                                          href={deliv.fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline text-[11px]"
                                        >
                                          <Paperclip className="h-3.5 w-3.5" /> Voir le document externe
                                        </a>
                                      )}
                                    </div>
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
                    )}

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
                              {u.attachmentUrl && (
                                <p className="mt-0.5">
                                  <a
                                    href={u.attachmentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline text-[11px]"
                                  >
                                    <Paperclip className="h-3 w-3" />
                                    Justificatif joint
                                  </a>
                                </p>
                              )}
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
