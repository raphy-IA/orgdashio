import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Download,
  Filter,
  Search,
  Layers,
  PieChart as PieChartIcon,
  BarChart3,
  FileSpreadsheet,
  FolderTree,
  Edit2,
  Trash2,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Info,
  Building2,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';

type TabKey = 'catalog' | 'logframe' | 'disaggregation' | 'donor_reports';

export function IndicatorListScreen() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('ALL');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterHealth, setFilterHealth] = useState('ALL');

  // Indicator Modal State
  const [showIndModal, setShowIndModal] = useState(false);
  const [isEditingInd, setIsEditingInd] = useState(false);
  const [editingIndId, setEditingIndId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [resultNodeId, setResultNodeId] = useState('');
  const [level, setLevel] = useState<'impact' | 'outcome' | 'output' | 'activity'>('output');
  const [unit, setUnit] = useState('personnes');
  const [baselineValue, setBaselineValue] = useState(0);
  const [targetValue, setTargetValue] = useState(100);
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'annual' | 'total'>('quarterly');
  const [meansOfVerification, setMeansOfVerification] = useState('');
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([
    'gender',
    'ageGroup',
    'immigrationStatus',
    'region',
  ]);

  // Observation Modal State
  const [showObsModal, setShowObsModal] = useState(false);
  const [selectedInd, setSelectedInd] = useState<any>(null);
  const [periodLabel, setPeriodLabel] = useState('2026-Q1');
  const [recordedValue, setRecordedValue] = useState(0);
  const [notes, setNotes] = useState('');
  const [sourceFileUrl, setSourceFileUrl] = useState('');

  // Disaggregation Inputs
  const [disagGender, setDisagGender] = useState({ femme: 0, homme: 0, non_binaire: 0, autre: 0 });
  const [disagAge, setDisagAge] = useState({ '0_17': 0, '18_29': 0, '30_49': 0, '50_64': 0, '65_plus': 0 });
  const [disagImmigration, setDisagImmigration] = useState({
    citoyen: 0,
    resident_permanent: 0,
    refugie: 0,
    demandeur_asile: 0,
    permis_temporaire: 0,
  });
  const [disagRegion, setDisagRegion] = useState({
    montreal: 0,
    laval: 0,
    monteregie: 0,
    capitale_nationale: 0,
    autre_region: 0,
  });

  // Result Node Modal State
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [nodeProjectId, setNodeProjectId] = useState('');
  const [nodeParentId, setNodeParentId] = useState('');
  const [nodeLevel, setNodeLevel] = useState<'impact' | 'outcome' | 'output'>('outcome');
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeDesc, setNodeDesc] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Queries
  const { data: indicators = [], isLoading: isIndLoading } = useQuery({
    queryKey: ['indicators'],
    queryFn: async () => {
      const res = await fetch('/api/v1/indicators');
      if (!res.ok) throw new Error('Erreur de chargement des indicateurs');
      return res.json();
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: resultNodes = [] } = useQuery({
    queryKey: ['resultNodes'],
    queryFn: async () => {
      const res = await fetch('/api/v1/indicators/result-nodes');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: logframeMatrix } = useQuery({
    queryKey: ['logframeMatrix', filterProject],
    queryFn: async () => {
      const url =
        filterProject !== 'ALL'
          ? `/api/v1/indicators/logframe?projectId=${filterProject}`
          : '/api/v1/indicators/logframe';
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: activeTab === 'logframe' || activeTab === 'donor_reports',
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['impactDashboard'],
    queryFn: async () => {
      const res = await fetch('/api/v1/indicators/dashboard');
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/indicators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de la création de l’indicateur');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
      queryClient.invalidateQueries({ queryKey: ['impactDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['logframeMatrix'] });
      setShowIndModal(false);
      resetIndForm();
      setSuccessMsg('Indicateur créé avec succès.');
    },
    onError: (err: any) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/v1/indicators/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de la mise à jour');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
      queryClient.invalidateQueries({ queryKey: ['impactDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['logframeMatrix'] });
      setShowIndModal(false);
      resetIndForm();
      setSuccessMsg('Indicateur mis à jour.');
    },
    onError: (err: any) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/indicators/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur de suppression');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
      queryClient.invalidateQueries({ queryKey: ['impactDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['logframeMatrix'] });
      setSuccessMsg('Indicateur supprimé.');
    },
    onError: (err: any) => setError(err.message),
  });

  const obsMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/v1/indicators/${id}/observations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de la saisie de l’observation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
      queryClient.invalidateQueries({ queryKey: ['impactDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['logframeMatrix'] });
      setShowObsModal(false);
      resetObsForm();
      setSuccessMsg('Mesure d’observation enregistrée avec succès.');
    },
    onError: (err: any) => setError(err.message),
  });

  const createNodeMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/indicators/result-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de la création du résultat');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultNodes'] });
      queryClient.invalidateQueries({ queryKey: ['logframeMatrix'] });
      setShowNodeModal(false);
      setNodeTitle('');
      setNodeDesc('');
      setSuccessMsg('Nœud de résultat ajouté au cadre logique.');
    },
    onError: (err: any) => setError(err.message),
  });

  const resetIndForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setProjectId('');
    setResultNodeId('');
    setLevel('output');
    setUnit('personnes');
    setBaselineValue(0);
    setTargetValue(100);
    setFrequency('quarterly');
    setMeansOfVerification('');
    setSelectedDimensions(['gender', 'ageGroup', 'immigrationStatus', 'region']);
    setIsEditingInd(false);
    setEditingIndId('');
  };

  const resetObsForm = () => {
    setRecordedValue(0);
    setNotes('');
    setSourceFileUrl('');
    setDisagGender({ femme: 0, homme: 0, non_binaire: 0, autre: 0 });
    setDisagAge({ '0_17': 0, '18_29': 0, '30_49': 0, '50_64': 0, '65_plus': 0 });
    setDisagImmigration({
      citoyen: 0,
      resident_permanent: 0,
      refugie: 0,
      demandeur_asile: 0,
      permis_temporaire: 0,
    });
    setDisagRegion({ montreal: 0, laval: 0, monteregie: 0, capitale_nationale: 0, autre_region: 0 });
  };

  const handleOpenEditInd = (ind: any) => {
    setIsEditingInd(true);
    setEditingIndId(ind.id);
    setCode(ind.code);
    setName(ind.name);
    setDescription(ind.description || '');
    setProjectId(ind.projectId || '');
    setResultNodeId(ind.resultNodeId || '');
    setLevel(ind.level);
    setUnit(ind.unit);
    setBaselineValue(Number(ind.baselineValue));
    setTargetValue(Number(ind.targetValue));
    setFrequency(ind.frequency);
    setMeansOfVerification(ind.meansOfVerification || '');
    setSelectedDimensions(ind.disaggregationDimensions || ['gender', 'ageGroup', 'immigrationStatus']);
    setShowIndModal(true);
  };

  const handleOpenObs = (ind: any) => {
    setSelectedInd(ind);
    setRecordedValue(Number(ind.actualValue));
    resetObsForm();
    setShowObsModal(true);
  };

  const handleDownloadCsv = () => {
    const url =
      filterProject !== 'ALL'
        ? `/api/v1/indicators/donor-report?format=csv&projectId=${filterProject}`
        : '/api/v1/indicators/donor-report?format=csv';
    window.open(url, '_blank');
  };

  // Filtered indicators
  const filteredIndicators = indicators.filter((ind: any) => {
    const matchesSearch =
      ind.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ind.projectName && ind.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesProject = filterProject === 'ALL' || ind.projectId === filterProject;
    const matchesLevel = filterLevel === 'ALL' || ind.level === filterLevel;
    const matchesHealth = filterHealth === 'ALL' || ind.health === filterHealth;
    return matchesSearch && matchesProject && matchesLevel && matchesHealth;
  });

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'exceeded':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3 h-3 mr-1" /> Objectif Dépassé
          </span>
        );
      case 'on_track':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> En bonne voie
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> Vigilance
          </span>
        );
      case 'off_track':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 mr-1" /> En retard
          </span>
        );
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'exceeded':
        return 'bg-blue-600';
      case 'on_track':
        return 'bg-emerald-600';
      case 'warning':
        return 'bg-amber-500';
      case 'off_track':
      default:
        return 'bg-rose-600';
    }
  };

  const globalDisagg = dashboardData?.globalDisaggregations || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                Module IND • R1B.2
              </span>
              <span className="text-xs text-slate-400">Normes GAC / IRCC / Centraide</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Indicateurs & Cadre de Résultats</h1>
            <p className="text-sm text-slate-500">
              Mesure de l'impact, désagrégation multidimensionnelle et suivi des engagements bailleurs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadCsv}>
              <Download className="w-4 h-4 mr-2" /> Exporter Matrice (CSV)
            </Button>
            <Button
              onClick={() => {
                resetIndForm();
                setShowIndModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Nouvel indicateur
            </Button>
          </div>
        </div>

        {/* Alerts & Messages */}
        {error && (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-500 font-bold">
              ✕
            </button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 flex justify-between items-center">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Executive KPI Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-indigo-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Portée Unique Totale
              </span>
              <Users className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {dashboardData?.uniquePartiesReached ?? 0}
              </span>
              <span className="text-xs text-slate-500">bénéficiaires uniques (IND-05)</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Avancement Moyen
              </span>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {dashboardData?.averageProgressPct ?? 0}%
              </span>
              <span className="text-xs text-slate-500">sur {indicators.length} indicateurs</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Santé du Cadre</span>
              <Target className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-bold">
                {dashboardData?.healthCounts?.on_track ?? 0} OK
              </span>
              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-bold">
                {dashboardData?.healthCounts?.warning ?? 0} Alerte
              </span>
              <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded font-bold">
                {dashboardData?.healthCounts?.off_track ?? 0} Retard
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-sky-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Projets & Bailleurs</span>
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{projects.length}</span>
              <span className="text-xs text-slate-500">projets rattachés</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-slate-200 p-1 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'catalog'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" /> Catalogue & Mesures ({indicators.length})
          </button>
          <button
            onClick={() => setActiveTab('logframe')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'logframe'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderTree className="w-4 h-4" /> Cadre Logique (Arbre de Résultats)
          </button>
          <button
            onClick={() => setActiveTab('disaggregation')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'disaggregation'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PieChartIcon className="w-4 h-4" /> Désagrégation Multidimensionnelle
          </button>
          <button
            onClick={() => setActiveTab('donor_reports')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'donor_reports'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Rapports Bailleurs (GAC / Centraide)
          </button>
        </div>

        {/* TAB 1: CATALOGUE & MESURES */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par code, nom ou projet..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="ALL">Tous les projets</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="ALL">Tous niveaux</option>
                  <option value="impact">Impact</option>
                  <option value="outcome">Effet (Outcome)</option>
                  <option value="output">Extrant (Output)</option>
                  <option value="activity">Activité</option>
                </select>

                <select
                  value={filterHealth}
                  onChange={(e) => setFilterHealth(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="ALL">Tous statuts de santé</option>
                  <option value="exceeded">Dépassé</option>
                  <option value="on_track">En bonne voie</option>
                  <option value="warning">Vigilance</option>
                  <option value="off_track">En retard</option>
                </select>
              </div>
            </div>

            {/* Indicator Table / Cards */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {isIndLoading ? (
                <div className="p-8 text-center text-slate-500">Chargement des indicateurs...</div>
              ) : filteredIndicators.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Target className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-slate-600 font-medium">Aucun indicateur trouvé</p>
                  <p className="text-xs text-slate-400">
                    Modifiez vos filtres ou créez votre premier indicateur de performance.
                  </p>
                  <Button
                    onClick={() => {
                      resetIndForm();
                      setShowIndModal(true);
                    }}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Créer un indicateur
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredIndicators.map((ind: any) => (
                    <div key={ind.id} className="p-5 hover:bg-slate-50 transition space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              {ind.code}
                            </span>
                            <span className="text-xs uppercase font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {ind.level}
                            </span>
                            {getHealthBadge(ind.health)}
                            {ind.projectName && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" /> {ind.projectName}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900">{ind.name}</h3>
                          {ind.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">{ind.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleOpenObs(ind)}>
                            <TrendingUp className="w-4 h-4 mr-1.5 text-indigo-600" /> Saisir mesure
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEditInd(ind)}>
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Supprimer l'indicateur ${ind.code} ?`)) {
                                deleteMutation.mutate(ind.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </Button>
                        </div>
                      </div>

                      {/* Performance Bar & Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block font-medium">Ligne de base (Baseline)</span>
                          <span className="font-semibold text-slate-700">
                            {ind.baselineValue} {ind.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Cible visée</span>
                          <span className="font-semibold text-slate-900">
                            {ind.targetValue} {ind.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Réalisé cumulé</span>
                          <span className="font-bold text-slate-900">
                            {ind.actualValue} {ind.unit}{' '}
                            <span
                              className={`ml-1 font-bold ${
                                ind.variancePct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              ({ind.variancePct >= 0 ? `+${ind.variancePct}` : ind.variancePct}%)
                            </span>
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-600">Progression</span>
                            <span className="text-indigo-600">{ind.progressPct}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${getHealthColor(
                                ind.health
                              )}`}
                              style={{ width: `${Math.min(ind.progressPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {ind.meansOfVerification && (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">Preuve / Source :</span> {ind.meansOfVerification}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CADRE LOGIQUE (ARBRE DE RÉSULTATS) */}
        {activeTab === 'logframe' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Matrice du Cadre Logique (LogFrame)</h2>
                <p className="text-xs text-slate-500">
                  Hiérarchie des objectifs : Impact $\rightarrow$ Effets $\rightarrow$ Extrants
                </p>
              </div>
              <Button
                onClick={() => {
                  setNodeProjectId(filterProject !== 'ALL' ? filterProject : (projects[0]?.id || ''));
                  setShowNodeModal(true);
                }}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Ajouter un nœud de résultat
              </Button>
            </div>

            {/* Hierarchy Tree Visual */}
            <div className="space-y-6">
              {/* IMPACT SECTION */}
              <div className="bg-white rounded-xl border border-indigo-200 overflow-hidden shadow-sm">
                <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-xs font-bold">1. IMPACT</span>
                    <h3 className="font-bold text-indigo-950 text-sm">Changements Ultimes & Long Terme</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {logframeMatrix?.impactNodes?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Aucun objectif d'impact formalisé.</p>
                  ) : (
                    logframeMatrix?.impactNodes?.map((node: any) => (
                      <div key={node.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                        <h4 className="font-bold text-slate-900 text-sm">{node.title}</h4>
                        {node.description && <p className="text-xs text-slate-600">{node.description}</p>}
                        {node.indicators?.map((ind: any) => (
                          <div
                            key={ind.id}
                            className="bg-white p-3 rounded border border-slate-200 flex justify-between items-center text-xs"
                          >
                            <span className="font-semibold text-slate-800">
                              [{ind.code}] {ind.name}
                            </span>
                            <div className="flex items-center gap-3">
                              <span>
                                {ind.actualValue} / {ind.targetValue} {ind.unit}
                              </span>
                              {getHealthBadge(ind.health)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* OUTCOME / EFFETS SECTION */}
              <div className="bg-white rounded-xl border border-sky-200 overflow-hidden shadow-sm">
                <div className="bg-sky-50 border-b border-sky-100 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-sky-600 text-white rounded text-xs font-bold">
                      2. EFFETS (OUTCOMES)
                    </span>
                    <h3 className="font-bold text-sky-950 text-sm">Changements Comportementaux & Systémiques</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {logframeMatrix?.outcomeNodes?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Aucun effet intermédiaire formalisé.</p>
                  ) : (
                    logframeMatrix?.outcomeNodes?.map((node: any) => (
                      <div key={node.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                        <h4 className="font-bold text-slate-900 text-sm">{node.title}</h4>
                        {node.description && <p className="text-xs text-slate-600">{node.description}</p>}
                        {node.indicators?.map((ind: any) => (
                          <div
                            key={ind.id}
                            className="bg-white p-3 rounded border border-slate-200 flex justify-between items-center text-xs"
                          >
                            <span className="font-semibold text-slate-800">
                              [{ind.code}] {ind.name}
                            </span>
                            <div className="flex items-center gap-3">
                              <span>
                                {ind.actualValue} / {ind.targetValue} {ind.unit}
                              </span>
                              {getHealthBadge(ind.health)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* OUTPUT / EXTRANTS SECTION */}
              <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden shadow-sm">
                <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-xs font-bold">
                      3. EXTRANTS (OUTPUTS)
                    </span>
                    <h3 className="font-bold text-emerald-950 text-sm">Produits & Services Livrés Directement</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {logframeMatrix?.outputNodes?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Aucun extrant direct formalisé.</p>
                  ) : (
                    logframeMatrix?.outputNodes?.map((node: any) => (
                      <div key={node.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                        <h4 className="font-bold text-slate-900 text-sm">{node.title}</h4>
                        {node.description && <p className="text-xs text-slate-600">{node.description}</p>}
                        {node.indicators?.map((ind: any) => (
                          <div
                            key={ind.id}
                            className="bg-white p-3 rounded border border-slate-200 flex justify-between items-center text-xs"
                          >
                            <span className="font-semibold text-slate-800">
                              [{ind.code}] {ind.name}
                            </span>
                            <div className="flex items-center gap-3">
                              <span>
                                {ind.actualValue} / {ind.targetValue} {ind.unit}
                              </span>
                              {getHealthBadge(ind.health)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DÉSAGRÉGATION MULTIDIMENSIONNELLE (IND-02) */}
        {activeTab === 'disaggregation' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                Ventilation Démographique & Territoriale Globale
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Conformité aux exigences de reddition de comptes sensibles au genre (GBA+ / ACS+) et à l'équité
                territoriale
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Genre */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" /> Répartition par Genre
                </h3>
                <div className="space-y-2">
                  {Object.entries(globalDisagg.gender || { femme: 0, homme: 0, non_binaire: 0, autre: 0 }).map(
                    ([k, v]: [string, any]) => (
                      <div key={k} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-xs">
                        <span className="font-medium text-slate-700 capitalize">{k.replace('_', ' ')}</span>
                        <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                          {v}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Âge */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" /> Groupes d'Âge
                </h3>
                <div className="space-y-2">
                  {Object.entries(
                    globalDisagg.ageGroup || {
                      '0_17': 0,
                      '18_29': 0,
                      '30_49': 0,
                      '50_64': 0,
                      '65_plus': 0,
                    }
                  ).map(([k, v]: [string, any]) => (
                    <div key={k} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-xs">
                      <span className="font-medium text-slate-700">{k.replace('_', '-')} ans</span>
                      <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statut d'immigration */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" /> Statut d'Immigration (IRCC)
                </h3>
                <div className="space-y-2">
                  {Object.entries(
                    globalDisagg.immigrationStatus || {
                      citoyen: 0,
                      resident_permanent: 0,
                      refugie: 0,
                      demandeur_asile: 0,
                      permis_temporaire: 0,
                    }
                  ).map(([k, v]: [string, any]) => (
                    <div key={k} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-xs">
                      <span className="font-medium text-slate-700 capitalize">{k.replace('_', ' ')}</span>
                      <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Régions administratives */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-sky-600" /> Répartition Régionale
                </h3>
                <div className="space-y-2">
                  {Object.entries(
                    globalDisagg.region || {
                      montreal: 0,
                      laval: 0,
                      monteregie: 0,
                      capitale_nationale: 0,
                      autre_region: 0,
                    }
                  ).map(([k, v]: [string, any]) => (
                    <div key={k} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-xs">
                      <span className="font-medium text-slate-700 capitalize">{k.replace('_', ' ')}</span>
                      <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RAPPORTS BAILLEURS (IND-04) */}
        {activeTab === 'donor_reports' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Rapports & Reddition de Comptes Bailleurs
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Format standardisé compatible avec Affaires Mondiales Canada (GAC), IRCC, et Centraide
                </p>
              </div>
              <Button onClick={handleDownloadCsv}>
                <Download className="w-4 h-4 mr-2" /> Exporter en CSV / Excel
              </Button>
            </div>

            {/* Official Report Table Preview */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                    <th className="p-3 font-semibold">Niveau</th>
                    <th className="p-3 font-semibold">Code</th>
                    <th className="p-3 font-semibold">Indicateur</th>
                    <th className="p-3 font-semibold">Unité</th>
                    <th className="p-3 font-semibold text-right">Ligne de base</th>
                    <th className="p-3 font-semibold text-right">Cible</th>
                    <th className="p-3 font-semibold text-right">Réalisé</th>
                    <th className="p-3 font-semibold text-right">Écart (%)</th>
                    <th className="p-3 font-semibold">Santé</th>
                    <th className="p-3 font-semibold">Preuve / Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {indicators.map((ind: any) => (
                    <tr key={ind.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold uppercase text-slate-600">{ind.level}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{ind.code}</td>
                      <td className="p-3 font-medium text-slate-900">{ind.name}</td>
                      <td className="p-3 text-slate-600">{ind.unit}</td>
                      <td className="p-3 text-right font-medium">{ind.baselineValue}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{ind.targetValue}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{ind.actualValue}</td>
                      <td
                        className={`p-3 text-right font-bold ${
                          ind.variancePct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {ind.variancePct >= 0 ? `+${ind.variancePct}` : ind.variancePct}%
                      </td>
                      <td className="p-3">{getHealthBadge(ind.health)}</td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">
                        {ind.meansOfVerification || 'Rapport interne'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL CRÉER / MODIFIER INDICATEUR */}
        {showIndModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full space-y-4 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  {isEditingInd ? 'Modifier l’indicateur' : 'Nouvel Indicateur de Performance (IND-01)'}
                </h3>
                <button
                  onClick={() => setShowIndModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xl"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setError('');
                  const payload = {
                    code,
                    name,
                    description: description || undefined,
                    projectId: projectId || undefined,
                    resultNodeId: resultNodeId || undefined,
                    level,
                    unit,
                    baselineValue: Number(baselineValue),
                    targetValue: Number(targetValue),
                    frequency,
                    meansOfVerification: meansOfVerification || undefined,
                    disaggregationDimensions: selectedDimensions,
                  };

                  if (isEditingInd) {
                    updateMutation.mutate({ id: editingIndId, payload });
                  } else {
                    createMutation.mutate(payload);
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Code (ex. IND-PROJ-01)</label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={isEditingInd}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Niveau du cadre logique</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white mt-1"
                      value={level}
                      onChange={(e: any) => setLevel(e.target.value)}
                    >
                      <option value="impact">Impact (Long terme)</option>
                      <option value="outcome">Effet / Outcome (Moyen terme)</option>
                      <option value="output">Extrant / Output (Court terme)</option>
                      <option value="activity">Activité (Opérationnel)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Intitulé de l'indicateur</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Description détaillée / Définition opérationnelle</label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Projet rattaché (optionnel)</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white mt-1"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                    >
                      <option value="">Aucun (Indicateur transversal)</option>
                      {projects.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Nœud de résultat (Arbre Logique)</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white mt-1"
                      value={resultNodeId}
                      onChange={(e) => setResultNodeId(e.target.value)}
                    >
                      <option value="">Non rattaché à un résultat spécifique</option>
                      {resultNodes.map((n: any) => (
                        <option key={n.id} value={n.id}>
                          [{n.level.toUpperCase()}] {n.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Unité de mesure</label>
                    <Input value={unit} onChange={(e) => setUnit(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Ligne de base (Baseline)</label>
                    <Input
                      type="number"
                      value={baselineValue}
                      onChange={(e) => setBaselineValue(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Cible visée (Target)</label>
                    <Input
                      type="number"
                      value={targetValue}
                      onChange={(e) => setTargetValue(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Fréquence de collecte</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white mt-1"
                      value={frequency}
                      onChange={(e: any) => setFrequency(e.target.value)}
                    >
                      <option value="monthly">Mensuelle</option>
                      <option value="quarterly">Trimestrielle</option>
                      <option value="annual">Annuelle</option>
                      <option value="total">Cumulatif Fin de projet</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Source / Moyens de vérification</label>
                    <Input
                      value={meansOfVerification}
                      onChange={(e) => setMeansOfVerification(e.target.value)}
                      placeholder="ex. Registres de présence, Sondage"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button variant="outline" type="button" onClick={() => setShowIndModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">{isEditingInd ? 'Sauvegarder' : 'Créer l’indicateur'}</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL SAISIR OBSERVATION AVEC DÉSAGRÉGATION (IND-02 & IND-03) */}
        {showObsModal && selectedInd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full space-y-4 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Saisir une mesure d'observation</h3>
                  <p className="text-xs text-slate-500">
                    [{selectedInd.code}] {selectedInd.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowObsModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xl"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setError('');
                  obsMutation.mutate({
                    id: selectedInd.id,
                    payload: {
                      periodLabel,
                      recordedValue: Number(recordedValue),
                      disaggregationData: {
                        gender: disagGender,
                        ageGroup: disagAge,
                        immigrationStatus: disagImmigration,
                        region: disagRegion,
                      },
                      notes: notes || undefined,
                      sourceFileUrl: sourceFileUrl || undefined,
                    },
                  });
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Période de collecte (ex. 2026-Q1)</label>
                    <Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Valeur mesurée totale ({selectedInd.unit})
                    </label>
                    <Input
                      type="number"
                      value={recordedValue}
                      onChange={(e) => setRecordedValue(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                {/* Granular Disaggregation Inputs */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Désagrégation Démographique (IND-02)
                  </h4>

                  {/* Gender */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700">Genre</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500">Femme</span>
                        <Input
                          type="number"
                          value={disagGender.femme}
                          onChange={(e) => setDisagGender({ ...disagGender, femme: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Homme</span>
                        <Input
                          type="number"
                          value={disagGender.homme}
                          onChange={(e) => setDisagGender({ ...disagGender, homme: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Non-binaire</span>
                        <Input
                          type="number"
                          value={disagGender.non_binaire}
                          onChange={(e) => setDisagGender({ ...disagGender, non_binaire: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Autre / NSP</span>
                        <Input
                          type="number"
                          value={disagGender.autre}
                          onChange={(e) => setDisagGender({ ...disagGender, autre: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Age */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700">Tranches d'âge</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500">0-17 ans</span>
                        <Input
                          type="number"
                          value={disagAge['0_17']}
                          onChange={(e) => setDisagAge({ ...disagAge, '0_17': Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">18-29 ans</span>
                        <Input
                          type="number"
                          value={disagAge['18_29']}
                          onChange={(e) => setDisagAge({ ...disagAge, '18_29': Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">30-49 ans</span>
                        <Input
                          type="number"
                          value={disagAge['30_49']}
                          onChange={(e) => setDisagAge({ ...disagAge, '30_49': Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">50-64 ans</span>
                        <Input
                          type="number"
                          value={disagAge['50_64']}
                          onChange={(e) => setDisagAge({ ...disagAge, '50_64': Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">65+ ans</span>
                        <Input
                          type="number"
                          value={disagAge['65_plus']}
                          onChange={(e) => setDisagAge({ ...disagAge, '65_plus': Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Immigration Status */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700">Statut d'immigration (IRCC)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500">Citoyen</span>
                        <Input
                          type="number"
                          value={disagImmigration.citoyen}
                          onChange={(e) =>
                            setDisagImmigration({ ...disagImmigration, citoyen: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Résident Perm.</span>
                        <Input
                          type="number"
                          value={disagImmigration.resident_permanent}
                          onChange={(e) =>
                            setDisagImmigration({
                              ...disagImmigration,
                              resident_permanent: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Réfugié</span>
                        <Input
                          type="number"
                          value={disagImmigration.refugie}
                          onChange={(e) =>
                            setDisagImmigration({ ...disagImmigration, refugie: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Demandeur Asile</span>
                        <Input
                          type="number"
                          value={disagImmigration.demandeur_asile}
                          onChange={(e) =>
                            setDisagImmigration({
                              ...disagImmigration,
                              demandeur_asile: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Permis Temp.</span>
                        <Input
                          type="number"
                          value={disagImmigration.permis_temporaire}
                          onChange={(e) =>
                            setDisagImmigration({
                              ...disagImmigration,
                              permis_temporaire: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Notes & Analyse qualitative</label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Facteurs d'atteinte ou de retard..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button variant="outline" type="button" onClick={() => setShowObsModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Enregistrer la mesure</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL AJOUTER NŒUD DE RÉSULTAT */}
        {showNodeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Ajouter un Nœud de Résultat</h3>
                <button
                  onClick={() => setShowNodeModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xl"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!nodeProjectId) {
                    setError('Veuillez sélectionner un projet');
                    return;
                  }
                  createNodeMutation.mutate({
                    projectId: nodeProjectId,
                    parentId: nodeParentId || undefined,
                    level: nodeLevel,
                    title: nodeTitle,
                    description: nodeDesc || undefined,
                  });
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-xs font-semibold text-slate-700">Projet rattaché</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white mt-1"
                    value={nodeProjectId}
                    onChange={(e) => setNodeProjectId(e.target.value)}
                    required
                  >
                    <option value="">Sélectionner un projet...</option>
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Niveau de résultat</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white mt-1"
                    value={nodeLevel}
                    onChange={(e: any) => setNodeLevel(e.target.value)}
                  >
                    <option value="impact">Impact (Changement ultime)</option>
                    <option value="outcome">Effet / Outcome (Changement intermédiaire)</option>
                    <option value="output">Extrant / Output (Livrable direct)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Titre de l'objectif / Résultat</label>
                  <Input value={nodeTitle} onChange={(e) => setNodeTitle(e.target.value)} required />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Description</label>
                  <Input value={nodeDesc} onChange={(e) => setNodeDesc(e.target.value)} />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <Button variant="outline" type="button" onClick={() => setShowNodeModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Ajouter au cadre</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
