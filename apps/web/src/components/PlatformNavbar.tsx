import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Badge } from '@orgdashio/ui';
import { ShieldCheck, Building, Server, LogOut, ArrowLeft } from 'lucide-react';

import { useAuth } from '../features/auth/AuthContext';

export function PlatformNavbar() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-slate-900 text-white px-6 py-3 shadow-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-amber-400 font-black text-xl tracking-tight">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
            <span>OrgDashio <span className="text-xs font-mono font-semibold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded uppercase">Console SaaS Admin</span></span>
          </div>
        </div>

        <nav className="flex items-center space-x-4">
          <Link
            to="/platform/dashboard"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <Building className="h-3.5 w-3.5 text-amber-400" />
            <span>Tableau de Bord SaaS</span>
          </Link>
          <Link
            to="/projects"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Retour Espace Client</span>
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800" onClick={handleLogout}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  );
}
