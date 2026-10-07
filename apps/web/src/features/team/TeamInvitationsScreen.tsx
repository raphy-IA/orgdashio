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

  // Fetch Active Members
  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await fetch('/api/v1/invitations/members');
      if (!res.ok) throw new Error('Erreur chargement membres');
      return res.json();
    },
  });

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
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Membres & Accès Informatiques</h1>
            <p className="text-sm text-slate-500">
              Visualisez les comptes utilisateurs de votre organisme et invitez de nouveaux collaborateurs.
            </p>
          </div>
        </div>

        {/* 1. Tableau des Membres Actifs du Compte (Admin + Utilisateurs) */}
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-base">Comptes Utilisateurs Actifs</h2>
            </div>
            <Badge variant="default">{members.length} Compte(s)</Badge>
          </div>

          {isMembersLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Chargement des membres...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Aucun compte actif trouvé.</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-mono uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-3">Utilisateur</th>
                  <th className="px-6 py-3">Courriel</th>
                  <th className="px-6 py-3">Rôles & Permissions</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Date d'inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m: any) => {
                  const isAdmin = m.roles?.some((r: any) => r.code === 'admin');
                  const fullName = m.user?.firstName || m.user?.lastName
                    ? `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim()
                    : 'Administrateur Principal';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                            {fullName.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {fullName}
                              {isAdmin && (
                                <Badge variant="default" className="text-[10px] bg-indigo-100 text-indigo-800 border-indigo-200">
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{m.user?.jobTitle || 'Membre de l’organisation'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-700">{m.user?.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {m.roles?.length > 0 ? (
                            m.roles.map((r: any) => (
                              <Badge key={r.id} variant="secondary" className="text-[11px]">
                                {r.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">Aucun rôle</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={m.status === 'active' ? 'success' : 'secondary'} className="text-[11px]">
                          {m.status === 'active' ? 'Actif' : m.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 2. Formulaire d'invitation */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <UserPlus className="mr-2 h-5 w-5 text-indigo-600" />
            Inviter un nouveau collaborateur
          </h2>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {invitationLink && (
            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
              <div className="font-semibold mb-1">Invitation générée avec succès !</div>
              <p className="text-xs text-emerald-700 mb-2">Transmettez ce lien sécurisé au collaborateur :</p>
              <div className="font-mono text-xs break-all bg-white p-2.5 rounded border border-emerald-300">{invitationLink}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Input
                label="Courriel du nouveau membre"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collaborateur@organisation.org"
                required
              />
            </div>
            <Button type="submit" disabled={sendMutation.isPending} className="font-bold shrink-0">
              <Mail className="mr-2 h-4 w-4" />
              {sendMutation.isPending ? 'Envoi...' : "Envoyer l'invitation"}
            </Button>
          </form>
        </div>

        {/* 3. Table des invitations en attente */}
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="px-6 py-4 border-b font-semibold text-slate-800 bg-slate-50/50">
            Invitations en attente d'acceptation
          </div>
          {isLoading ? (
            <div className="p-6 text-center text-slate-500 text-sm">Chargement...</div>
          ) : invitations.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">Aucune invitation en attente.</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-3">Courriel</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Date d'expiration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="px-6 py-4 font-medium text-slate-900 font-mono text-xs">{inv.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={inv.status === 'accepted' ? 'success' : 'warning'}>{inv.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-mono">{new Date(inv.expiresAt).toLocaleDateString()}</td>
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
