import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Badge } from '@orgdashio/ui';
import {
  Users,
  Target,
  BarChart2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Download,
  Building2,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';

export function ImpactDashboardScreen() {
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['impactDashboard'],
    queryFn: async () => {
      const res = await fetch('/api/v1/indicators/dashboard');
      if (!res.ok) throw new Error('Erreur de chargement du tableau de bord d’impact');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="p-8 text-center text-slate-500">Chargement du tableau de bord d'impact...</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="p-8 text-center text-rose-500">Erreur lors de la récupération des données</div>
      </div>
    );
  }

  const {
    totalIndicators,
    totalProjects,
    uniquePartiesReached,
    averageProgressPct,
    healthCounts = { exceeded: 0, on_track: 0, warning: 0, off_track: 0 },
    globalDisaggregations = {},
    indicators = [],
  } = dashboard;

  const handleExportCsv = () => {
    window.open('/api/v1/indicators/donor-report?format=csv', '_blank');
  };

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

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                Module IND • Impact 360°
              </span>
              <span className="text-xs text-slate-400">Mesure des résultats R1B.2</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Tableau de Bord d’Impact & Résultats</h1>
            <p className="text-sm text-slate-500">
              Synthèse exécutive de la performance, de la portée des bénéficiaires et de la conformité bailleurs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="w-4 h-4 mr-2" /> Exporter Rapport LogFrame
            </Button>
            <Button onClick={() => navigate('/indicators')}>
              <Target className="w-4 h-4 mr-2" /> Gérer les indicateurs
            </Button>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-indigo-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Personnes Atteintes (Sans doublon)
              </span>
              <Users className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-slate-900">{uniquePartiesReached}</p>
            <p className="text-xs text-slate-500">Bénéficiaires uniques consolidés (IND-05)</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Avancement Moyen
              </span>
              <BarChart2 className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-slate-900">{averageProgressPct}%</p>
            <p className="text-xs text-slate-500">Progression globale Cibles / Réalisations</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Indicateurs Actifs
              </span>
              <Target className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-slate-900">{totalIndicators}</p>
            <div className="flex gap-1.5 text-[11px] font-bold">
              <span className="text-emerald-700">{healthCounts.on_track + healthCounts.exceeded} OK</span> •
              <span className="text-amber-700">{healthCounts.warning} Alerte</span> •
              <span className="text-rose-700">{healthCounts.off_track} Retard</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-sky-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Projets Sous Suivi
              </span>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-slate-900">{totalProjects}</p>
            <p className="text-xs text-slate-500">Projets avec cadre logique</p>
          </div>
        </div>

        {/* Global Disaggregations Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> Profil par Genre (ACS+)
            </h3>
            <div className="space-y-2">
              {Object.entries(globalDisaggregations.gender || { femme: 0, homme: 0, non_binaire: 0 }).map(
                ([k, v]: [string, any]) => (
                  <div key={k} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-xs">
                    <span className="font-medium text-slate-700 capitalize">{k.replace('_', ' ')}</span>
                    <span className="font-bold text-slate-900">{v}</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" /> Statut d'Immigration (IRCC)
            </h3>
            <div className="space-y-2">
              {Object.entries(
                globalDisaggregations.immigrationStatus || {
                  resident_permanent: 0,
                  refugie: 0,
                  citoyen: 0,
                }
              ).map(([k, v]: [string, any]) => (
                <div key={k} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-xs">
                  <span className="font-medium text-slate-700 capitalize">{k.replace('_', ' ')}</span>
                  <span className="font-bold text-slate-900">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" /> Répartition Régionale
            </h3>
            <div className="space-y-2">
              {Object.entries(
                globalDisaggregations.region || {
                  montreal: 0,
                  laval: 0,
                  monteregie: 0,
                }
              ).map(([k, v]: [string, any]) => (
                <div key={k} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-xs">
                  <span className="font-medium text-slate-700 capitalize">{k.replace('_', ' ')}</span>
                  <span className="font-bold text-slate-900">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Synthesis List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Synthèse des Indicateurs Majeurs</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/indicators')}>
              Voir tout ({indicators.length}) <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {indicators.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucun indicateur rattaché pour l'instant.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {indicators.slice(0, 8).map((ind: any) => (
                <div key={ind.id} className="py-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {ind.code}
                      </span>
                      <Badge variant="secondary">{ind.level}</Badge>
                      {getHealthBadge(ind.health)}
                    </div>
                    <h4 className="font-medium text-slate-900">{ind.name}</h4>
                    <p className="text-xs text-slate-500">
                      Réel : {ind.actualValue} {ind.unit} / Cible : {ind.targetValue} {ind.unit}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-sm font-bold text-indigo-600">{ind.progressPct}%</span>
                    <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${Math.min(ind.progressPct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
