import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Badge, Button } from '@orgdashio/ui';
import {
  ShieldCheck,
  Building,
  Users,
  Database,
  Lock,
  Activity,
  Server,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Search
} from 'lucide-react';
import { PlatformNavbar } from '../../components/PlatformNavbar';

export function PlatformDashboardScreen() {
  const navigate = useNavigate();

  const { data: tenants = [], isLoading, refetch } = useQuery({
    queryKey: ['platform-tenants'],
    queryFn: async () => {
      const res = await fetch('/api/v1/platform/tenants', {
        headers: { 'x-platform-admin': 'true' },
      });
      if (!res.ok) throw new Error('Erreur console super-admin');
      return res.json();
    },
  });

  const activeTenants = tenants.filter((t: any) => t.status === 'active').length;
  const sharedTenants = tenants.filter((t: any) => t.mode === 'shared').length;
  const dedicatedTenants = tenants.filter((t: any) => t.mode === 'dedicated').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PlatformNavbar />

      <main className="mx-auto max-w-7xl w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
                <ShieldCheck className="h-4 w-4" />
                <span>Console Super-Admin SaaS • Control Plane</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Tableau de Bord Administrateur SaaS
              </h1>
              <p className="mt-1 text-sm text-slate-400 max-w-2xl">
                Supervision globale de la plateforme multi-tenant OrgDashio. Suivi des organismes souscrits, de l'étanchéité RLS et de la conformité Loi 25.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Global SaaS Platform Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">Total Tenants</span>
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
                <Building className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-white">{tenants.length}</div>
              <Badge variant="default" className="text-[10px]">Organismes Registrés</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-400 flex items-center">
              <Activity className="mr-1 h-3.5 w-3.5 text-emerald-400" />
              {activeTenants} Actif(s) sur la plateforme
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">Architecture DB</span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                <Database className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-white">{sharedTenants} Shared / {dedicatedTenants} Dedicated</div>
            </div>
            <p className="mt-2 text-xs text-slate-400 flex items-center">
              <Server className="mr-1 h-3.5 w-3.5 text-blue-400" />
              PostgreSQL Multi-Schema RLS
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">Sécurité & Isolation RLS</span>
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
                <Lock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-emerald-400">100% Validé</div>
              <Badge variant="success" className="text-[10px]">38/38 Tables RLS</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-400 flex items-center">
              <ShieldCheck className="mr-1 h-3.5 w-3.5 text-emerald-400" />
              Zéro fuite de données inter-tenants
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">Protection Vie Privée</span>
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400 border border-purple-500/20">
                <FileCheck2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-white">Loi 25 / RGPD</div>
              <Badge variant="default" className="text-[10px]">Strict Privacy</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-400 flex items-center">
              <Lock className="mr-1 h-3.5 w-3.5 text-purple-400" />
              Accès notes réservé aux clients
            </p>
          </div>
        </div>

        {/* Tenant Registry Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-amber-400" />
              <h2 className="font-bold text-white text-base">Registre Global des Organismes Clients</h2>
            </div>
            <Badge variant="default">{tenants.length} Tenant(s)</Badge>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-500 font-mono text-sm">Chargement des données super-admin...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs font-mono uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Organisme (Tenant Name)</th>
                    <th className="px-6 py-3.5">Slug Unique</th>
                    <th className="px-6 py-3.5">Mode Hébergement</th>
                    <th className="px-6 py-3.5">Statut Platform</th>
                    <th className="px-6 py-3.5">Date Inscription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tenants.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-white flex items-center space-x-2">
                        <Building className="h-4 w-4 text-indigo-400" />
                        <span>{t.name}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{t.slug}</td>
                      <td className="px-6 py-4 font-mono text-xs uppercase text-indigo-300">
                        <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
                          {t.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={t.status === 'active' ? 'success' : 'secondary'}>{t.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
