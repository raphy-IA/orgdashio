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

  // Form state - Program Creation
  const [progCode, setProgCode] = useState('');
  const [progName, setProgName] = useState('');
  const [progDesc, setProgDesc] = useState('');
  const [programError, setProgramError] = useState('');

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
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Actif</span>;
      case 'planned':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">Planifié</span>;
      case 'on_hold':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">En pause</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Terminé</span>;
      case 'archived':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">Archivé</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">Annulé</span>;
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

  // Fetch All Projects (with computed real metrics)
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects');
      if (!res.ok) throw new Error('Erreur chargement projets');
      return res.json();
    },
  });

  // Create Program Mutation
  const createProgramMutation = useMutation({
    mutationFn: async (newProg: { code: string; name: string; description?: string }) => {
      const res = await fetch('/api/v1/projects/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProg),
      });
      return parseApiResponse(res, 'Erreur lors de la création du programme');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setShowProgramModal(false);
      setProgCode('');
      setProgName('');
      setProgDesc('');
    },
    onError: (err: any) => setProgramError(err.message),
  });

  // Create Project Mutation
  const createProjectMutation = useMutation({
    mutationFn: async (payload: {
      code: string;
      name: string;
      programId?: string | null;
      grantId?: string | null;
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

  // Computed Global Dashboard KPIs
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

    return {
      totalProjects,
      activeProjects,
      totalPrograms,
      totalBudget,
      totalExpenses,
      budgetExecutionRate,
      averageProgress,
      totalTasks,
      completedTasks,
      blockedTasks,
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

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => setShowProgramModal(true)}>
              <Layers className="mr-2 h-4 w-4 text-indigo-600" />
              Nouveau Programme
            </Button>

            <Button onClick={() => setShowProjectModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Projet Autonome
            </Button>
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

        {/* TAB 1: EXECUTIVE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Projets Actifs */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projets Actifs</span>
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-slate-900">{dashboardKpis.activeProjects}</span>
                  <span className="text-xs text-slate-400">/ {dashboardKpis.totalProjects} projets</span>
                </div>
                <div className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {dashboardKpis.totalPrograms} programme(s) structuré(s)
                </div>
              </div>

              {/* Avancement Global */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avancement Moyen</span>
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-emerald-600">{dashboardKpis.averageProgress}%</span>
                  <span className="text-xs text-slate-400">taux d'achèvement</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${dashboardKpis.averageProgress}%` }}
                  />
                </div>
              </div>

              {/* Budget Global Engagé & Consommé */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget Global</span>
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-slate-900">{formatCurrency(dashboardKpis.totalExpenses)}</span>
                  <span className="text-xs text-slate-500">alloué : {formatCurrency(dashboardKpis.totalBudget)}</span>
                </div>
                <div className="text-xs font-medium text-slate-600 flex justify-between">
                  <span>Exécution :</span>
                  <span className={dashboardKpis.budgetExecutionRate > 100 ? 'text-red-600 font-bold' : 'text-slate-800'}>
                    {dashboardKpis.budgetExecutionRate}%
                  </span>
                </div>
              </div>

              {/* Tâches & Alertes */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tâches & Alertes</span>
                  <div className={`p-2 rounded-lg ${dashboardKpis.blockedTasks > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
                    {dashboardKpis.blockedTasks > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-slate-900">{dashboardKpis.completedTasks}</span>
                  <span className="text-xs text-slate-400">/ {dashboardKpis.totalTasks} tâches finies</span>
                </div>
                <div>
                  {dashboardKpis.blockedTasks > 0 ? (
                    <span className="inline-flex items-center text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      ⚠️ {dashboardKpis.blockedTasks} tâche(s) bloquée(s)
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-600 font-medium">✓ Aucun blocage signalé</span>
                  )}
                </div>
              </div>
            </div>

            {/* Performance par Programme */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Performance par Programme d'Intervention</h2>
                  <p className="text-xs text-slate-500">Progression moyenne et suivi budgétaire agrégé</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActiveTab('programs')}>
                  Voir tous les programmes
                </Button>
              </div>

              {programs.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 italic">
                  Aucun programme enregistré. Créez votre premier programme pour organiser vos projets.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {programs.map((prog: any) => (
                    <div key={prog.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded uppercase">
                            {prog.code}
                          </span>
                          <h3 className="font-bold text-sm text-slate-900 mt-1">{prog.name}</h3>
                        </div>
                        <Badge variant="default" className="bg-slate-800 text-white text-xs">
                          {prog.projectsCount || 0} projet(s)
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-600">Avancement global</span>
                          <span className="text-indigo-600 font-bold">{prog.metrics?.overallProgress || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${prog.metrics?.overallProgress || 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                        <span>Budget : {formatCurrency(prog.metrics?.totalExpenses || 0)} / {formatCurrency(prog.metrics?.totalBudget || 0)}</span>
                        {prog.metrics?.blockedTasks > 0 && (
                          <span className="text-red-600 font-semibold">{prog.metrics.blockedTasks} blocage(s)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Projets Récents avec Accès Direct */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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

        {/* TAB 2: PROGRAMS LIST */}
        {activeTab === 'programs' && (
          <div className="space-y-6">
            {programs.length === 0 ? (
              <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
                <Layers className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-800">Aucun programme créé</p>
                <p className="text-xs text-slate-500 mt-1">
                  Créez votre premier programme et associez-y des projets créés dans votre catalogue.
                </p>
                <Button className="mt-4" onClick={() => setShowProgramModal(true)}>
                  Créer un programme
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {programs.map((prog: any) => (
                  <div key={prog.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    {/* Program Header Banner */}
                    <div className="bg-slate-900 text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start space-x-3.5">
                        <div className="rounded-xl bg-indigo-500/20 p-2.5 text-amber-400 border border-indigo-500/30 shrink-0">
                          <Layers className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full font-bold uppercase">
                              {prog.code}
                            </span>
                            <h2 className="font-bold text-lg text-white">{prog.name}</h2>
                          </div>
                          {prog.description && <p className="text-xs text-slate-300 mt-1">{prog.description}</p>}
                        </div>
                      </div>

                      <div className="flex items-center flex-wrap gap-3">
                        <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200 space-x-2">
                          <span className="text-slate-400">Progression :</span>
                          <span className="font-bold text-amber-400">{prog.metrics?.overallProgress || 0}%</span>
                        </div>
                        <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200 space-x-2">
                          <span className="text-slate-400">Budget :</span>
                          <span className="font-bold text-emerald-400">{formatCurrency(prog.metrics?.totalExpenses || 0)}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setActiveProgramForAttach(prog);
                            setShowAttachModal(true);
                          }}
                          className="text-xs shadow-sm font-semibold"
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Ajouter un projet existant
                        </Button>
                      </div>
                    </div>

                    {/* Associated Projects Table */}
                    {!prog.projects || prog.projects.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 italic">
                        Aucun projet rattaché à ce programme. Cliquez sur "Ajouter un projet existant" pour composer votre programme.
                      </div>
                    ) : (
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                          <tr>
                            <th className="px-6 py-3">Code Projet</th>
                            <th className="px-6 py-3">Nom du Projet</th>
                            <th className="px-6 py-3">Avancement WBS</th>
                            <th className="px-6 py-3">Tâches (Finies/Total)</th>
                            <th className="px-6 py-3">Dépenses / Budget</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
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
                ))}
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

      {/* Modal: Create Program */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Créer un Nouveau Programme</h2>

            {programError && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{programError}</div>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setProgramError('');
                createProgramMutation.mutate({ code: progCode, name: progName, description: progDesc });
              }}
              className="space-y-4"
            >
              <Input
                label="Code Programme (Ex: PROG-INCLUSION)"
                value={progCode}
                onChange={(e) => setProgCode(e.target.value)}
                placeholder="PROG-01"
                required
              />

              <Input
                label="Nom du Programme"
                value={progName}
                onChange={(e) => setProgName(e.target.value)}
                placeholder="Ex: Programme d'Insertion et Développement Communautaire"
                required
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full rounded-md border p-2 text-sm bg-white h-20"
                  value={progDesc}
                  onChange={(e) => setProgDesc(e.target.value)}
                  placeholder="Objectifs et cadre du programme..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" type="button" onClick={() => setShowProgramModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createProgramMutation.isPending}>
                  {createProgramMutation.isPending ? 'Création...' : 'Créer le programme'}
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

                if (selectedGrantId.startsWith('grant:')) {
                  effectiveGrantId = selectedGrantId.replace('grant:', '');
                  const g = (grants as any[]).find((item: any) => item.id === effectiveGrantId);
                  if (g) {
                    effectiveDonorName = g.funderName;
                  }
                } else if (selectedGrantId === 'internal') {
                  effectiveDonorName = 'Fonds Propres / Autofinancement';
                }

                createProjectMutation.mutate({
                  code: code.trim().toUpperCase(),
                  name: name.trim(),
                  programId: programId ? programId : null,
                  grantId: effectiveGrantId,
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
                          Bailleur / Subvention rattachée
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
                          {grants.length > 0 && (
                            <optgroup label="🏛️ Subventions & Bailleurs enregistrés">
                              {grants.map((g: any) => (
                                <option key={g.id} value={`grant:${g.id}`}>
                                  {g.funderName} — {g.title} ({g.awardedAmount ? `${formatCurrency(g.awardedAmount)} CAD` : 'En demande'})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="💼 Autofinancement">
                            <option value="internal">💼 Fonds Propres / Autofinancement interne</option>
                          </optgroup>
                        </select>
                        <p className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Sélectionnez un bailleur existant issu de vos dossiers de subvention.</span>
                          <button
                            type="button"
                            onClick={() => navigate('/grants')}
                            className="text-indigo-600 hover:underline font-medium"
                          >
                            Gérer les subventions →
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
