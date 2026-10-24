import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  Plus,
  Layers,
  FolderKanban,
  ChevronRight,
  ChevronDown,
  Trash2,
  BarChart3,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Filter,
  ArrowUpRight,
  Briefcase,
  Calendar,
  Sparkles,
  Edit3,
  Target,
  Activity,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';

export function ProjectListScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modals state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [activeProgramForAttach, setActiveProgramForAttach] = useState<any>(null);

  // Form state - Project Creation (Enriched with quick & advanced options)
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [programId, setProgramId] = useState('');
  const [status, setStatus] = useState<'planned' | 'active'>('planned');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [initialBudget, setInitialBudget] = useState('');
  const [selectedGrantId, setSelectedGrantId] = useState('');
  const [customDonorName, setCustomDonorName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openAfterCreate, setOpenAfterCreate] = useState(true);
  const [projectError, setProjectError] = useState('');

  const resetProjectForm = () => {
    setCode('');
    setName('');
    setProgramId('');
    setStatus('planned');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setInitialBudget('');
    setSelectedGrantId('');
    setCustomDonorName('');
    setShowAdvanced(false);
    setProjectError('');
  };

  // Form state - Program Creation & Edit
  const [editingProgram, setEditingProgram] = useState<any>(null);
  const [progCode, setProgCode] = useState('');
  const [progName, setProgName] = useState('');
  const [progThematicPillar, setProgThematicPillar] = useState('');
  const [progLeadManagerName, setProgLeadManagerName] = useState('');
  const [progLeadManagerEmail, setProgLeadManagerEmail] = useState('');
  const [progDesc, setProgDesc] = useState('');
  const [progStrategicObjectives, setProgStrategicObjectives] = useState('');
  const [progStartDate, setProgStartDate] = useState('');
  const [progEndDate, setProgEndDate] = useState('');
  const [progTargetBudget, setProgTargetBudget] = useState('');
  const [progTargetBeneficiariesCount, setProgTargetBeneficiariesCount] = useState('');
  const [progPrimaryDonorName, setProgPrimaryDonorName] = useState('');
  const [progReviewCadence, setProgReviewCadence] = useState<'monthly' | 'quarterly' | 'biannual' | 'annual'>('quarterly');
  const [progStatus, setProgStatus] = useState<'planned' | 'active' | 'suspended' | 'closed'>('active');
  const [progShowAdvanced, setProgShowAdvanced] = useState(false);
  const [programError, setProgramError] = useState('');

  const resetProgramForm = () => {
    setEditingProgram(null);
    setProgCode('');
    setProgName('');
    setProgThematicPillar('');
    setProgLeadManagerName('');
    setProgLeadManagerEmail('');
    setProgDesc('');
    setProgStrategicObjectives('');
    setProgStartDate('');
    setProgEndDate('');
    setProgTargetBudget('');
    setProgTargetBeneficiariesCount('');
    setProgPrimaryDonorName('');
    setProgReviewCadence('quarterly');
    setProgStatus('active');
    setProgShowAdvanced(false);
    setProgramError('');
  };

  const openEditProgram = (prog: any) => {
    setEditingProgram(prog);
    setProgCode(prog.code || '');
    setProgName(prog.name || '');
    setProgThematicPillar(prog.thematicPillar || '');
    setProgLeadManagerName(prog.leadManagerName || '');
    setProgLeadManagerEmail(prog.leadManagerEmail || '');
    setProgDesc(prog.description || '');
    setProgStrategicObjectives(prog.strategicObjectives || '');
    setProgStartDate(prog.startDate || '');
    setProgEndDate(prog.endDate || '');
    setProgTargetBudget(prog.targetBudget ? String(Number(prog.targetBudget)) : '');
    setProgTargetBeneficiariesCount(prog.targetBeneficiariesCount ? String(prog.targetBeneficiariesCount) : '');
    setProgPrimaryDonorName(prog.primaryDonorName || '');
    setProgReviewCadence(prog.reviewCadence || 'quarterly');
    setProgStatus(prog.status || 'active');
    setProgShowAdvanced(true);
    setProgramError('');
    setShowProgramModal(true);
  };

  // Form state - Attach Project to Program
  const [selectedProjectIdToAttach, setSelectedProjectIdToAttach] = useState('');

  // Filter & Search state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'programs' | 'projects'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');

  // Helper: Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{t('project.active')}</span>;
      case 'planned':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">{t('project.planned')}</span>;
      case 'on_hold':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">{t('project.onHold')}</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">{t('project.completed')}</span>;
      case 'archived':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">{t('project.archived')}</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">{t('common.cancel')}</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  // Helper: Safe JSON response parser
  const parseApiResponse = async (res: Response, fallbackMsg: string) => {
    if (!res.ok) {
      try {
        const data = await res.json();
        throw new Error(data.message || data.error || `${fallbackMsg} (${res.status})`);
      } catch (err: any) {
        if (err.message && !err.message.includes('Unexpected end of JSON')) {
          throw err;
        }
        throw new Error(`${fallbackMsg} (Code ${res.status}: ${res.statusText || 'Erreur'})`);
      }
    }
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  // Fetch Programs (with linked projects and computed metrics)
  const { data: programs = [], isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects/programs');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Grants / Bailleurs (for funder selector)
  const { data: grants = [] } = useQuery({
    queryKey: ['grants'],
    queryFn: async () => {
      const res = await fetch('/api/v1/grants');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Funders (for funder selector)
  const { data: funders = [] } = useQuery({
    queryKey: ['funders'],
    queryFn: async () => {
      const res = await fetch('/api/v1/grants/funders');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch All Projects (with computed real metrics)
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects');
      if (!res.ok) throw new Error('Erreur chargement projets');
      return res.json();
    },
  });

  // Save Program Mutation (Create or Update)
  const saveProgramMutation = useMutation({
    mutationFn: async (payload: any) => {
      const isEdit = !!editingProgram?.id;
      const url = isEdit
        ? `/api/v1/projects/programs/${editingProgram.id}`
        : '/api/v1/projects/programs';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return parseApiResponse(res, isEdit ? 'Erreur lors de la mise à jour du programme' : 'Erreur lors de la création du programme');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowProgramModal(false);
      resetProgramForm();
    },
    onError: (err: any) => setProgramError(err.message),
  });

  // Delete Program Mutation
  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      const res = await fetch(`/api/v1/projects/programs/${programId}`, {
        method: 'DELETE',
      });
      return parseApiResponse(res, 'Erreur lors de la suppression du programme');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Create Project Mutation
  const createProjectMutation = useMutation({
    mutationFn: async (payload: {
      code: string;
      name: string;
      programId?: string | null;
      grantId?: string | null;
      funderId?: string | null;
      status?: string;
      description?: string | null;
      startDate?: string | null;
      endDate?: string | null;
      initialBudget?: number | null;
      donorName?: string | null;
    }) => {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return parseApiResponse(res, 'Erreur lors de la création du projet');
    },
    onSuccess: (createdProject: any) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setShowProjectModal(false);
      resetProjectForm();
      if (openAfterCreate && createdProject?.id) {
        navigate(`/projects/${createdProject.id}`);
      }
    },
    onError: (err: any) => setProjectError(err.message),
  });

  // Attach Project to Program Mutation
  const attachProjectMutation = useMutation({
    mutationFn: async ({ programId, projectId }: { programId: string; projectId: string }) => {
      const res = await fetch(`/api/v1/projects/programs/${programId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      return parseApiResponse(res, "Erreur lors du rattachement du projet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowAttachModal(false);
      setSelectedProjectIdToAttach('');
    },
    onError: (err: any) => setProgramError(err.message),
  });

  // Remove Project from Program Mutation
  const removeProjectFromProgramMutation = useMutation({
    mutationFn: async ({ programId, projectId }: { programId: string; projectId: string }) => {
      const res = await fetch(`/api/v1/projects/programs/${programId}/projects/${projectId}/remove`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Erreur retrait projet');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Computed Global Dashboard KPIs & Strategic Portfolio Breakdown
  const dashboardKpis = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p: any) => p.status === 'active' || p.status === 'planned').length;
    const totalPrograms = programs.length;

    let totalBudget = 0;
    let totalExpenses = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let blockedTasks = 0;
    let totalProgressSum = 0;

    projects.forEach((p: any) => {
      if (p.metrics) {
        totalBudget += p.metrics.totalBudget || 0;
        totalExpenses += p.metrics.totalExpenses || 0;
        totalTasks += p.metrics.totalTasks || 0;
        completedTasks += p.metrics.completedTasks || 0;
        blockedTasks += p.metrics.blockedTasks || 0;
        totalProgressSum += p.metrics.overallProgress || 0;
      }
    });

    const averageProgress = totalProjects > 0 ? Math.round(totalProgressSum / totalProjects) : 0;
    const budgetExecutionRate = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

    // Cumulated targets from programs
    let totalTargetBeneficiaries = 0;
    let totalTargetProgramBudget = 0;
    const healthCounts = { healthy: 0, warning: 0, critical: 0 };
    const pillarsMap = new Map<string, { count: number; budget: number; expenses: number; projectsCount: number }>();

    programs.forEach((prog: any) => {
      totalTargetBeneficiaries += prog.targetBeneficiariesCount || prog.metrics?.targetBeneficiariesCount || 0;
      totalTargetProgramBudget += Number(prog.targetBudget || 0);

      const health = (prog.metrics?.healthStatus || 'healthy') as keyof typeof healthCounts;
      if (healthCounts[health] !== undefined) healthCounts[health]++;

      const pillar = prog.thematicPillar || 'Non classé / Général';
      const existing = pillarsMap.get(pillar) || { count: 0, budget: 0, expenses: 0, projectsCount: 0 };
      existing.count += 1;
      existing.budget += Number(prog.targetBudget || prog.metrics?.totalBudget || 0);
      existing.expenses += prog.metrics?.totalExpenses || 0;
      existing.projectsCount += prog.projectsCount || 0;
      pillarsMap.set(pillar, existing);
    });

    const pillarsList = Array.from(pillarsMap.entries()).map(([name, data]) => ({
      name,
      ...data,
      budgetPct: totalBudget > 0 ? Math.round((data.budget / totalBudget) * 100) : 0,
    })).sort((a, b) => b.budget - a.budget);

    // Projects with critical alerts
    const criticalProjects = projects.filter((p: any) => (p.metrics?.blockedTasks || 0) > 0 || ((p.metrics?.totalBudget || 0) > 0 && (p.metrics?.totalExpenses || 0) > (p.metrics?.totalBudget || 0)));

    return {
      totalProjects,
      activeProjects,
      totalPrograms,
      totalBudget,
      totalTargetProgramBudget,
      totalExpenses,
      budgetExecutionRate,
      averageProgress,
      totalTasks,
      completedTasks,
      blockedTasks,
      totalTargetBeneficiaries,
      healthCounts,
      pillarsList,
      criticalProjects,
    };
  }, [projects, programs]);

  // Filtered projects for list tab
  const filteredProjects = useMemo(() => {
    return projects.filter((p: any) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.program?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && (p.status === 'active' || p.status === 'planned')) ||
        (statusFilter === 'archived' && (p.status === 'archived' || p.status === 'completed'));

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des Projets & Programmes</h1>
            <p className="text-xs text-slate-500 mt-1">
              Pilotage stratégique, découpage WBS, suivi des budgets et indicateurs réels d'avancement.
            </p>
          </div>

          {/* Action buttons only in their relevant management tabs */}
          <div className="flex items-center space-x-3">
            {activeTab === 'programs' && (
              <Button onClick={() => setShowProgramModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Programme
              </Button>
            )}

            {activeTab === 'projects' && (
              <Button onClick={() => setShowProjectModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Projet Autonome
              </Button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-200 space-x-8 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 flex items-center space-x-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Tableau de Bord Exécutif</span>
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`pb-3 flex items-center space-x-2 transition-colors ${
              activeTab === 'programs'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Programmes d'Intervention ({programs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-3 flex items-center space-x-2 transition-colors ${
              activeTab === 'projects'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderKanban className="h-4 w-4" />
            <span>Catalogue des Projets ({projects.length})</span>
          </button>
        </div>

        {/* TAB 1: EXECUTIVE DASHBOARD (Pure Metrics, Graphs & Tracking) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 6 Executive KPI & Status Tracking Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Card 1: Projets Actifs */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Projets Actifs</span>
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xl font-bold text-slate-900">{dashboardKpis.activeProjects}</span>
                    <span className="text-xs text-slate-400">/ {dashboardKpis.totalProjects} total</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {dashboardKpis.totalPrograms} programme(s)
                  </span>
                </div>
              </div>

              {/* Card 2: Avancement Moyen WBS */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avancement WBS</span>
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xl font-bold text-emerald-600">{dashboardKpis.averageProgress}%</span>
                    <span className="text-xs text-slate-400">moyen</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${dashboardKpis.averageProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Budget & Dépenses Réelles */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dépenses Réelles</span>
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900 truncate">
                    {formatCurrency(dashboardKpis.totalExpenses)}
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between mt-0.5">
                    <span>Engagé :</span>
                    <span className="font-semibold text-slate-700">{formatCurrency(dashboardKpis.totalBudget)}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Taux d'Exécution Budgétaire */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Taux d'Exécution</span>
                  <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline space-x-1.5">
                    <span className={`text-xl font-bold ${dashboardKpis.budgetExecutionRate > 100 ? 'text-red-600' : 'text-slate-900'}`}>
                      {dashboardKpis.budgetExecutionRate}%
                    </span>
                    <span className="text-xs text-slate-400">du budget</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {dashboardKpis.budgetExecutionRate > 100 ? '⚠️ Dépassement' : '✓ Conforme au cadre'}
                  </span>
                </div>
              </div>

              {/* Card 5: Cibles Bénéficiaires */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cible Bénéficiaires</span>
                  <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="text-base font-bold text-purple-700 truncate">
                    {dashboardKpis.totalTargetBeneficiaries > 0 ? `${dashboardKpis.totalTargetBeneficiaries.toLocaleString()}` : '0'}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    personnes visées
                  </span>
                </div>
              </div>

              {/* Card 6: Santé & Contrôle */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Santé Portefeuille</span>
                  <div className={`p-1.5 rounded-lg ${dashboardKpis.blockedTasks > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {dashboardKpis.blockedTasks > 0 ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {dashboardKpis.blockedTasks === 0 ? '🟢 100% Maîtrisé' : `🔴 ${dashboardKpis.blockedTasks} Blocage(s)`}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {dashboardKpis.completedTasks}/{dashboardKpis.totalTasks} tâches finies
                  </span>
                </div>
              </div>
            </div>

            {/* Points de Vigilance & Alertes Prioritaires (if any) */}
            {dashboardKpis.criticalProjects.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <h3 className="font-bold text-sm text-red-900">
                      Points d'Attention & Vigilance ({dashboardKpis.criticalProjects.length} projet(s) concerné(s))
                    </h3>
                  </div>
                  <span className="text-xs text-red-700">Actions correctives recommandées</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dashboardKpis.criticalProjects.map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="p-3 bg-white rounded-lg border border-red-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-red-700">{p.code}</span>
                        {p.metrics?.blockedTasks > 0 && (
                          <span className="text-[11px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                            {p.metrics.blockedTasks} tâche(s) bloquée(s)
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{p.name}</h4>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>Avancement : {p.metrics?.overallProgress || 0}%</span>
                        <span>{formatCurrency(p.metrics?.totalExpenses || 0)} dépensés</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Split Section: Performance des Programmes (Left) & Piliers Thématiques (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2/3): Supervision des Programmes Stratégiques */}
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Supervision des Programmes Stratégiques</h2>
                    <p className="text-xs text-slate-500">Suivi consolidé par programme d'intervention et portefeuille</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('programs')}>
                    Voir tout ({programs.length})
                  </Button>
                </div>

                {programs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    Aucun programme enregistré. Créez un programme pour consolider vos projets.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {programs.map((prog: any) => {
                      const targetBudgetNum = Number(prog.targetBudget || 0);
                      const allocatedBudget = prog.metrics?.allocatedBudget || 0;
                      const totalExpenses = prog.metrics?.totalExpenses || 0;
                      const progressPct = prog.metrics?.overallProgress || 0;

                      return (
                        <div
                          key={prog.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-amber-300 transition-all space-y-3 shadow-2xs"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded uppercase">
                                  {prog.code}
                                </span>
                                {prog.thematicPillar && (
                                  <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-medium line-clamp-1 max-w-[130px]">
                                    {prog.thematicPillar}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{prog.name}</h3>
                            </div>
                            <Badge variant="default" className="bg-slate-800 text-white text-[11px] shrink-0">
                              {prog.projectsCount || 0} projet(s)
                            </Badge>
                          </div>

                          {/* Progress */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-500">Avancement WBS</span>
                              <span className="text-indigo-600 font-bold">{progressPct}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                              <div
                                className="bg-indigo-600 h-1.5 rounded-full"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Budget & Alerts Info */}
                          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                            <span>
                              Budget : <strong className="text-slate-900">{formatCurrency(totalExpenses)}</strong> / {formatCurrency(targetBudgetNum > 0 ? targetBudgetNum : allocatedBudget)}
                            </span>
                            {prog.metrics?.blockedTasks > 0 ? (
                              <span className="text-red-600 font-bold text-[11px]">
                                {prog.metrics.blockedTasks} blocage(s)
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-semibold text-[11px]">🟢 Sain</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column (1/3): Répartition par Pilier Thématique */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Piliers d'Intervention</h2>
                  <p className="text-xs text-slate-500">Répartition des budgets et projets par grand axe</p>
                </div>

                {dashboardKpis.pillarsList.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 italic">
                    Aucun pilier thématique défini dans les programmes.
                  </div>
                ) : (
                  <div className="space-y-3.5 pt-1">
                    {dashboardKpis.pillarsList.map((pillar) => (
                      <div key={pillar.name} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                          <span className="flex items-center space-x-1.5 line-clamp-1">
                            <Target className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span>{pillar.name}</span>
                          </span>
                          <span className="text-indigo-700 font-bold shrink-0">{pillar.budgetPct}%</span>
                        </div>

                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, pillar.budgetPct || 10)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{pillar.projectsCount} projet(s) dans cet axe</span>
                          <span className="font-semibold text-slate-800">{formatCurrency(pillar.budget)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Projets Récents avec Accès Direct */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Projets Récents</h2>
                  <p className="text-xs text-slate-500">Accès rapide aux plans WBS, affectations RACI et budgets</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActiveTab('projects')}>
                  Voir tout le catalogue ({projects.length})
                </Button>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 italic">
                  Aucun projet enregistré dans le catalogue.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {projects.slice(0, 6).map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-indigo-600 group-hover:underline">
                            {p.code}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{p.name}</h4>
                          {p.program && (
                            <span className="text-[11px] text-slate-500">{p.program.name}</span>
                          )}
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500">Progression</span>
                          <span className="text-slate-900 font-bold">{p.metrics?.overallProgress || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              (p.metrics?.overallProgress || 0) === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${p.metrics?.overallProgress || 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t">
                        <span>{p.metrics?.completedTasks || 0} / {p.metrics?.totalTasks || 0} tâches</span>
                        <span>{formatCurrency(p.metrics?.totalExpenses || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PROGRAMS LIST & STRATEGIC COCKPIT */}
        {activeTab === 'programs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Portefeuille des Programmes Stratégiques</h2>
                <p className="text-xs text-slate-500">
                  Supervision transversale, consolidation budgétaire, gouvernance et impact multi-projets
                </p>
              </div>
              <Button onClick={() => setShowProgramModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Nouveau Programme Stratégique
              </Button>
            </div>

            {programs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 space-y-3">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Aucun programme stratégique créé</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Les programmes vous permettent de regrouper des projets d'intervention sous un même axe stratégique, de piloter une enveloppe budgétaire globale et de suivre vos cibles d'impact.
                </p>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white mt-2" onClick={() => setShowProgramModal(true)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Créer mon premier programme
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {programs.map((prog: any) => {
                  const targetBudgetNum = Number(prog.targetBudget || 0);
                  const allocatedBudget = prog.metrics?.allocatedBudget || 0;
                  const totalExpenses = prog.metrics?.totalExpenses || 0;
                  const progressPct = prog.metrics?.overallProgress || 0;
                  const targetBeneficiaries = prog.targetBeneficiariesCount || prog.metrics?.targetBeneficiariesCount || 0;

                  return (
                    <div key={prog.id} className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all hover:shadow-md">
                      {/* Program Header Banner */}
                      <div className="bg-slate-900 text-white p-5 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start space-x-3.5">
                            <div className="rounded-xl bg-amber-500/20 p-3 text-amber-400 border border-amber-500/30 shrink-0">
                              <Layers className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="font-mono text-xs text-amber-400 bg-amber-400/15 px-2.5 py-0.5 rounded-md font-bold uppercase border border-amber-400/20">
                                  {prog.code}
                                </span>
                                {prog.thematicPillar && (
                                  <span className="text-xs bg-indigo-500/20 text-indigo-200 px-2.5 py-0.5 rounded-md font-medium border border-indigo-500/30 flex items-center space-x-1">
                                    <Target className="h-3 w-3 mr-1" />
                                    {prog.thematicPillar}
                                  </span>
                                )}
                                {prog.metrics?.healthStatus === 'healthy' && (
                                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-semibold border border-emerald-500/30">
                                    🟢 Santé Optimale ({prog.metrics.healthScore}/100)
                                  </span>
                                )}
                                {prog.metrics?.healthStatus === 'warning' && (
                                  <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-semibold border border-amber-500/30">
                                    🟡 Risque Modéré ({prog.metrics?.healthScore || 65}/100)
                                  </span>
                                )}
                                {prog.metrics?.healthStatus === 'critical' && (
                                  <span className="text-[11px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-md font-semibold border border-red-500/30">
                                    🔴 Attention Requise ({prog.metrics?.healthScore || 40}/100)
                                  </span>
                                )}
                              </div>
                              <h2 className="font-bold text-lg text-white">{prog.name}</h2>
                              {prog.description && (
                                <p className="text-xs text-slate-300 line-clamp-2 max-w-3xl">{prog.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center flex-wrap gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setActiveProgramForAttach(prog);
                                setShowAttachModal(true);
                              }}
                              className="text-xs shadow-xs font-semibold bg-white text-slate-900 hover:bg-slate-100"
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              Rattacher un projet
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditProgram(prog)}
                              className="text-xs text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white"
                            >
                              <Edit3 className="mr-1 h-3.5 w-3.5" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Êtes-vous sûr de vouloir supprimer le programme ${prog.name} ? Les projets rattachés resteront disponibles.`)) {
                                  deleteProgramMutation.mutate(prog.id);
                                }
                              }}
                              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Program Metadata Bar */}
                        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-300">
                          {prog.leadManagerName && (
                            <div className="flex items-center space-x-1.5">
                              <Users className="h-3.5 w-3.5 text-amber-400" />
                              <span className="text-slate-400">Responsable :</span>
                              <span className="font-semibold text-slate-200">
                                {prog.leadManagerName}
                                {prog.leadManagerEmail ? ` (${prog.leadManagerEmail})` : ''}
                              </span>
                            </div>
                          )}
                          {(prog.startDate || prog.endDate) && (
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="h-3.5 w-3.5 text-amber-400" />
                              <span className="text-slate-400">Période :</span>
                              <span className="font-semibold text-slate-200">
                                {prog.startDate ? new Date(prog.startDate).toLocaleDateString('fr-CA') : 'N/D'} → {prog.endDate ? new Date(prog.endDate).toLocaleDateString('fr-CA') : 'N/D'}
                              </span>
                            </div>
                          )}
                          {prog.reviewCadence && (
                            <div className="flex items-center space-x-1.5">
                              <Activity className="h-3.5 w-3.5 text-amber-400" />
                              <span className="text-slate-400">Revue COPIL :</span>
                              <span className="font-semibold text-slate-200 capitalize">
                                {prog.reviewCadence === 'monthly' ? 'Mensuelle' : prog.reviewCadence === 'quarterly' ? 'Trimestrielle' : prog.reviewCadence === 'biannual' ? 'Semestrielle' : 'Annuelle'}
                              </span>
                            </div>
                          )}
                          {prog.primaryDonorName && (
                            <div className="flex items-center space-x-1.5">
                              <Briefcase className="h-3.5 w-3.5 text-amber-400" />
                              <span className="text-slate-400">Bailleur principal :</span>
                              <span className="font-semibold text-slate-200">{prog.primaryDonorName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Strategic Objectives Callout if present */}
                      {prog.strategicObjectives && (
                        <div className="bg-amber-50/70 border-b border-amber-100 px-6 py-2.5 flex items-start space-x-2.5 text-xs text-amber-950">
                          <Compass className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Théorie du Changement & Objectifs Stratégiques : </span>
                            <span className="text-amber-900">{prog.strategicObjectives}</span>
                          </div>
                        </div>
                      )}

                      {/* 4 Program Control & Monitoring KPIs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-50 border-b border-slate-200">
                        {/* KPI 1: Avancement Global */}
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                            <span className="flex items-center space-x-1">
                              <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Avancement WBS</span>
                            </span>
                            <span className="font-bold text-slate-900">{progressPct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Moyenne consolidée sur {prog.projectsCount || 0} projet(s)
                          </div>
                        </div>

                        {/* KPI 2: Enveloppe & Exécution Budgétaire */}
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Consommation Budget</span>
                            </span>
                            <span className="font-bold text-emerald-700">
                              {prog.metrics?.budgetExecutionRate || 0}%
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-sm">
                            {formatCurrency(totalExpenses)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Sur enveloppe de {formatCurrency(targetBudgetNum > 0 ? targetBudgetNum : allocatedBudget)}
                          </div>
                        </div>

                        {/* KPI 3: Cible de Bénéficiaires / Impact */}
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                            <span className="flex items-center space-x-1">
                              <Users className="h-3.5 w-3.5 text-purple-600" />
                              <span>Cible Bénéficiaires</span>
                            </span>
                            <span className="font-semibold text-purple-700 text-xs">Portée macro</span>
                          </div>
                          <div className="font-bold text-slate-900 text-sm">
                            {targetBeneficiaries > 0 ? `${targetBeneficiaries.toLocaleString()} personnes` : 'Non définie'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Population cible globale
                          </div>
                        </div>

                        {/* KPI 4: Tâches & Alertes Opérationnelles */}
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                            <span className="flex items-center space-x-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                              <span>Tâches & Contrôle</span>
                            </span>
                            {prog.metrics?.blockedTasks > 0 ? (
                              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-sm">
                                {prog.metrics.blockedTasks} blocage(s)
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-emerald-600">Fluide</span>
                            )}
                          </div>
                          <div className="font-bold text-slate-900 text-sm">
                            {prog.metrics?.completedTasks || 0} / {prog.metrics?.totalTasks || 0} tâches
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {prog.metrics?.activeProjectsCount || 0} projet(s) actif(s) en cours
                          </div>
                        </div>
                      </div>

                      {/* Associated Projects Table */}
                      {!prog.projects || prog.projects.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 italic bg-white">
                          Aucun projet rattaché à ce programme. Cliquez sur "Rattacher un projet" pour composer le portefeuille de ce programme.
                        </div>
                      ) : (
                        <table className="w-full text-left text-sm text-slate-600 bg-white">
                          <thead className="border-b bg-slate-50/70 text-xs font-semibold uppercase text-slate-500">
                            <tr>
                              <th className="px-6 py-3">Code Projet</th>
                              <th className="px-6 py-3">Nom du Projet</th>
                              <th className="px-6 py-3">Avancement WBS</th>
                              <th className="px-6 py-3">Tâches (Finies/Total)</th>
                              <th className="px-6 py-3">Dépenses / Budget</th>
                              <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {prog.projects.map((p: any) => (
                              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                <td
                                  onClick={() => navigate(`/projects/${p.id}`)}
                                  className="px-6 py-4 font-mono font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                  {p.code}
                                </td>
                                <td
                                  onClick={() => navigate(`/projects/${p.id}`)}
                                  className="px-6 py-4 font-medium text-slate-900 cursor-pointer"
                                >
                                  {p.name}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2 w-32">
                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-2 rounded-full ${
                                          (p.metrics?.overallProgress || 0) === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                                        }`}
                                        style={{ width: `${p.metrics?.overallProgress || 0}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700 min-w-[32px]">
                                      {p.metrics?.overallProgress || 0}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-700">
                                  {p.metrics?.completedTasks || 0} / {p.metrics?.totalTasks || 0}
                                  {p.metrics?.blockedTasks > 0 && (
                                    <span className="ml-2 text-red-600 font-bold">({p.metrics.blockedTasks} bloquée(s))</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-xs">
                                  <span className="font-semibold text-slate-800">
                                    {formatCurrency(p.metrics?.totalExpenses || 0)}
                                  </span>
                                  <span className="text-slate-400"> / {formatCurrency(p.metrics?.totalBudget || 0)}</span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      removeProjectFromProgramMutation.mutate({
                                        programId: prog.id,
                                        projectId: p.id,
                                      })
                                    }
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Détacher
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ALL AUTONOMOUS PROJECTS CATALOG */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par code, nom ou programme..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    Tous ({projects.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      statusFilter === 'active' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    Actifs
                  </button>
                  <button
                    onClick={() => setStatusFilter('archived')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      statusFilter === 'archived' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    Archivés
                  </button>
                </div>

                <Button onClick={() => setShowProjectModal(true)} size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Nouveau Projet
                </Button>
              </div>
            </div>

            {/* Projects Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {isLoadingProjects ? (
                <div className="p-8 text-center text-slate-500">Chargement des projets...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  {searchTerm ? 'Aucun projet correspondant à votre recherche.' : 'Aucun projet dans le catalogue.'}
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Code</th>
                      <th className="px-6 py-3.5">Nom du Projet</th>
                      <th className="px-6 py-3.5">Programme Rattaché</th>
                      <th className="px-6 py-3.5">Avancement WBS</th>
                      <th className="px-6 py-3.5">Tâches</th>
                      <th className="px-6 py-3.5">Dépenses / Budget</th>
                      <th className="px-6 py-3.5">Statut</th>
                      <th className="px-6 py-3.5 text-right">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProjects.map((p: any) => (
                      <tr
                        key={p.id}
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600 hover:underline">
                          {p.code}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {p.name}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {p.program ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              {p.program.code} - {p.program.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Projet autonome</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 w-28">
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${
                                  (p.metrics?.overallProgress || 0) === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                                }`}
                                style={{ width: `${p.metrics?.overallProgress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700 min-w-[28px]">
                              {p.metrics?.overallProgress || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-700">
                          {p.metrics?.completedTasks || 0} / {p.metrics?.totalTasks || 0}
                          {p.metrics?.blockedTasks > 0 && (
                            <span className="ml-1 text-red-600 font-bold">⚠️</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(p.metrics?.totalExpenses || 0)}
                          </span>
                          <span className="text-slate-400"> / {formatCurrency(p.metrics?.totalBudget || 0)}</span>
                        </td>
                        <td className="px-6 py-4">
                          {renderStatusBadge(p.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight className="inline-block h-4 w-4 text-slate-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Create & Edit Program (Enriched with Strategic & Control Indicators) */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-5 my-8 border border-slate-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingProgram ? `Modifier le Programme : ${editingProgram.code}` : 'Créer un Nouveau Programme Stratégique'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Définissez le cadre programmatique, l'enveloppe budgétaire et les cibles d'impact
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProgramModal(false);
                  resetProgramForm();
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {programError && (
              <div className="rounded-lg bg-red-50 p-3.5 text-xs text-red-700 border border-red-200 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{programError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setProgramError('');

                const payload: any = {
                  code: progCode.trim().toUpperCase(),
                  name: progName.trim(),
                  thematicPillar: progThematicPillar.trim() || null,
                  leadManagerName: progLeadManagerName.trim() || null,
                  leadManagerEmail: progLeadManagerEmail.trim() || null,
                  description: progDesc.trim() || null,
                  strategicObjectives: progStrategicObjectives.trim() || null,
                  startDate: progStartDate || null,
                  endDate: progEndDate || null,
                  targetBudget: progTargetBudget ? parseFloat(progTargetBudget) : 0,
                  targetBeneficiariesCount: progTargetBeneficiariesCount ? parseInt(progTargetBeneficiariesCount, 10) : 0,
                  primaryDonorName: progPrimaryDonorName.trim() || null,
                  reviewCadence: progReviewCadence,
                  status: progStatus,
                };

                saveProgramMutation.mutate(payload);
              }}
              className="space-y-4"
            >
              {/* Code & Statut */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Code Programme (Ex: PROG-SANTE-2026) *"
                    value={progCode}
                    onChange={(e) => setProgCode(e.target.value.toUpperCase())}
                    placeholder="PROG-SANTE"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                  <select
                    value={progStatus}
                    onChange={(e: any) => setProgStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="planned">Planifié</option>
                    <option value="active">Actif</option>
                    <option value="suspended">Suspendu</option>
                    <option value="closed">Clôturé</option>
                  </select>
                </div>
              </div>

              {/* Nom du programme */}
              <Input
                label="Intitulé du Programme *"
                value={progName}
                onChange={(e) => setProgName(e.target.value)}
                placeholder="Ex: Programme Intégré de Santé Maternelle & Nutrition"
                required
              />

              {/* Pilier thématique & Cadence de revue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pilier / Axe Thématique
                  </label>
                  <input
                    type="text"
                    list="thematicPillarsList"
                    value={progThematicPillar}
                    onChange={(e) => setProgThematicPillar(e.target.value)}
                    placeholder="Ex: Santé Communautaire, Sécurité Alimentaire..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                  <datalist id="thematicPillarsList">
                    <option value="Santé Communautaire & Nutrition" />
                    <option value="Sécurité Alimentaire & Moyens de Subsistance" />
                    <option value="Éducation & Formation Professionnelle" />
                    <option value="Inclusion Sociale & Protection" />
                    <option value="Environnement & Résilience Climatique" />
                    <option value="Réponse Humanitaire d'Urgence" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cadence des Revues COPIL
                  </label>
                  <select
                    value={progReviewCadence}
                    onChange={(e: any) => setProgReviewCadence(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="monthly">Mensuelle (Revue mensuelle)</option>
                    <option value="quarterly">Trimestrielle (Recommandé)</option>
                    <option value="biannual">Semestrielle</option>
                    <option value="annual">Annuelle</option>
                  </select>
                </div>
              </div>

              {/* Responsable de Programme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nom du Responsable de Programme"
                  value={progLeadManagerName}
                  onChange={(e) => setProgLeadManagerName(e.target.value)}
                  placeholder="Ex: Sophie Tremblay"
                />
                <Input
                  label="Email de contact"
                  type="email"
                  value={progLeadManagerEmail}
                  onChange={(e) => setProgLeadManagerEmail(e.target.value)}
                  placeholder="sophie.tremblay@org.org"
                />
              </div>

              {/* Collapsible: Cadrage Stratégique, Budgétaire & Objectifs */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setProgShowAdvanced(!progShowAdvanced)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-700"
                >
                  <span className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span>Cadrage Stratégique, Dates, Enveloppe & Cibles d'Impact</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${progShowAdvanced ? 'rotate-180' : ''}`}
                  />
                </button>

                {progShowAdvanced && (
                  <div className="p-4 bg-white space-y-4 border-t border-slate-200">
                    {/* Dates Pluriannuelles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Date de début programmatique</label>
                        <input
                          type="date"
                          value={progStartDate}
                          onChange={(e) => setProgStartDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Date de fin programmatique</label>
                        <input
                          type="date"
                          value={progEndDate}
                          min={progStartDate || undefined}
                          onChange={(e) => setProgEndDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Enveloppe Budgétaire Cible & Cible Bénéficiaires */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Enveloppe Budgétaire Globale ($ CAD)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={progTargetBudget}
                          onChange={(e) => setProgTargetBudget(e.target.value)}
                          placeholder="Ex: 500000"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Cible Bénéficiaires (Personnes / Usagers)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={progTargetBeneficiariesCount}
                          onChange={(e) => setProgTargetBeneficiariesCount(e.target.value)}
                          placeholder="Ex: 5000"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Bailleur / Partenaire Principal */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Bailleur Institutionnel / Partenaire Principal
                      </label>
                      <input
                        type="text"
                        value={progPrimaryDonorName}
                        onChange={(e) => setProgPrimaryDonorName(e.target.value)}
                        placeholder="Ex: Affaires Mondiales Canada, USAID, Union Européenne, Fonds Propres..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Objectifs Stratégiques & Théorie du Changement */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Objectifs Stratégiques & Théorie du Changement
                      </label>
                      <textarea
                        rows={2}
                        value={progStrategicObjectives}
                        onChange={(e) => setProgStrategicObjectives(e.target.value)}
                        placeholder="Quels sont les changements durables visés par ce programme sur la population cible ?"
                        className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Description générale */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Description et Contexte d'intervention
                      </label>
                      <textarea
                        rows={2}
                        value={progDesc}
                        onChange={(e) => setProgDesc(e.target.value)}
                        placeholder="Détails contextuels, zones géographiques couvertes, synergies attendues..."
                        className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setShowProgramModal(false);
                    resetProgramForm();
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saveProgramMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {saveProgramMutation.isPending
                    ? 'Enregistrement...'
                    : editingProgram
                    ? 'Mettre à jour le programme'
                    : 'Créer le programme'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Project (Enhanced with progressive disclosure) */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-5 my-8 border border-slate-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Créer un Nouveau Projet</h2>
                  <p className="text-xs text-slate-500">
                    Définissez les informations de base. Vous pourrez affiner les détails par la suite.
                  </p>
                </div>
              </div>
            </div>

            {projectError && (
              <div className="rounded-lg bg-red-50 p-3.5 text-sm text-red-700 flex items-start space-x-2 border border-red-100">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                <span>{projectError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setProjectError('');
                if (!code.trim()) {
                  setProjectError('Le code projet est requis.');
                  return;
                }
                if (!name.trim()) {
                  setProjectError('Le nom du projet est requis.');
                  return;
                }

                let effectiveDonorName: string | null = null;
                let effectiveGrantId: string | null = null;
                let effectiveFunderId: string | null = null;

                if (selectedGrantId.startsWith('funder:')) {
                  effectiveFunderId = selectedGrantId.replace('funder:', '');
                  const f = (funders as any[]).find((item: any) => item.id === effectiveFunderId);
                  if (f) {
                    effectiveDonorName = f.name;
                  }
                } else if (selectedGrantId.startsWith('grant:')) {
                  effectiveGrantId = selectedGrantId.replace('grant:', '');
                  const g = (grants as any[]).find((item: any) => item.id === effectiveGrantId);
                  if (g) {
                    effectiveDonorName = g.funderName;
                    effectiveFunderId = g.funderId || null;
                  }
                } else if (selectedGrantId === 'internal') {
                  effectiveDonorName = 'Fonds Propres / Autofinancement';
                }

                createProjectMutation.mutate({
                  code: code.trim().toUpperCase(),
                  name: name.trim(),
                  programId: programId ? programId : null,
                  grantId: effectiveGrantId,
                  funderId: effectiveFunderId,
                  status,
                  description: description.trim() || null,
                  startDate: startDate || null,
                  endDate: endDate || null,
                  initialBudget: initialBudget ? parseFloat(initialBudget) : null,
                  donorName: effectiveDonorName,
                });
              }}
              className="space-y-4"
            >
              {/* Main Fields: Code & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Code Projet (Ex: PRJ-2026-01) *"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="PRJ-ALIMENTAIRE"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Statut initial</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="planned">Planifié</option>
                    <option value="active">Actif (Démarré)</option>
                  </select>
                </div>
              </div>

              {/* Project Name */}
              <Input
                label="Nom du Projet *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Banque Alimentaire & Sécurité Nutritionnelle"
                required
              />

              {/* Program selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Programme d'intervention (Optionnel)
                </label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Projet autonome (Aucun programme rattaché)</option>
                  {programs.map((prog: any) => (
                    <option key={prog.id} value={prog.id}>
                      📁 {prog.code} — {prog.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Rattacher ce projet consolidera ses indicateurs et budgets dans le programme choisi.
                </p>
              </div>

              {/* Collapsible: Advanced options */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-700"
                >
                  <span className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>Options de cadrage initial (Dates, Budget & Bailleur)</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                  />
                </button>

                {showAdvanced && (
                  <div className="p-4 bg-white space-y-4 border-t border-slate-200">
                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Date de début prévue</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Date de fin prévue</label>
                        <input
                          type="date"
                          value={endDate}
                          min={startDate || undefined}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Initial Budget & Funder Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Budget cible initial ($ CAD)</label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={initialBudget}
                          onChange={(e) => setInitialBudget(e.target.value)}
                          placeholder="Ex: 50000"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Bailleur / Financement rattaché
                        </label>
                        <select
                          value={selectedGrantId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedGrantId(val);
                            if (val.startsWith('grant:')) {
                              const gId = val.replace('grant:', '');
                              const g = (grants as any[]).find((item: any) => item.id === gId);
                              if (g) {
                                if (!initialBudget && (g.awardedAmount || g.requestedAmount)) {
                                  setInitialBudget(
                                    Math.round(parseFloat(g.awardedAmount || g.requestedAmount)).toString()
                                  );
                                }
                                if (!startDate && g.startDate) setStartDate(g.startDate);
                                if (!endDate && g.endDate) setEndDate(g.endDate);
                              }
                            }
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                        >
                          <option value="">-- Aucun bailleur rattaché (Non spécifié) --</option>
                          {funders.length > 0 && (
                            <optgroup label="🏛️ Bailleurs de Fonds Institutionnels">
                              {funders.map((f: any) => (
                                <option key={f.id} value={`funder:${f.id}`}>
                                  🏛️ {f.name} ({f.code}) — {f.type}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {grants.length > 0 && (
                            <optgroup label="📄 Dossiers de Subvention Obtenus / Déposés">
                              {grants.map((g: any) => (
                                <option key={g.id} value={`grant:${g.id}`}>
                                  📄 {g.funderName} — {g.title} ({g.awardedAmount ? `${formatCurrency(g.awardedAmount)} CAD` : 'En demande'})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="💼 Autofinancement">
                            <option value="internal">💼 Fonds Propres / Autofinancement interne</option>
                          </optgroup>
                        </select>
                        <p className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Bailleur partenaire ou convention spécifique.</span>
                          <button
                            type="button"
                            onClick={() => navigate('/grants')}
                            className="text-indigo-600 hover:underline font-medium"
                          >
                            Gérer les bailleurs & subventions →
                          </button>
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Description & Objectif sommaire</label>
                      <textarea
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white h-20 focus:border-indigo-500 focus:outline-hidden"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brève synthèse des objectifs, bénéficiaires cibles et livrables attendus..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Post-creation preference */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="openAfterCreate"
                  checked={openAfterCreate}
                  onChange={(e) => setOpenAfterCreate(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="openAfterCreate" className="text-xs text-slate-600 cursor-pointer">
                  Ouvrir directement la fiche détaillée du projet après la création
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setShowProjectModal(false);
                    resetProjectForm();
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={createProjectMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {createProjectMutation.isPending ? 'Création en cours...' : 'Créer le projet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Attach Existing Project to Program */}
      {showAttachModal && activeProgramForAttach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Rattacher un Projet au Programme : {activeProgramForAttach.name}
            </h2>
            <p className="text-xs text-slate-500">
              Sélectionnez un projet de votre catalogue pour l'associer à ce programme d'intervention.
            </p>

            {programError && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{programError}</div>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedProjectIdToAttach) return;
                attachProjectMutation.mutate({
                  programId: activeProgramForAttach.id,
                  projectId: selectedProjectIdToAttach,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Projet à associer ({projects.length} disponibles)
                </label>
                <select
                  value={selectedProjectIdToAttach}
                  onChange={(e) => setSelectedProjectIdToAttach(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm bg-white"
                  required
                >
                  <option value="">-- Sélectionnez un projet --</option>
                  {projects.map((prj: any) => (
                    <option key={prj.id} value={prj.id}>
                      [{prj.code}] {prj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" type="button" onClick={() => setShowAttachModal(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedProjectIdToAttach || attachProjectMutation.isPending}
                >
                  {attachProjectMutation.isPending ? 'Association...' : 'Associer au programme'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
