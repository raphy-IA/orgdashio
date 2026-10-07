import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import { ArrowLeft, Clock, Users, Award, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export function TrainingSessionDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showOccurrenceModal, setShowOccurrenceModal] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [trainerPartyId, setTrainerPartyId] = useState('');

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [participantPartyId, setParticipantPartyId] = useState('');

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState('');
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'late' | 'excused'>('present');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch session details
  const { data, isLoading } = useQuery({
    queryKey: ['trainingSession', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/training/sessions/${id}`);
      if (!res.ok) throw new Error('Erreur de chargement des détails de la session');
      return res.json();
    },
    enabled: !!id,
  });

  // Add Occurrence Mutation
  const addOccurrenceMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/training/sessions/${id}/occurrences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de l’ajout de la séance');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingSession', id] });
      setShowOccurrenceModal(false);
      setStartTime('');
      setEndTime('');
      setLocation('');
      setTrainerPartyId('');
    },
    onError: (err: any) => setError(err.message),
  });

  // Enroll Participant Mutation
  const enrollMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/training/sessions/${id}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur d’inscription');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingSession', id] });
      setShowEnrollModal(false);
      setParticipantPartyId('');
    },
    onError: (err: any) => setError(err.message),
  });

  // Record Attendance Mutation
  const recordAttendanceMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/training/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur d’enregistrement de présence');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingSession', id] });
      setShowAttendanceModal(false);
    },
    onError: (err: any) => setError(err.message),
  });

  // Issue Certificate Mutation
  const issueCertificateMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const res = await fetch(`/api/v1/training/enrollments/${enrollmentId}/issue-certificate`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de l’émission du certificat');
      }
      return res.json();
    },
    onSuccess: (cert) => {
      queryClient.invalidateQueries({ queryKey: ['trainingSession', id] });
      setSuccessMessage(`Certificat émis avec succès (N° ${cert.certNumber})`);
    },
    onError: (err: any) => setError(err.message),
  });

  if (isLoading) return <div className="p-8">Chargement de la session...</div>;
  if (!data) return <div className="p-8 text-red-500">Session introuvable</div>;

  const { session, occurrences = [], enrollments = [] } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => navigate('/training')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour au catalogue
      </Button>

      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase text-indigo-600">Session de formation</span>
          <h1 className="text-2xl font-bold text-slate-900">{session.title}</h1>
          <p className="text-sm text-slate-500">Capacité : {session.capacity} places</p>
        </div>
        <Badge variant={session.status === 'planned' ? 'secondary' : 'default'}>{session.status}</Badge>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> {successMessage}
        </div>
      )}

      {/* Occurrences / Horaires */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" /> Séance(s) / Emploi du temps
          </h2>
          <Button size="sm" onClick={() => setShowOccurrenceModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Ajouter une séance
          </Button>
        </div>

        {occurrences.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Aucune séance planifiée pour cette session.</p>
        ) : (
          <div className="space-y-3">
            {occurrences.map((occ: any) => (
              <div key={occ.id} className="p-4 border border-slate-200 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">
                    {new Date(occ.startTime).toLocaleString()} - {new Date(occ.endTime).toLocaleTimeString()}
                  </p>
                  {occ.location && <p className="text-sm text-slate-500">Lieu: {occ.location}</p>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedOccurrenceId(occ.id);
                    setShowAttendanceModal(true);
                  }}
                >
                  Saisir présence
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Participants & Inscriptions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Participants inscrits ({enrollments.length}/{session.capacity})
          </h2>
          <Button size="sm" onClick={() => setShowEnrollModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Inscrire un participant
          </Button>
        </div>

        {enrollments.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Aucun participant inscrit.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {enrollments.map((enr: any) => (
              <div key={enr.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">Participant #{enr.partyId.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500">Statut: {enr.status} | Source: {enr.source}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => issueCertificateMutation.mutate(enr.id)}
                >
                  <Award className="w-4 h-4 mr-1 text-amber-600" /> Émettre certificat
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ajouter Séance */}
      {showOccurrenceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold">Ajouter une séance</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                addOccurrenceMutation.mutate({
                  startTime: new Date(startTime).toISOString(),
                  endTime: new Date(endTime).toISOString(),
                  location: location || undefined,
                  trainerPartyId: trainerPartyId || undefined,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-medium">Début</label>
                <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Fin</label>
                <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Lieu / Salle</label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">ID Formateur (optionnel)</label>
                <Input value={trainerPartyId} onChange={(e) => setTrainerPartyId(e.target.value)} placeholder="UUID formateur" />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowOccurrenceModal(false)}>
                  Annuler
                </Button>
                <Button type="submit">Valider</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Inscrire Participant */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold">Inscrire un participant</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                enrollMutation.mutate({
                  partyId: participantPartyId,
                  source: 'agent',
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-medium">ID du bénéficiaire (Party UUID)</label>
                <Input value={participantPartyId} onChange={(e) => setParticipantPartyId(e.target.value)} required />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowEnrollModal(false)}>
                  Annuler
                </Button>
                <Button type="submit">Inscrire</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Presence */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold">Saisie de présence</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                recordAttendanceMutation.mutate({
                  occurrenceId: selectedOccurrenceId,
                  enrollmentId: selectedEnrollmentId,
                  status: attendanceStatus,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-medium">Inscription / Participant</label>
                <select
                  className="w-full border border-slate-300 rounded-md p-2 text-sm"
                  value={selectedEnrollmentId}
                  onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                  required
                >
                  <option value="">-- Sélectionner un participant inscrit --</option>
                  {enrollments.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      Participant #{e.partyId.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Statut de présence</label>
                <select
                  className="w-full border border-slate-300 rounded-md p-2 text-sm"
                  value={attendanceStatus}
                  onChange={(e: any) => setAttendanceStatus(e.target.value)}
                >
                  <option value="present">Présent</option>
                  <option value="late">En retard</option>
                  <option value="absent">Absent</option>
                  <option value="excused">Excusé</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowAttendanceModal(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
