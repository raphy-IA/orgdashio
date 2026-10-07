import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@orgdashio/ui';
import { History, ShieldAlert } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export function AuditLogScreen() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await fetch('/api/v1/audit-logs');
      if (!res.ok) throw new Error('Erreur chargement journaux');
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <History className="h-6 w-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-slate-900">Journal d'Audit Immuable</h1>
      </div>

      <div className="rounded-lg border bg-amber-50/50 p-4 border-amber-200 text-sm text-amber-800 flex items-start space-x-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          Les enregistrements ci-dessous sont enregistrés de façon immuable. Aucune donnée personnelle (PII) n'est consignée dans le corps de l'audit conformément à la conformité Loi 25 / LPRPDE.
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Chargement...</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Aucune activité enregistrée.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Date (UTC)</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Entité</th>
                <th className="px-6 py-3">ID Entité</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono text-xs">{new Date(log.createdAt).toISOString()}</td>
                  <td className="px-6 py-4">
                    <Badge variant="default">{log.action}</Badge>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{log.entityType}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.entityId}</td>
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
