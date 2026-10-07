import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@orgdashio/ui';
import {
  FolderKanban,
  Users,
  GraduationCap,
  ShieldAlert,
  BarChart3,
  UserPlus,
  History,
  LogOut,
  LayoutDashboard,
  Building2,
  Shield,
  User,
  Settings,
  ChevronDown,
  Key,
  Lock,
} from 'lucide-react';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: meData } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      const res = await fetch('/api/v1/auth/me');
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const tenant = meData?.tenant;
  const user = meData?.user;

  const tenantName = tenant?.name || 'Mon Organisme';
  const tenantLogoUrl = tenant?.logoUrl;
  const tenantAcronym = tenant?.acronym;

  const userEmail = user?.email || '';
  const userFirstName = user?.firstName || '';
  const userLastName = user?.lastName || '';
  const userAvatarUrl = user?.avatarUrl;
  const userFullName = userFirstName || userLastName 
    ? `${userFirstName} ${userLastName}`.trim() 
    : userEmail.split('@')[0];
  const userRole = user?.roles?.[0]?.name || (user?.isPlatformAdmin ? 'SuperAdmin' : 'Utilisateur');

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    navigate('/login');
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/projects', label: 'Projets', icon: FolderKanban },
    { path: '/people', label: 'Personnes & Équipe', icon: Users },
    { path: '/training', label: 'Formations', icon: GraduationCap },
    { path: '/cases', label: 'Suivi de cas', icon: ShieldAlert },
    { path: '/dashboard/impact', label: 'Impact & Indicateurs', icon: BarChart3 },
  ];

  const getInitials = (text: string) => {
    if (!text) return 'U';
    const parts = text.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return text.substring(0, 2).toUpperCase();
  };

  return (
    <header className="border-b bg-white px-4 py-2 shadow-sm sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Left: Organization Brand (White-Label - No OrgDashio branding) */}
        <Link to="/dashboard" className="flex items-center space-x-3 group shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold overflow-hidden shadow-sm">
            {tenantLogoUrl ? (
              <img
                src={tenantLogoUrl}
                alt={tenantName}
                className="h-full w-full object-contain p-0.5"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Building2 className="h-5 w-5 text-indigo-600" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors max-w-[220px] truncate">
              {tenantName}
            </span>
            {tenantAcronym && (
              <span className="text-[11px] font-medium text-slate-500">{tenantAcronym}</span>
            )}
          </div>
        </Link>

        {/* Center: Main Operational Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Language & User Profile Dropdown */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-semibold px-2 py-1 h-8"
            onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
          >
            {i18n.language.toUpperCase()}
          </Button>

          {/* User Profile Trigger & Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-expanded={profileDropdownOpen}
            >
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={userFullName}
                  className="h-8 w-8 rounded-full object-cover border border-slate-200 shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white font-bold text-xs shadow-xs">
                  {getInitials(userFullName || userEmail)}
                </div>
              )}
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight max-w-[130px] truncate">
                  {userFullName}
                </span>
                <span className="text-[10px] text-indigo-600 font-medium leading-tight">
                  {userRole}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Header info */}
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{userFullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                      {userRole}
                    </span>
                  </div>
                </div>

                {/* Profile & Settings Links */}
                <div className="py-1 text-xs">
                  <Link
                    to="/settings/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <User className="mr-2.5 h-4 w-4 text-slate-400" />
                    <span>Mon Profil & Sécurité</span>
                  </Link>
                  <Link
                    to="/settings/organization"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <Building2 className="mr-2.5 h-4 w-4 text-slate-400" />
                    <span>Paramètres de l'Organisme & Logo</span>
                  </Link>
                  <Link
                    to="/settings/privacy"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <Shield className="mr-2.5 h-4 w-4 text-slate-400" />
                    <span>Conformité Loi 25 & Confidentialité</span>
                  </Link>
                  <Link
                    to="/settings/team"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <UserPlus className="mr-2.5 h-4 w-4 text-slate-400" />
                    <span>Accès & Invitations de l'Équipe</span>
                  </Link>
                  <Link
                    to="/settings/audit"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <History className="mr-2.5 h-4 w-4 text-slate-400" />
                    <span>Journal d'audit de sécurité</span>
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="mr-2.5 h-4 w-4 text-red-500" />
                    <span>{t('common.logout') || 'Déconnexion'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-bar for Mobile / Tablet screens displaying all main nav links */}
      <nav className="flex lg:hidden overflow-x-auto pt-2 border-t mt-2 space-x-1.5 pb-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex shrink-0 items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
