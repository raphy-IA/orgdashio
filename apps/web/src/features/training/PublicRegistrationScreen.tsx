import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Input } from '@orgdashio/ui';
import { CheckCircle, AlertCircle, BookOpen } from 'lucide-react';

export function PublicRegistrationScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create person profile via public route or backend process
      const personRes = await fetch('/api/v1/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone }),
      });

      if (!personRes.ok) {
        const errData = await personRes.json();
        throw new Error(errData.message || 'Erreur d’enregistrement de l’identité');
      }

      const { party } = await personRes.json();

      // 2. Enroll party in the public session
      const enrollRes = await fetch(`/api/v1/training/sessions/${sessionId}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partyId: party.id, source: 'public_form' }),
      });

      if (!enrollRes.ok) {
        const errData = await enrollRes.json();
        throw new Error(errData.message || 'Erreur lors de l’inscription');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-lg w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Inscription à la formation</h1>
          <p className="text-sm text-slate-500">Veuillez remplir vos coordonnées pour valider votre place.</p>
        </div>

        {submitted ? (
          <div className="p-6 bg-emerald-50 rounded-lg text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-semibold text-emerald-900 text-lg">Inscription enregistrée !</h3>
            <p className="text-sm text-emerald-700">
              Votre demande a bien été transmise. Vous recevrez une confirmation par courriel.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700">Prénom</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Nom</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Courriel</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Téléphone (optionnel)</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Inscription en cours...' : 'Confirmer l’inscription'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
