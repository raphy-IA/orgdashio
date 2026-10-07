import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  Landmark,
  Plus,
  TrendingUp,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  Search,
  Filter,
  FileText,
  ChevronRight,
  ExternalLink,
  Percent,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';

type TabKey = 'all' | 'pipeline' | 'deliverables' | 'installments';

export function GrantListScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterFunderType, setFilterFunderType] = useState('ALL');
  const [filterProject, setFilterProject] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [funderName, setFunderName] = useState('');
  const [funderType, setFunderType] = useState<
    'federal' | 'provincial' | 'municipal' | 'foundation' | 'corporate' | 'other'
  >('foundation');
  const [programName, setProgramName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState<
    'prospect' | 'drafting' | 'submitted' | 'approved' | 'rejected' | 'closed'
  >('prospect');
  const [requestedAmount, setRequestedAmount] = useState(50000);
  const [awardedAmount, setAwardedAmount] = useState(0);
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Queries
  const { data: grants = [], isLoading: isGrantsLoading } = useQuery({
    queryKey: ['grants'],
    queryFn: async () => {
      const res = await fetch('/api/v1/grants');
      if (!res.ok) throw new Error('Erreur de chargement des subventions');
      return res.json();
    },
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['grantsDashboard'],
    queryFn: async () => {
      const res = await fetch('/api/v1/grants/dashboard');
      if (!res.ok) return null;
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

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de la création');
      }
      return res.json();
    },
    onSuccess: (newGrant) => {
      queryClient.invalidateQueries({ queryKey: ['grants'] });
      queryClient.invalidateQueries({ queryKey: ['grantsDashboard'] });
      setShowModal(false);
      resetForm();
      setSuccessMsg('Dossier de subvention créé avec succès.');
      navigate(`/grants/${newGrant.id}`);
    },
    onError: (err: any) => setError(err.message),
  });

  const resetForm = () => {
    setCode('');
    setTitle('');
    setFunderName('');
    setFunderType('foundation');
    setProgramName('');
    setProjectId('');
    setStatus('prospect');
    setRequestedAmount(50000);
    setAwardedAmount(0);
    setSubmissionDeadline('');
    setStartDate('');
    setEndDate('');
    setNotes('');
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Accordée
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
            <Clock className="w-3 h-3 mr-1" /> Déposée (En étude)
          </span>
        );
      case 'drafting':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <FileText className="w-3 h-3 mr-1" /> En rédaction
          </span>
        );
      case 'prospect':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            <Sparkles className="w-3 h-3 mr-1" /> Prospection
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <AlertCircle className="w-3 h-3 mr-1" /> Non retenue
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            Clôturée
          </span>
        );
      default:
        return <Badge variant="secondary">{st}</Badge>;
    }
  };

  const getFunderTypeBadge = (ft: string) => {
    switch (ft) {
      case 'federal':
        return <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">Fédéral (Canada)</span>;
      case 'provincial':
        return <span className="text-[10px] uppercase font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">Provincial (Québec)</span>;
      case 'municipal':
        return <span className="text-[10px] uppercase font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Municipal / Ville</span>;
      case 'foundation':
        return <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Fondation Philanthropique</span>;
      case 'corporate':
        return <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Entreprise / Mécénat</span>;
      default:
        return <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded">Autre</span>;
    }
  };

  // Filtered grants
  const filteredGrants = grants.filter((g: any) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.funderName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || g.status === filterStatus;
    const matchesFunderType = filterFunderType === 'ALL' || g.funderType === filterFunderType;
    const matchesProject = filterProject === 'ALL' || g.projectId === filterProject;
    return matchesSearch && matchesStatus && matchesFunderType && matchesProject;
  });

  const urgentDeliverables = dashboardData?.urgentDeliverables || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Module GRN • R2.1
              </span>
              <span className="text-xs text-slate-400">Financements & Reddition de comptes</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Gestion des Subventions & Bailleurs</h1>
            <p className="text-sm text-slate-500">
              Pipeline des demandes, échéancier des versements et suivi des livrables de subventions
            </p>
          </div>

          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Nouvelle subvention
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-500 font-bold">
              ✕
            </button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex justify-between items-center">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Executive KPI Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Accordé (Actif)
              </span>
              <Award className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {(dashboardData?.totalAwarded ?? 0).toLocaleString('fr-CA')} $
              </span>
              <span className="text-xs text-slate-400">CAD</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-sky-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pipeline en cours
              </span>
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {(dashboardData?.totalRequested ?? 0).toLocaleString('fr-CA')} $
              </span>
              <span className="text-xs text-slate-400">CAD demandé</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-indigo-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Taux de Succès
              </span>
              <Percent className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {dashboardData?.winRate?.winRatePct ?? 0}%
              </span>
              <span className="text-xs text-slate-500">
                {dashboardData?.winRate?.wonCount ?? 0} retenues sur {dashboardData?.winRate?.totalDecided ?? 0}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Livrables Urgents
              </span>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{urgentDeliverables.length}</span>
              <span className="text-xs text-slate-500">rapports &lt; 30 jours ou en retard</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-slate-200 p-1 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Landmark className="w-4 h-4" /> Toutes les Subventions ({grants.length})
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'pipeline'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" /> Pipeline & Entonnoir
          </button>
          <button
            onClick={() => setActiveTab('deliverables')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'deliverables'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" /> Calendrier des Livrables ({urgentDeliverables.length})
          </button>
        </div>

        {/* TAB 1: TOUTES LES SUBVENTIONS */}
        {activeTab === 'all' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, code ou bailleur..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="ALL">Tous statuts</option>
                  <option value="prospect">Prospection</option>
                  <option value="drafting">En rédaction</option>
                  <option value="submitted">Déposée</option>
                  <option value="approved">Accordée</option>
                  <option value="rejected">Non retenue</option>
                  <option value="closed">Clôturée</option>
                </select>

                <select
                  value={filterFunderType}
                  onChange={(e) => setFilterFunderType(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="ALL">Tous types de bailleurs</option>
                  <option value="federal">Fédéral</option>
                  <option value="provincial">Provincial</option>
                  <option value="municipal">Municipal</option>
                  <option value="foundation">Fondation</option>
                  <option value="corporate">Entreprise</option>
                  <option value="other">Autre</option>
                </select>

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
              </div>
            </div>

            {/* Grants List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {isGrantsLoading ? (
                <div className="p-8 text-center text-slate-500">Chargement des subventions...</div>
              ) : filteredGrants.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Landmark className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-slate-600 font-medium">Aucun dossier de subvention trouvé</p>
                  <Button
                    onClick={() => {
                      resetForm();
                      setShowModal(true);
                    }}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Créer un dossier
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredGrants.map((grant: any) => (
                    <div
                      key={grant.id}
                      onClick={() => navigate(`/grants/${grant.id}`)}
                      className="p-5 hover:bg-slate-50 cursor-pointer transition space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              {grant.code}
                            </span>
                            {getFunderTypeBadge(grant.funderType)}
                            {getStatusBadge(grant.status)}
                            {grant.project && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" /> {grant.project.name}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                            {grant.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Bailleur : <strong className="text-slate-700">{grant.funderName}</strong>
                            {grant.programName && ` • Programme : ${grant.programName}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-right">
                          <div>
                            <span className="text-xs text-slate-400 block font-medium">
                              {grant.status === 'approved' || grant.status === 'closed'
                                ? 'Montant Octroyé'
                                : 'Montant Demandé'}
                            </span>
                            <span className="text-lg font-black text-slate-900">
                              {Number(
                                grant.status === 'approved' || grant.status === 'closed'
                                  ? grant.awardedAmount
                                  : grant.requestedAmount
                              ).toLocaleString('fr-CA')}{' '}
                              $ CAD
                            </span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>

                      {/* Financial Progress & Deliverables tags */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                          <span>
                            Versements : <strong>{grant.totalInstallments} tranches</strong> (
                            {grant.installmentProgress?.collectionRatePct ?? 0}% encaissé)
                          </span>
                          <span>
                            Livrables : <strong>{grant.totalDeliverables} rapports</strong>
                          </span>
                        </div>
                        {grant.submissionDeadline && (
                          <span className="text-slate-600 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500" /> Dépôt limite :{' '}
                            {new Date(grant.submissionDeadline).toLocaleDateString('fr-CA')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PIPELINE KANBAN */}
        {activeTab === 'pipeline' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
            {/* Colonne 1: Prospection & Rédaction */}
            <div className="bg-slate-100 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase">
                <span>1. En Préparation</span>
                <span className="bg-slate-200 px-2 py-0.5 rounded">
                  {grants.filter((g: any) => g.status === 'prospect' || g.status === 'drafting').length}
                </span>
              </div>
              <div className="space-y-3">
                {grants
                  .filter((g: any) => g.status === 'prospect' || g.status === 'drafting')
                  .map((g: any) => (
                    <div
                      key={g.id}
                      onClick={() => navigate(`/grants/${g.id}`)}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow cursor-pointer space-y-2 text-xs"
                    >
                      <div className="flex justify-between">
                        <span className="font-mono font-bold text-slate-800">{g.code}</span>
                        {getStatusBadge(g.status)}
                      </div>
                      <h4 className="font-bold text-slate-900">{g.title}</h4>
                      <p className="text-slate-500">{g.funderName}</p>
                      <div className="pt-2 border-t border-slate-100 font-black text-slate-900">
                        {Number(g.requestedAmount).toLocaleString('fr-CA')} $ CAD
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Colonne 2: Déposée (En étude) */}
            <div className="bg-sky-50 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-sky-900 uppercase">
                <span>2. Déposée / En étude</span>
                <span className="bg-sky-200 px-2 py-0.5 rounded">
                  {grants.filter((g: any) => g.status === 'submitted').length}
                </span>
              </div>
              <div className="space-y-3">
                {grants
                  .filter((g: any) => g.status === 'submitted')
                  .map((g: any) => (
                    <div
                      key={g.id}
                      onClick={() => navigate(`/grants/${g.id}`)}
                      className="bg-white p-4 rounded-xl border border-sky-200 shadow-sm hover:shadow cursor-pointer space-y-2 text-xs"
                    >
                      <div className="flex justify-between">
                        <span className="font-mono font-bold text-slate-800">{g.code}</span>
                        {getStatusBadge(g.status)}
                      </div>
                      <h4 className="font-bold text-slate-900">{g.title}</h4>
                      <p className="text-slate-500">{g.funderName}</p>
                      <div className="pt-2 border-t border-slate-100 font-black text-sky-700">
                        {Number(g.requestedAmount).toLocaleString('fr-CA')} $ CAD
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Colonne 3: Accordée / En exécution */}
            <div className="bg-emerald-50 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-900 uppercase">
                <span>3. Accordée (Active)</span>
                <span className="bg-emerald-200 px-2 py-0.5 rounded">
                  {grants.filter((g: any) => g.status === 'approved').length}
                </span>
              </div>
              <div className="space-y-3">
                {grants
                  .filter((g: any) => g.status === 'approved')
                  .map((g: any) => (
                    <div
                      key={g.id}
                      onClick={() => navigate(`/grants/${g.id}`)}
                      className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm hover:shadow cursor-pointer space-y-2 text-xs"
                    >
                      <div className="flex justify-between">
                        <span className="font-mono font-bold text-slate-800">{g.code}</span>
                        {getStatusBadge(g.status)}
                      </div>
                      <h4 className="font-bold text-slate-900">{g.title}</h4>
                      <p className="text-slate-500">{g.funderName}</p>
                      <div className="pt-2 border-t border-slate-100 font-black text-emerald-700">
                        {Number(g.awardedAmount).toLocaleString('fr-CA')} $ CAD
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Colonne 4: Clôturée ou Non retenue */}
            <div className="bg-slate-100 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase">
                <span>4. Terminée / Clôturée</span>
                <span className="bg-slate-200 px-2 py-0.5 rounded">
                  {grants.filter((g: any) => g.status === 'closed' || g.status === 'rejected').length}
                </span>
              </div>
              <div className="space-y-3">
                {grants
                  .filter((g: any) => g.status === 'closed' || g.status === 'rejected')
                  .map((g: any) => (
                    <div
                      key={g.id}
                      onClick={() => navigate(`/grants/${g.id}`)}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow cursor-pointer space-y-2 text-xs opacity-80"
                    >
                      <div className="flex justify-between">
                        <span className="font-mono font-bold text-slate-800">{g.code}</span>
                        {getStatusBadge(g.status)}
                      </div>
                      <h4 className="font-bold text-slate-900">{g.title}</h4>
                      <p className="text-slate-500">{g.funderName}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CALENDRIER DES LIVRABLES & REDDITION DE COMPTES */}
        {activeTab === 'deliverables' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" /> Échéances de Reddition de Comptes Bailleurs
            </h3>
            <p className="text-xs text-slate-500">
              Surveillance proactive des rapports d'étape, bilans narratifs et redditions financières
            </p>

            {urgentDeliverables.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                Aucun livrable critique ou en retard actuellement.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {urgentDeliverables.map((deliv: any) => (
                  <div key={deliv.id} className="py-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {deliv.grantCode}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{deliv.grantTitle}</span>
                        {deliv.urgency === 'overdue' ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-xs">
                            En retard
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-xs">
                            Échéance &lt; 30 jours
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{deliv.title}</h4>
                      <p className="text-xs text-slate-500">
                        Bailleur : {deliv.funderName} • Type : {deliv.deliverableType}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-xs text-slate-500 block">Date d'échéance</span>
                      <span className="text-sm font-bold text-slate-900">
                        {new Date(deliv.dueDate).toLocaleDateString('fr-CA')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL CRÉER SUBVENTION */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full space-y-4 my-8 max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Nouveau Dossier de Subvention (GRN-01)</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xl"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setError('');
                  createMutation.mutate({
                    code,
                    title,
                    funderName,
                    funderType,
                    programName: programName || undefined,
                    projectId: projectId || undefined,
                    status,
                    requestedAmount: Number(requestedAmount),
                    awardedAmount: status === 'approved' ? Number(awardedAmount) : 0,
                    submissionDeadline: submissionDeadline || undefined,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    notes: notes || undefined,
                  });
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Code (ex. SUBV-2026-001)</label>
                    <Input value={code} onChange={(e) => setCode(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Type de Bailleur</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white mt-1"
                      value={funderType}
                      onChange={(e: any) => setFunderType(e.target.value)}
                    >
                      <option value="foundation">Fondation Philanthropique</option>
                      <option value="federal">Fédéral (Canada / GAC / IRCC)</option>
                      <option value="provincial">Provincial (Québec)</option>
                      <option value="municipal">Municipal / Ville</option>
                      <option value="corporate">Entreprise / Mécénat</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Intitulé du Projet / Dossier de Subvention</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Nom du Bailleur (ex. Centraide)</label>
                    <Input value={funderName} onChange={(e) => setFunderName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Programme de Financement</label>
                    <Input value={programName} onChange={(e) => setProgramName(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Projet rattaché</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white mt-1"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                    >
                      <option value="">Aucun (Non rattaché)</option>
                      {projects.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Statut du Dossier</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white mt-1"
                      value={status}
                      onChange={(e: any) => setStatus(e.target.value)}
                    >
                      <option value="prospect">Prospection (Veille)</option>
                      <option value="drafting">En rédaction</option>
                      <option value="submitted">Déposée (En étude)</option>
                      <option value="approved">Accordée (En cours)</option>
                      <option value="rejected">Non retenue</option>
                      <option value="closed">Clôturée</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Montant Demandé ($ CAD)</label>
                    <Input
                      type="number"
                      value={requestedAmount}
                      onChange={(e) => setRequestedAmount(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Montant Octroyé ($ CAD si accordé)</label>
                    <Input
                      type="number"
                      value={awardedAmount}
                      onChange={(e) => setAwardedAmount(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Date limite de dépôt</label>
                    <Input
                      type="date"
                      value={submissionDeadline}
                      onChange={(e) => setSubmissionDeadline(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Début de la période</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Fin de la période</label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Notes & Alignement stratégique</label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Création...' : 'Créer le dossier'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
