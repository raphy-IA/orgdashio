import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  FolderKanban,
  FileCheck2,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';

export function ImpactDashboardScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');

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

  const filteredIndicators = indicators.filter((ind: any) => {
    if (projectFilter !== 'all' && ind.projectName !== projectFilter) return false;
    if (levelFilter !== 'all' && ind.level !== levelFilter) return false;
    if (healthFilter !== 'all' && ind.health !== healthFilter) return false;
    return true;
  });

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
                {t('indicators.title')}
              </span>
              <span className="text-xs text-slate-400">{t('indicators.dashboard')}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{t('indicators.dashboard')}</h1>
            <p className="text-sm text-slate-500">
              {t('indicators.name')} • {t('indicators.target')} • {t('indicators.actual')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="w-4 h-4 mr-2" /> {t('common.export')} CSV
            </Button>
            <Button onClick={() => navigate('/indicators')}>
              <Target className="w-4 h-4 mr-2" /> {t('indicators.createIndicator')}
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

        {/* Filter Toolbar & Projects Multi-criteria */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-600" /> Filtrer le tableau de bord d'impact
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white"
              >
                <option value="all">Tous les projets</option>
                {Array.from(new Set(indicators.map((i: any) => i.projectName).filter(Boolean))).map((pName: any) => (
                  <option key={pName} value={pName}>{pName}</option>
                ))}
              </select>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white"
              >
                <option value="all">Tous les niveaux (GAR / RBM)</option>
                <option value="impact">🎯 Impact (Effets à long terme)</option>
                <option value="outcome">📈 Outcome (Effets intermédiaires)</option>
                <option value="output">📦 Output (Extrants & Livrables)</option>
              </select>

              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white"
              >
                <option value="all">Toutes les performances</option>
                <option value="exceeded">🚀 Objectif dépassé (&gt; 110%)</option>
                <option value="on_track">✅ En bonne voie (90 - 110%)</option>
                <option value="warning">⚠️ Vigilance (70 - 89%)</option>
                <option value="off_track">🛑 En retard (&lt; 70%)</option>
              </select>
            </div>
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

          {filteredIndicators.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucun indicateur correspondant aux filtres sélectionnés.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredIndicators.map((ind: any) => (
                <div key={ind.id} className="py-4 flex justify-between items-center hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {ind.code}
                      </span>
                      <Badge variant="secondary">{ind.level}</Badge>
                      {getHealthBadge(ind.health)}
                      {ind.projectName && (
                        <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-medium">
                          {ind.projectName}
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-slate-900">{ind.name}</h4>
                    {ind.resultNodeTitle && (
                      <p className="text-xs text-slate-500 italic">
                        ↳ Objectif RBM : {ind.resultNodeTitle}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 font-medium">
                      Réel : <strong className="text-slate-900">{ind.actualValue} {ind.unit}</strong> / Cible : <strong className="text-slate-700">{ind.targetValue} {ind.unit}</strong>
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-sm font-bold text-indigo-600">{ind.progressPct}%</span>
                    <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
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
