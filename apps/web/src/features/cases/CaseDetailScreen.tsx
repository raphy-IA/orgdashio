import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import { ArrowLeft, ShieldAlert, Lock, Plus, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export function CaseDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showBreakGlassModal, setShowBreakGlassModal] = useState(false);
  const [breakGlassReason, setBreakGlassReason] = useState('');

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteType, setNoteType] = useState<'meeting' | 'phone_call' | 'home_visit' | 'assessment' | 'other'>('meeting');
  const [content, setContent] = useState('');
  const [parentNoteId, setParentNoteId] = useState<string | undefined>(undefined);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Query case details
  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['caseDetail', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/cases/${id}`);
      if (!res.ok) {
        const errData = await res.json();
        throw errData;
      }
      return res.json();
    },
    enabled: !!id,
    retry: false,
  });

  // Break-the-glass mutation
  const breakGlassMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/v1/cases/${id}/break-glass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors du bris de glace');
      }
      return res.json();
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['caseDetail', id] });
      setShowBreakGlassModal(false);
      setBreakGlassReason('');
      setSuccessMessage(resData.message || 'Accès exceptionnel accordé.');
    },
    onError: (err: any) => setError(err.message),
  });

  // Add Note / Addenda mutation
  const addNoteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/cases/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de l’ajout de la note');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caseDetail', id] });
      setShowNoteModal(false);
      setContent('');
      setParentNoteId(undefined);
    },
    onError: (err: any) => setError(err.message),
  });

  if (isLoading) return <div className="p-8">Chargement du dossier de cas...</div>;

  // Handle Restricted Access / Break Glass scenario
  if (isError && (queryError as any)?.requiresBreakGlass) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/cases')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux dossiers
        </Button>

        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-bold text-red-900">Accès Restreint aux Données Confidentielles (CAS-08)</h2>
          <p className="text-sm text-red-700 max-w-lg mx-auto">
            Vous n'êtes pas membre de l'équipe assignée à ce dossier restreint. Conformément aux règles de confidentialité, l’accès direct est bloqué.
          </p>

          <div className="pt-2">
            <Button variant="danger" onClick={() => setShowBreakGlassModal(true)}>
              <Lock className="w-4 h-4 mr-2" /> Déclencher un Bris de Glace d’Urgence
            </Button>
          </div>
        </div>

        {/* Modal Bris de Glace */}
        {showBreakGlassModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Justification d’Urgence (Bris de glace)
              </h3>
              <p className="text-xs text-slate-500">
                Avertissement : Cette action est strictement auditée et déclenchera une notification immédiate au superviseur et au responsable de la vie privée.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  breakGlassMutation.mutate(breakGlassReason);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-sm font-medium">Motif explicite (minimum 10 caractères)</label>
                  <Input
                    value={breakGlassReason}
                    onChange={(e) => setBreakGlassReason(e.target.value)}
                    placeholder="Ex: Intervention d'urgence psychosociale en cours..."
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowBreakGlassModal(false)}>
                    Annuler
                  </Button>
                  <Button variant="danger" type="submit">
                    Confirmer le bris de glace
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isError || !data) return <div className="p-8 text-red-500">Erreur lors de l'accès au dossier</div>;

  const { caseFile: c, assignments = [], notes = [], breakGlassLogs = [] } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => navigate('/cases')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux dossiers
      </Button>

      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              {c.caseNumber}
            </span>
            <Badge variant={c.confidentialityLevel === 'highly_confidential' ? 'danger' : 'secondary'}>
              {c.confidentialityLevel}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{c.title}</h1>
          <p className="text-sm text-slate-500">Statut : {c.status} | Créé le {new Date(c.openedAt).toLocaleDateString()}</p>
        </div>
        <Button onClick={() => setShowNoteModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Ajouter une note de suivi
        </Button>
      </div>

      {breakGlassLogs.length > 0 && (
        <div className="p-4 bg-amber-50 text-amber-800 rounded-md border border-amber-200 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
          <span className="text-sm">
            Vous consultez ce dossier via un accès d’urgence (Bris de glace consigné au journal d’audit).
          </span>
        </div>
      )}

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">{error}</div>}
      {successMessage && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">{successMessage}</div>}

      {/* Timeline des notes */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Journal & Notes de suivi (CAS-05)
        </h2>

        {notes.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Aucune note dans ce dossier.</p>
        ) : (
          <div className="space-y-4">
            {notes.map((n: any) => (
              <div key={n.id} className="p-4 border border-slate-200 rounded-lg space-y-2 bg-slate-50/50">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{n.noteType}</Badge>
                    {n.parentNoteId && <Badge variant="secondary">Addenda</Badge>}
                    <span>Par #{n.authorUserId.slice(0, 8)} le {new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  {!n.isEditable ? (
                    <span className="flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Lock className="w-3 h-3" /> Verrouillé (&gt;7j)
                    </span>
                  ) : (
                    <span className="text-emerald-600">Modifiable</span>
                  )}
                </div>

                <p className="text-sm text-slate-800 whitespace-pre-wrap">{n.content}</p>

                {!n.isEditable && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setParentNoteId(n.id);
                        setShowNoteModal(true);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter un addenda
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ajouter Note / Addenda */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold">
              {parentNoteId ? 'Ajouter un addenda à la note' : 'Nouvelle note de suivi'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                addNoteMutation.mutate({
                  noteType,
                  content,
                  parentNoteId,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-medium">Type d'intervention</label>
                <select
                  className="w-full border border-slate-300 rounded-md p-2 text-sm"
                  value={noteType}
                  onChange={(e: any) => setNoteType(e.target.value)}
                >
                  <option value="meeting">Rencontre / Entrevue</option>
                  <option value="phone_call">Appel téléphonique</option>
                  <option value="home_visit">Visite à domicile</option>
                  <option value="assessment">Évaluation</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Contenu de la note</label>
                <textarea
                  className="w-full border border-slate-300 rounded-md p-2 text-sm h-32"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Compte rendu détaillé..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowNoteModal(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer la note</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
