import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import { Mail, UserPlus, Shield } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export function TeamInvitationsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [error, setError] = useState('');
  const [invitationLink, setInvitationLink] = useState('');

  // Fetch Invitations
  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const res = await fetch('/api/v1/invitations');
      if (!res.ok) throw new Error('Erreur chargement invitations');
      return res.json();
    },
  });

  // Send Invitation Mutation
  const sendMutation = useMutation({
    mutationFn: async (input: { email: string; roleId: string }) => {
      const res = await fetch('/api/v1/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur envoi invitation');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setEmail('');
      setInvitationLink(`${window.location.origin}/invite/accept?token=${data.rawToken}`);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInvitationLink('');
    sendMutation.mutate({ email, roleId: roleId || '00000000-0000-0000-0000-000000000000' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Membres & Invitations d'Équipe</h1>
          <p className="text-sm text-slate-500">Invitez vos collaborateurs et gérez les accès au tenant.</p>
        </div>
      </div>

      {/* Formulaire d'invitation */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <UserPlus className="mr-2 h-5 w-5 text-indigo-600" />
          Inviter un membre
        </h2>

        {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {invitationLink && (
          <div className="mb-4 rounded bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="font-semibold mb-1">Invitation générée avec succès !</div>
            <div className="font-mono text-xs break-all bg-white p-2 rounded border">{invitationLink}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <Input
              label="Courriel du membre"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collaborateur@association.org"
              required
            />
          </div>
          <Button type="submit" disabled={sendMutation.isPending}>
            <Mail className="mr-2 h-4 w-4" />
            Envoyer l'invitation
          </Button>
        </form>
      </div>

      {/* Table des invitations */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="px-6 py-4 border-b font-semibold text-slate-800">Invitations en attente</div>
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Chargement...</div>
        ) : invitations.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Aucune invitation en attente.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Courriel</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Expiration</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invitations.map((inv: any) => (
                <tr key={inv.id}>
                  <td className="px-6 py-4 font-medium text-slate-900">{inv.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant={inv.status === 'accepted' ? 'success' : 'warning'}>{inv.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{new Date(inv.expiresAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </div>
  );
}
