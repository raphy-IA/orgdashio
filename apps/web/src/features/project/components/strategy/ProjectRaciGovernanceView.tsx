import React, { useState } from 'react';
import { Button, Input } from '@orgdashio/ui';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Layers,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

interface ProjectMember {
  id: string;
  projectId: string;
  userId?: string | null;
  partyId?: string | null;
  name: string;
  email?: string | null;
  role: 'manager' | 'coordinator' | 'contributor' | 'stakeholder' | 'expert' | 'beneficiary_rep';
  raciRole: 'R' | 'A' | 'C' | 'I';
  allocationPct: number;
}

interface PlanItemRaci {
  id: string;
  projectId: string;
  planItemId: string;
  projectMemberId: string;
  raciRole: 'R' | 'A' | 'C' | 'I';
}

interface ProjectRaciGovernanceViewProps {
  projectId: string;
  members: ProjectMember[];
  raci: PlanItemRaci[];
  planItems: any[];
  orgPeople: any[];
  onAddMember: (member: Partial<ProjectMember>) => Promise<void>;
  onRemoveMember: (id: string) => Promise<void>;
  onSetRaciRole: (planItemId: string, projectMemberId: string, raciRole: 'R' | 'A' | 'C' | 'I' | null) => Promise<void>;
}

const MEMBER_ROLE_LABELS: Record<string, { label: string; color: string }> = {
  manager: { label: 'Gestionnaire de Projet', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  coordinator: { label: 'Coordinateur d\'Activité', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  contributor: { label: 'Contributeur / Exécutant', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  stakeholder: { label: 'Partie Prenante Clé', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  expert: { label: 'Expert / Consultant', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  beneficiary_rep: { label: 'Représentant Bénéficiaires', color: 'bg-rose-100 text-rose-800 border-rose-200' },
};

const RACI_CONFIG: Record<
  string,
  { label: string; shortLabel: string; desc: string; color: string }
> = {
  R: {
    label: 'Réalisateur (Responsible)',
    shortLabel: 'R',
    desc: 'Effectue le travail et produit les résultats au quotidien',
    color: 'bg-indigo-600 text-white',
  },
  A: {
    label: 'Approbateur / Décideur (Accountable)',
    shortLabel: 'A',
    desc: 'Porte la responsabilité globale du résultat et valide la conformité (1 seul recommandé par ligne)',
    color: 'bg-amber-600 text-white',
  },
  C: {
    label: 'Consulté (Consulted)',
    shortLabel: 'C',
    desc: 'Fournit son expertise ou des avis préalables requis',
    color: 'bg-purple-600 text-white',
  },
  I: {
    label: 'Informé (Informed)',
    shortLabel: 'I',
    desc: 'Tenu au courant de l’avancement et de la finalisation',
    color: 'bg-teal-600 text-white',
  },
};

export function ProjectRaciGovernanceView({
  projectId,
  members,
  raci,
  planItems,
  orgPeople,
  onAddMember,
  onRemoveMember,
  onSetRaciRole,
}: ProjectRaciGovernanceViewProps) {
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [tmSourceType, setTmSourceType] = useState<'personnel' | 'external'>('personnel');
  const [tmPartyId, setTmPartyId] = useState('');
  const [tmName, setTmName] = useState('');
  const [tmEmail, setTmEmail] = useState('');
  const [tmRole, setTmRole] = useState<ProjectMember['role']>('contributor');
  const [tmAllocation, setTmAllocation] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddMemberSubmit = async () => {
    if (!tmName.trim()) return;
    try {
      setIsSubmitting(true);
      await onAddMember({
        partyId: tmSourceType === 'personnel' && tmPartyId ? tmPartyId : null,
        name: tmName.trim(),
        email: tmEmail.trim() || null,
        role: tmRole,
        allocationPct: parseInt(tmAllocation) || 100,
        raciRole: 'R',
      });
      setShowMemberForm(false);
      setTmName('');
      setTmEmail('');
      setTmPartyId('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort and filter items for RACI Matrix
  const sortedPlanItems = [...planItems].sort((a, b) => {
    const partsA = (a.wbs || '').split('.').map((n: string) => parseInt(n, 10) || 0);
    const partsB = (b.wbs || '').split('.').map((n: string) => parseInt(n, 10) || 0);
    const len = Math.max(partsA.length, partsB.length);
    for (let i = 0; i < len; i++) {
      const valA = partsA[i] ?? -1;
      const valB = partsB[i] ?? -1;
      if (valA !== valB) return valA - valB;
    }
    return (a.title || '').localeCompare(b.title || '');
  });

  const filteredItems = sortedPlanItems.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.title?.toLowerCase().includes(q) || item.wbs?.includes(q);
    }
    return true;
  });

  const compliantCount = planItems.filter((item) => {
    const itemRacis = raci.filter((r) => r.planItemId === item.id);
    const countA = itemRacis.filter((r) => r.raciRole === 'A').length;
    const countR = itemRacis.filter((r) => r.raciRole === 'R').length;
    return countA === 1 && countR >= 1;
  }).length;

  const coveragePct = planItems.length > 0 ? Math.round((compliantCount / planItems.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Équipe Projet, Parties Prenantes & Matrice RACI 2D
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gouvernance fine des responsabilités et matrice croisée par Phase, Activité et Livrable
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setShowMemberForm(true);
            setTmSourceType('personnel');
          }}
          className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shrink-0"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Ajouter une partie prenante
        </Button>
      </div>

      {/* ── Governance Audit KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Parties Prenantes</span>
          <p className="mt-1 text-2xl font-black font-mono text-slate-900">{members.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Membres et partenaires affectés</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Couverture RACI</span>
          <p className={`mt-1 text-2xl font-black font-mono ${coveragePct >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {coveragePct}%
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{compliantCount} / {planItems.length} éléments conformes</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rôles Assignés</span>
          <p className="mt-1 text-2xl font-black font-mono text-purple-600">{raci.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Affectations actives dans la grille</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Règle de Décision (A)</span>
          <p className="mt-1 text-xs font-bold text-slate-800">
            {planItems.filter((p) => raci.filter((r) => r.planItemId === p.id && r.raciRole === 'A').length === 0).length === 0
              ? '✅ 100% avec Approbateur'
              : `⚠️ ${planItems.filter((p) => raci.filter((r) => r.planItemId === p.id && r.raciRole === 'A').length === 0).length} sans Approbateur`}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">1 seul décideur final par ligne</p>
        </div>
      </div>

      {/* ── Add Stakeholder Form ── */}
      {showMemberForm && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
            <h4 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              Affecter une partie prenante au projet
            </h4>
            <Button variant="ghost" size="sm" onClick={() => setShowMemberForm(false)} className="h-7 w-7 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTmSourceType('personnel');
                setTmPartyId('');
                setTmName('');
                setTmEmail('');
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                tmSourceType === 'personnel'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border'
              }`}
            >
              👥 Personnel de l'Organisation
            </button>
            <button
              type="button"
              onClick={() => {
                setTmSourceType('external');
                setTmPartyId('');
                setTmName('');
                setTmEmail('');
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                tmSourceType === 'external'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border'
              }`}
            >
              🌐 Consultant / Partenaire Externe
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {tmSourceType === 'personnel' ? (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Sélectionner dans le répertoire du personnel *
                </label>
                <select
                  value={tmPartyId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    setTmPartyId(pId);
                    const found = orgPeople.find((p) => p.id === pId);
                    if (found) {
                      setTmName(`${found.firstName || ''} ${found.lastName || ''}`.trim() || 'Sans nom');
                      setTmEmail(found.email || '');
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                >
                  <option value="">— Choisir dans l'annuaire —</option>
                  {orgPeople.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} {p.email ? `(${p.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Nom complet *</label>
                  <Input
                    value={tmName}
                    onChange={(e) => setTmName(e.target.value)}
                    placeholder="Ex: Dr. Sophie Martin"
                    className="bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Courriel</label>
                  <Input
                    type="email"
                    value={tmEmail}
                    onChange={(e) => setTmEmail(e.target.value)}
                    placeholder="sophie.martin@expert.org"
                    className="bg-white text-xs"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Rôle dans le projet *</label>
              <select
                value={tmRole}
                onChange={(e) => setTmRole(e.target.value as ProjectMember['role'])}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                {Object.entries(MEMBER_ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Allocation prévisionnelle (%)</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={tmAllocation}
                onChange={(e) => setTmAllocation(e.target.value)}
                className="bg-white text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setShowMemberForm(false)} className="text-xs">
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleAddMemberSubmit}
              disabled={!tmName.trim() || isSubmitting}
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Confirmer l'affectation
            </Button>
          </div>
        </div>
      )}

      {/* ── Section 1: Répertoire des Parties Prenantes ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b bg-slate-50 px-6 py-4 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">1. Répertoire des Parties Prenantes Affectées</h4>
            <p className="text-xs text-slate-500">Bilan des rôles et temps alloué par membre</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{members.length} membre(s)</span>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aucune partie prenante affectée au projet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50 font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Nom & Contact</th>
                  <th className="px-4 py-3">Provenance</th>
                  <th className="px-4 py-3">Rôle Projet</th>
                  <th className="px-4 py-3 text-center">Implication</th>
                  <th className="px-4 py-3 text-center">Bilan RACI</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => {
                  const roleCfg = MEMBER_ROLE_LABELS[member.role] || MEMBER_ROLE_LABELS.contributor;
                  const memberRacis = raci.filter((r) => r.projectMemberId === member.id);
                  const countR = memberRacis.filter((r) => r.raciRole === 'R').length;
                  const countA = memberRacis.filter((r) => r.raciRole === 'A').length;
                  const countC = memberRacis.filter((r) => r.raciRole === 'C').length;
                  const countI = memberRacis.filter((r) => r.raciRole === 'I').length;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{member.name}</div>
                        {member.email && <div className="text-[11px] text-slate-400">{member.email}</div>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            member.partyId || member.userId
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {member.partyId || member.userId ? '🏢 Membre Interne' : '🌐 Externe / Partenaire'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${roleCfg.color}`}>
                          {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                        {member.allocationPct}%
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5 font-bold font-mono text-[10px]">
                          <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">R:{countR}</span>
                          <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">A:{countA}</span>
                          <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">C:{countC}</span>
                          <span className="bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">I:{countI}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveMember(member.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 2: Matrice RACI 2D Dynamique ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              2. Matrice RACI 2D par Phase, Activité et Livrable
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Attribuez les rôles précis aux parties prenantes pour chaque élément du plan WBS
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
              {[
                { key: 'all', label: 'Tout' },
                { key: 'phase', label: 'Phases' },
                { key: 'activity', label: 'Activités' },
                { key: 'task', label: 'Tâches' },
                { key: 'deliverable', label: 'Livrables' },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterType(f.key)}
                  className={`px-2.5 py-1 rounded-md transition ${
                    filterType === f.key ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher WBS..."
                className="pl-8 text-xs bg-slate-50 h-7 w-48"
              />
            </div>
          </div>
        </div>

        {/* 2D Matrix Table */}
        {planItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aucun élément WBS configuré. Ajoutez des éléments dans l'onglet Planification.
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Ajoutez au moins une partie prenante ci-dessus pour construire la matrice RACI.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b bg-slate-50/90 text-slate-700 font-bold sticky top-0">
                <tr>
                  <th className="min-w-[260px] px-4 py-3 border-r border-slate-200">Élément WBS</th>
                  {members.map((m) => (
                    <th key={m.id} className="min-w-[120px] px-2 py-3 text-center border-r border-slate-200 bg-slate-50/60">
                      <div className="font-bold text-slate-900 truncate" title={m.name}>
                        {m.name}
                      </div>
                      <div className="text-[10px] font-medium text-slate-400 truncate">
                        {MEMBER_ROLE_LABELS[m.role]?.label || m.role}
                      </div>
                    </th>
                  ))}
                  <th className="min-w-[150px] px-4 py-3 text-center bg-slate-50">Audit Conformité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const depth = (item.wbs.split('.').length - 1);
                  const itemRacis = raci.filter((r) => r.planItemId === item.id);
                  const countA = itemRacis.filter((r) => r.raciRole === 'A').length;
                  const countR = itemRacis.filter((r) => r.raciRole === 'R').length;
                  const isCompliant = countA === 1 && countR >= 1;

                  return (
                    <tr key={item.id} className={`hover:bg-indigo-50/30 transition ${item.type === 'phase' ? 'bg-slate-50/70 font-semibold' : ''}`}>
                      <td className="px-4 py-2.5 border-r border-slate-200">
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 12}px` }}>
                          <span className="font-mono text-slate-500 font-bold text-[11px]">{item.wbs}</span>
                          <span className="font-medium text-slate-900 truncate max-w-[220px]" title={item.title}>
                            {item.title}
                          </span>
                        </div>
                      </td>

                      {members.map((member) => {
                        const assignment = raci.find(
                          (r) => r.planItemId === item.id && r.projectMemberId === member.id
                        );
                        const currentRole = assignment?.raciRole;

                        return (
                          <td key={member.id} className="px-1.5 py-1.5 text-center border-r border-slate-200">
                            <select
                              value={currentRole || ''}
                              onChange={(e) => {
                                const val = (e.target.value as 'R' | 'A' | 'C' | 'I' | '') || null;
                                onSetRaciRole(item.id, member.id, val);
                              }}
                              className={`w-20 rounded-md px-1 py-1 text-xs font-bold text-center border cursor-pointer transition ${
                                currentRole === 'R'
                                  ? 'bg-indigo-600 text-white border-indigo-700'
                                  : currentRole === 'A'
                                  ? 'bg-amber-500 text-white border-amber-600'
                                  : currentRole === 'C'
                                  ? 'bg-purple-600 text-white border-purple-700'
                                  : currentRole === 'I'
                                  ? 'bg-teal-600 text-white border-teal-700'
                                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <option value="">—</option>
                              <option value="R">R (Fait)</option>
                              <option value="A">A (Valide)</option>
                              <option value="C">C (Avis)</option>
                              <option value="I">I (Info)</option>
                            </select>
                          </td>
                        );
                      })}

                      <td className="px-3 py-2 text-center">
                        {isCompliant ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Conforme
                          </span>
                        ) : countA === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200" title="Chaque ligne doit comporter un approbateur">
                            <AlertTriangle className="h-3 w-3 text-amber-700" /> Sans Approbateur (A)
                          </span>
                        ) : countA > 1 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-800 border border-red-200" title="Évitez plusieurs décideurs sur une même ligne">
                            <AlertTriangle className="h-3 w-3 text-red-700" /> Conflit ({countA} 'A')
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
                            Sans Réalisateur (R)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* RACI Best Practices Guide */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {Object.entries(RACI_CONFIG).map(([key, cfg]) => (
            <div key={key} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
              <span className={`inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-black ${cfg.color}`}>
                {key}
              </span>
              <span className="font-bold text-slate-800 block text-[11px]">{cfg.label}</span>
              <p className="text-[10px] text-slate-500 leading-snug">{cfg.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
