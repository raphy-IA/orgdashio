import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Badge } from '@orgdashio/ui';
import {
  FolderKanban,
  Users,
  GraduationCap,
  ShieldAlert,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
  Building2,
  ShieldCheck,
  Activity,
  HeartHandshake
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export function TenantDashboardScreen() {
  const navigate = useNavigate();

  // Fetch Current User & Tenant Data
  const { data: meData } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      const res = await fetch('/api/v1/auth/me');
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Fetch Tenant Stats / Projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch People
  const { data: people = [] } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const res = await fetch('/api/v1/people');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Impact Stats
  const { data: impactStats } = useQuery({
    queryKey: ['impactDashboard'],
    queryFn: async () => {
      const res = await fetch('/api/v1/indicators/dashboard');
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Fetch Cases
  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const res = await fetch('/api/v1/cases');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const tenantName = meData?.tenant?.name || 'Mon Organisme';
  const userEmail = meData?.user?.email || '';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="mx-auto max-w-7xl w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Welcome Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <span>Espace de Travail Organisme • Tenant Isolé</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Tableau de Bord — {tenantName}
              </h1>
              <p className="mt-1 text-sm text-indigo-100/80 max-w-2xl">
                Bienvenue sur votre console de gestion centralisée. Suivez l'avancement de vos projets, vos bénéficiaires et vos indicateurs d'impact.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/projects')}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold backdrop-blur"
              >
                <FolderKanban className="mr-1.5 h-4 w-4" />
                Voir les projets
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/people')}
                className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold shadow-sm"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Ajouter un bénéficiaire
              </Button>
            </div>
          </div>
        </div>

        {/* Quick KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Projects */}
          <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Projets en cours</span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <FolderKanban className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900">{projects.length}</div>
              <Badge variant="default" className="text-[10px]">Multi-Bailleurs</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500 flex items-center">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-500" />
              Suivi budgétaire & livrables
            </p>
          </div>

          {/* Card 2: Total Reached / Beneficiaries */}
          <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Bénéficiaires & Membres</span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900">{people.length}</div>
              <Badge variant="success" className="text-[10px]">Personnes uniques</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500 flex items-center">
              <HeartHandshake className="mr-1 h-3.5 w-3.5 text-blue-500" />
              Personnes & organismes accompagnés
            </p>
          </div>

          {/* Card 3: Active Cases */}
          <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dossiers de Cas</span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900">{cases.length}</div>
              <Badge variant="secondary" className="text-[10px]">Confidentiel</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500 flex items-center">
              <ShieldCheck className="mr-1 h-3.5 w-3.5 text-amber-600" />
              Chiffrement RLS activé
            </p>
          </div>

          {/* Card 4: Global Impact Score */}
          <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avancement Impact</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900">
                {impactStats?.averageProgressPct ?? 0}%
              </div>
              <Badge variant="success" className="text-[10px]">IND-05 Compliant</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500 flex items-center">
              <Activity className="mr-1 h-3.5 w-3.5 text-emerald-600" />
              Cible d'impact mesurée
            </p>
          </div>
        </div>

        {/* Dynamic Modules Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Main Column: Projects & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Projects List */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <FolderKanban className="h-4 w-4 text-indigo-600" />
                  <h2 className="font-semibold text-slate-900 text-sm">Projets Récents</h2>
                </div>
                <Link to="/projects" className="text-xs text-indigo-600 font-medium hover:underline flex items-center">
                  Tout afficher <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>

              {projects.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <FolderKanban className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm">Aucun projet actif pour le moment.</p>
                  <Button size="sm" className="mt-3" onClick={() => navigate('/projects')}>
                    Créer votre premier projet
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {projects.slice(0, 4).map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{p.title || p.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{p.code || 'PRJ-01'} • {p.status || 'En cours'}</div>
                      </div>
                      <Badge variant="default">Voir détails</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Impact Dashboard Preview */}
            <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <h2 className="font-semibold text-slate-900 text-base">Performance & Mesure d'Impact (IND-05)</h2>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/impact')}>
                  Tableau d'impact complet
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-lg border bg-indigo-50/40 p-4">
                  <div className="text-xs font-semibold text-indigo-900 uppercase">Parties Uniques Atteintes</div>
                  <div className="text-3xl font-extrabold text-indigo-700 mt-2">
                    {impactStats?.uniquePartiesReached ?? 0}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Dédoublonnage automatique sur Formations, Services & Cas</p>
                </div>

                <div className="rounded-lg border bg-emerald-50/40 p-4">
                  <div className="text-xs font-semibold text-emerald-900 uppercase">Indicateurs de Résultats</div>
                  <div className="text-3xl font-extrabold text-emerald-700 mt-2">
                    {impactStats?.totalIndicators ?? 0}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Indicateurs de niveau d'impact suivis</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Links & Sector Modules */}
          <div className="space-y-6">
            {/* Quick Access Menu */}
            <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-slate-900 text-sm flex items-center">
                <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                Accès Rapides & Modules
              </h2>

              <div className="space-y-2">
                <Link
                  to="/training"
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs font-medium text-slate-700"
                >
                  <div className="flex items-center space-x-2.5">
                    <GraduationCap className="h-4 w-4 text-indigo-600" />
                    <span>Catalogue de Formations</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/cases"
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs font-medium text-slate-700"
                >
                  <div className="flex items-center space-x-2.5">
                    <ShieldAlert className="h-4 w-4 text-indigo-600" />
                    <span>Gestion des Cas & Notes</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/indicators"
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs font-medium text-slate-700"
                >
                  <div className="flex items-center space-x-2.5">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                    <span>Indicateurs de Projets</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/settings/organization"
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs font-medium text-slate-700"
                >
                  <div className="flex items-center space-x-2.5">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    <span>Paramètres & Conformité</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* Security & Isolation Status Card */}
            <div className="rounded-xl border bg-slate-900 text-slate-200 p-5 space-y-3 shadow-md">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                <span>Sécurité Multi-Tenant Active</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Toutes vos données (projets, bénéficiaires, budgets) sont isolées au niveau base de données via **PostgreSQL Row Level Security (RLS)**.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Statut Isolation:</span>
                <span className="text-emerald-400 font-bold">100% Étanche</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
