import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import { Target, Plus, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export function IndicatorListScreen() {
  const queryClient = useQueryClient();

  const [showIndModal, setShowIndModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [level, setLevel] = useState<'impact' | 'outcome' | 'output' | 'activity'>('output');
  const [unit, setUnit] = useState('personnes');
  const [baselineValue, setBaselineValue] = useState(0);
  const [targetValue, setTargetValue] = useState(100);
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'annual' | 'total'>('quarterly');

  const [showObsModal, setShowObsModal] = useState(false);
  const [selectedIndId, setSelectedIndId] = useState('');
  const [periodLabel, setPeriodLabel] = useState('2026-Q1');
  const [recordedValue, setRecordedValue] = useState(0);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');

  // Fetch indicators
  const { data: indicators = [], isLoading } = useQuery({
    queryKey: ['indicators'],
    queryFn: async () => {
      const res = await fetch('/api/v1/indicators');
      if (!res.ok) throw new Error('Erreur de chargement des indicateurs');
      return res.json();
    },
  });

  // Create indicator mutation
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
      setShowIndModal(false);
      setCode('');
      setName('');
    },
    onError: (err: any) => setError(err.message),
  });

  // Record observation mutation
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
      setShowObsModal(false);
      setNotes('');
    },
    onError: (err: any) => setError(err.message),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catalogue des Indicateurs</h1>
          <p className="text-slate-500">Définition et suivi des cibles et valeurs observées (IND)</p>
        </div>
        <Button onClick={() => setShowIndModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nouvel indicateur
        </Button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">{error}</div>}

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" /> Indicateurs configurés
        </h2>

        {isLoading ? (
          <p className="text-slate-500">Chargement...</p>
        ) : indicators.length === 0 ? (
          <p className="text-slate-400 italic">Aucun indicateur défini.</p>
        ) : (
          <div className="space-y-4">
            {indicators.map((ind: any) => (
              <div key={ind.id} className="p-5 border border-slate-200 rounded-lg space-y-3 hover:shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {ind.code}
                      </span>
                      <Badge variant="secondary">{ind.level}</Badge>
                      <span className="text-xs text-slate-400">Fréquence: {ind.frequency}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{ind.name}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedIndId(ind.id);
                      setRecordedValue(Number(ind.actualValue));
                      setShowObsModal(true);
                    }}
                  >
                    <TrendingUp className="w-4 h-4 mr-1 text-emerald-600" /> Saisir mesure
                  </Button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>
                      Réel: {ind.actualValue} {ind.unit} / Cible: {ind.targetValue} {ind.unit}
                    </span>
                    <span className="font-bold text-indigo-600">{ind.progressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(ind.progressPct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Créer Indicateur */}
      {showIndModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold">Nouvel Indicateur</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                createMutation.mutate({
                  code,
                  name,
                  level,
                  unit,
                  baselineValue: Number(baselineValue),
                  targetValue: Number(targetValue),
                  frequency,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-medium">Code (ex. IND-PART-01)</label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Intitulé de l'indicateur</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Niveau du cadre logique</label>
                <select
                  className="w-full border border-slate-300 rounded-md p-2 text-sm"
                  value={level}
                  onChange={(e: any) => setLevel(e.target.value)}
                >
                  <option value="impact">Impact</option>
                  <option value="outcome">Effet (Outcome)</option>
                  <option value="output">Produit (Output)</option>
                  <option value="activity">Activité</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Unité (ex. personnes)</label>
                  <Input value={unit} onChange={(e) => setUnit(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Cible visée</label>
                  <Input type="number" value={targetValue} onChange={(e) => setTargetValue(Number(e.target.value))} required />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowIndModal(false)}>
                  Annuler
                </Button>
                <Button type="submit">Créer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Saisir Observation */}
      {showObsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold">Saisir une mesure d'observation</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                obsMutation.mutate({
                  id: selectedIndId,
                  payload: {
                    periodLabel,
                    recordedValue: Number(recordedValue),
                    notes: notes || undefined,
                  },
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-medium">Période (ex. 2026-Q1)</label>
                <Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Valeur mesurée / observée</label>
                <Input type="number" value={recordedValue} onChange={(e) => setRecordedValue(Number(e.target.value))} required />
              </div>
              <div>
                <label className="text-sm font-medium">Remarques (optionnel)</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowObsModal(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer la mesure</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
