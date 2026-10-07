import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Badge } from '@orgdashio/ui';
import { Users, Target, BarChart2, CheckCircle2, ArrowRight } from 'lucide-react';
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

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="p-8">Chargement du tableau de bord d'impact...</div>
    </div>
  );
  if (!dashboard) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="p-8 text-red-500">Erreur lors de la récupération des données</div>
    </div>
  );

  const { totalIndicators, totalProjects, uniquePartiesReached, averageProgressPct, indicators = [] } = dashboard;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de Bord d’Impact</h1>
          <p className="text-slate-500">Mesure globale des résultats et portée auprès des bénéficiaires (IND-05)</p>
        </div>
        <Button onClick={() => navigate('/indicators')}>
          <Target className="w-4 h-4 mr-2" /> Gérer les indicateurs
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Personnes Atteintes (Sans doublon)</span>
            <Users className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-slate-900">{uniquePartiesReached}</p>
          <p className="text-xs text-slate-500">Bénéficiaires uniques (IND-05)</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avancement Moyen</span>
            <BarChart2 className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-slate-900">{averageProgressPct}%</p>
          <p className="text-xs text-slate-500">Progression globale Cible/Réel</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Indicateurs Définis</span>
            <Target className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-slate-900">{totalIndicators}</p>
          <p className="text-xs text-slate-500">Cadre logique agrégé</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Projets Rattachés</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-slate-900">{totalProjects}</p>
          <p className="text-xs text-slate-500">Projets suivis</p>
        </div>
      </div>

      {/* Synthesis List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Synthèse des Indicateurs Majeurs</h2>

        {indicators.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Aucun indicateur rattaché pour l'instant.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {indicators.map((ind: any) => (
              <div key={ind.id} className="py-4 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {ind.code}
                    </span>
                    <Badge variant="secondary">{ind.level}</Badge>
                  </div>
                  <h4 className="font-medium text-slate-900">{ind.name}</h4>
                  <p className="text-xs text-slate-500">
                    Réel : {ind.actualValue} / Cible : {ind.targetValue} {ind.unit}
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
