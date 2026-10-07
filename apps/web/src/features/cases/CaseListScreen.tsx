import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import { FolderLock, Plus, ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';

export function CaseListScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [partyId, setPartyId] = useState('');
  const [title, setTitle] = useState('');
  const [confidentialityLevel, setConfidentialityLevel] = useState<'standard' | 'restricted' | 'highly_confidential'>('restricted');
  const [error, setError] = useState('');

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const res = await fetch('/api/v1/cases');
      if (!res.ok) throw new Error('Erreur lors du chargement des dossiers');
      return res.json();
    },
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowModal(false);
      setPartyId('');
      setTitle('');
    },
    onError: (err: any) => setError(err.message),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suivi de Cas & Accompagnement</h1>
          <p className="text-slate-500">Gestion des dossiers individuels et confidentiels (CAS)</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Ouvrir un dossier
        </Button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">{error}</div>}

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <FolderLock className="w-5 h-5 text-indigo-600" /> Dossiers actifs
        </h2>

        {isLoading ? (
          <p className="text-slate-500">Chargement...</p>
        ) : cases.length === 0 ? (
          <p className="text-slate-400 italic">Aucun dossier de cas disponible.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {cases.map((c: any) => (
              <div key={c.id} className="py-4 flex justify-between items-center hover:bg-slate-50 px-3 rounded-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {c.caseNumber}
                    </span>
                    <Badge variant={c.confidentialityLevel === 'highly_confidential' ? 'danger' : 'secondary'}>
                      {c.confidentialityLevel}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-slate-900">{c.title}</h4>
                  <p className="text-xs text-slate-500">Statut : {c.status} | Créé le {new Date(c.openedAt).toLocaleDateString()}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/cases/${c.id}`)}>
                  Consulter <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nouveau Dossier */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold">Ouvrir un nouveau dossier</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({
                  partyId,
                  title,
                  confidentialityLevel,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-medium">ID du bénéficiaire (Party UUID)</label>
                <Input value={partyId} onChange={(e) => setPartyId(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Titre / Intitulé du dossier</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Niveau de confidentialité</label>
                <select
                  className="w-full border border-slate-300 rounded-md p-2 text-sm"
                  value={confidentialityLevel}
                  onChange={(e: any) => setConfidentialityLevel(e.target.value)}
                >
                  <option value="standard">Standard</option>
                  <option value="restricted">Restreint (Équipe de dossier)</option>
                  <option value="highly_confidential">Haute confidentialité (Supervisé)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                  Annuler
                </Button>
                <Button type="submit">Créer le dossier</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
