import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@orgdashio/ui';
import { ShieldCheck, Building, Server } from 'lucide-react';
import { PlatformNavbar } from '../../components/PlatformNavbar';

export function PlatformConsoleScreen() {
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['platform-tenants'],
    queryFn: async () => {
      const res = await fetch('/api/v1/platform/tenants', {
        headers: { 'x-platform-admin': 'true' },
      });
      if (!res.ok) throw new Error('Erreur console super-admin');
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PlatformNavbar />
      <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center space-x-3 border-b pb-4">
        <ShieldCheck className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Console Super-Admin Plateforme</h1>
          <p className="text-xs text-slate-500">Plan de contrôle global OrgDashio (Accès restreint super-administrateur).</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="px-6 py-4 border-b font-semibold text-slate-800 flex items-center justify-between">
          <span className="flex items-center">
            <Building className="mr-2 h-4 w-4 text-indigo-600" />
            Registre des Associations & Tenants
          </span>
          <Badge variant="default">{tenants.length} Tenant(s)</Badge>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Chargement...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Nom</th>
                <th className="px-6 py-3">Slug</th>
                <th className="px-6 py-3">Mode</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Créé le</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenants.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-900">{t.name}</td>
                  <td className="px-6 py-4 font-mono text-xs">{t.slug}</td>
                  <td className="px-6 py-4 font-mono text-xs uppercase">{t.mode}</td>
                  <td className="px-6 py-4">
                    <Badge variant={t.status === 'active' ? 'success' : 'secondary'}>{t.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
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
