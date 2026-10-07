import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  FolderLock,
  Plus,
  ShieldAlert,
  ArrowRight,
  Search,
  Filter,
  Users,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Lock,
  FileText,
  HeartHandshake,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';

export function CaseListScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [partyId, setPartyId] = useState('');
  const [title, setTitle] = useState('');
  const [confidentialityLevel, setConfidentialityLevel] = useState<'standard' | 'restricted' | 'highly_confidential'>('restricted');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confidentialityFilter, setConfidentialityFilter] = useState<string>('all');
  const [error, setError] = useState('');

  // Fetch all accessible cases
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const res = await fetch('/api/v1/cases');
      if (!res.ok) throw new Error('Erreur lors du chargement des dossiers');
      return res.json();
    },
  });

  // Fetch beneficiaries from People module for modal selection
  const { data: people = [] } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const res = await fetch('/api/v1/people');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const beneficiariesList = useMemo(() => {
    return people.filter((p: any) => p.profile !== null || p.staff === null);
  }, [people]);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de la création du dossier');
      }
      return res.json();
    },
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowModal(false);
      setPartyId('');
      setTitle('');
      navigate(`/cases/${newCase.id}`);
    },
    onError: (err: any) => setError(err.message),
  });

  // Computed KPIs
  const totalCases = cases.length;
  const activeCases = cases.filter((c: any) => c.status === 'open' || c.status === 'active').length;
  const underReviewCases = cases.filter((c: any) => c.status === 'under_review').length;
  const closedCases = cases.filter((c: any) => c.status === 'closed').length;
  const highlyConfidentialCount = cases.filter((c: any) => c.confidentialityLevel === 'highly_confidential').length;

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((c: any) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (confidentialityFilter !== 'all' && c.confidentialityLevel !== confidentialityFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const num = (c.caseNumber || '').toLowerCase();
        const t = (c.title || '').toLowerCase();
        const benName = `${c.beneficiary?.firstName || ''} ${c.beneficiary?.lastName || ''}`.toLowerCase();
        const workerName = `${c.primaryWorker?.firstName || ''} ${c.primaryWorker?.lastName || ''}`.toLowerCase();
        return num.includes(q) || t.includes(q) || benName.includes(q) || workerName.includes(q);
      }
      return true;
    });
  }, [cases, searchTerm, statusFilter, confidentialityFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">Ouvert</span>;
      case 'active':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Actif / En cours</span>;
      case 'under_review':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">En révision</span>;
      case 'closed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">Clôturé</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getConfidentialityBadge = (level: string) => {
    switch (level) {
      case 'highly_confidential':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="h-3 w-3" />
            Hautement confidentiel
          </span>
        );
      case 'restricted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Lock className="h-3 w-3" />
            Restreint
          </span>
        );
      case 'standard':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            <ShieldCheck className="h-3 w-3" />
            Standard
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <HeartHandshake className="h-4 w-4" />
              <span>Module CAS • Travail Social & Accompagnement</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Suivi de Cas & Dossiers d'Intervention</h1>
            <p className="text-xs text-slate-500 mt-1">
              Accompagnement individualisé, plans d'intervention SMART, notes verrouillées et stricte conformité Loi 25.
            </p>
          </div>

          <Button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
            <Plus className="mr-2 h-4 w-4" />
            Ouvrir un nouveau dossier
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dossiers Actifs</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <FolderLock className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{activeCases}</span>
              <span className="text-xs text-slate-400">/ {totalCases} au total</span>
            </div>
            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Accompagnements en cours
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">En Révision</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-amber-600">{underReviewCases}</span>
              <span className="text-xs text-slate-400">dossiers</span>
            </div>
            <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Plans ou objectifs à réviser
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hautement Confidentiels</span>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-rose-600">{highlyConfidentialCount}</span>
              <span className="text-xs text-slate-400">dossiers restreints</span>
            </div>
            <div className="text-xs text-rose-600 font-medium flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" />
              Équipe assignée uniquement
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dossiers Clôturés</span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{closedCases}</span>
              <span className="text-xs text-slate-400">dossiers</span>
            </div>
            <div className="text-xs text-indigo-600 font-medium flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Objectifs d'autonomie atteints
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600">Statut :</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
              >
                <option value="all">Tous les statuts ({cases.length})</option>
                <option value="open">Ouvert</option>
                <option value="active">Actif</option>
                <option value="under_review">En révision</option>
                <option value="closed">Clôturé</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Confidentialité :</span>
              <select
                value={confidentialityFilter}
                onChange={(e) => setConfidentialityFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
              >
                <option value="all">Tous les niveaux</option>
                <option value="standard">Standard</option>
                <option value="restricted">Restreint</option>
                <option value="highly_confidential">Hautement confidentiel</option>
              </select>
            </div>
          </div>

          <div className="w-80">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par bénéficiaire, titre, numéro CAS..."
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Table of cases */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Chargement des dossiers de cas...</div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <FolderLock className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-medium">Aucun dossier de cas trouvé.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Ouvrez un nouveau dossier d'accompagnement pour démarrer le suivi d'un bénéficiaire.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase font-mono text-[11px] text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Numéro & Confidentialité</th>
                    <th className="px-5 py-3.5">Bénéficiaire / Usager</th>
                    <th className="px-5 py-3.5">Intitulé de l'Accompagnement</th>
                    <th className="px-5 py-3.5">Intervenant Référent</th>
                    <th className="px-5 py-3.5">Statut</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCases.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-mono font-bold text-slate-800 text-xs mb-1">{c.caseNumber}</div>
                        {getConfidentialityBadge(c.confidentialityLevel)}
                      </td>
                      <td className="px-5 py-3.5">
                        {c.beneficiary ? (
                          <div>
                            <div className="font-bold text-slate-900 text-sm">
                              {c.beneficiary.firstName} {c.beneficiary.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {c.beneficiary.phone || c.beneficiary.email || 'Contact non spécifié'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Bénéficiaire non renseigné</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800 text-sm">{c.title}</div>
                        <div className="text-[11px] text-slate-400">
                          Ouvert le {new Date(c.openedAt).toLocaleDateString('fr-CA')}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {c.primaryWorker ? (
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                              {c.primaryWorker.firstName?.[0] || 'I'}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">
                                {c.primaryWorker.firstName} {c.primaryWorker.lastName}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Équipe : {c.teamCount || 1} intervenant(s)
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Non assigné</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">{getStatusBadge(c.status)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                          onClick={() => navigate(`/cases/${c.id}`)}
                        >
                          Consulter <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Nouveau Dossier */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <FolderLock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Ouvrir un Dossier d'Accompagnement</h3>
                    <p className="text-xs text-slate-500">Module CAS • Confidentialité et équipe de suivi</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs">
                  {error}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!partyId) {
                    setError('Veuillez sélectionner un bénéficiaire.');
                    return;
                  }
                  createMutation.mutate({
                    partyId,
                    title,
                    confidentialityLevel,
                  });
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Bénéficiaire / Personne accompagnée *
                  </label>
                  <select
                    value={partyId}
                    onChange={(e) => setPartyId(e.target.value)}
                    required
                    className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800"
                  >
                    <option value="">-- Sélectionner une personne --</option>
                    {beneficiariesList.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.firstName} {b.lastName} {b.phone ? `(${b.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Intitulé ou motif d'accompagnement *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Plan d'intégration sociale et recherche de logement"
                    required
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Niveau de confidentialité (Loi 25)
                  </label>
                  <select
                    value={confidentialityLevel}
                    onChange={(e) => setConfidentialityLevel(e.target.value as any)}
                    className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800"
                  >
                    <option value="restricted">Restreint (Équipe assignée uniquement - Recommandé)</option>
                    <option value="highly_confidential">Hautement Confidentiel (Cas sensible / Bris de glace audité)</option>
                    <option value="standard">Standard (Tous les intervenants)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="text-xs"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Ouverture...' : 'Créer et ouvrir le dossier'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
