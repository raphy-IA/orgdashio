import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, ExternalLink, Inbox, Check } from 'lucide-react';
import { Button, Badge } from '@orgdashio/ui';

interface NotificationItem {
  id: string;
  eventType: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/v1/notifications');
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30000, // Polling every 30s
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/v1/notifications/read-all', { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/v1/notifications/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const clearAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/v1/notifications/read', { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
    if (item.linkUrl) {
      setOpen(false);
      navigate(item.linkUrl);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 1) return "À l'instant";
      if (diffMin < 60) return `Il y a ${diffMin} min`;
      if (diffHours < 24) return `Il y a ${diffHours} h`;
      if (diffDays === 1) return 'Hier';
      return date.toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        aria-label="Centre de notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[1rem] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl border border-slate-200/80 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-sm">Notifications</span>
              {unreadCount > 0 ? (
                <Badge variant="warning" className="text-[10px] px-2 py-0.5 font-bold">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </Badge>
              ) : (
                <Badge variant="default" className="text-[10px] bg-slate-100 text-slate-600 font-medium">
                  À jour
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="p-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 font-medium"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tout lire</span>
                </button>
              )}
              {notifications.some((n) => n.isRead) && (
                <button
                  onClick={() => clearAllReadMutation.mutate()}
                  disabled={clearAllReadMutation.isPending}
                  className="p-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Effacer les notifications lues"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Vous n'avez aucune notification</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Toutes vos alertes et activités de projets s'afficheront ici.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 text-xs transition-colors flex items-start justify-between gap-2 group ${
                    !n.isRead ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div
                    onClick={() => handleNotificationClick(n)}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-indigo-600 flex-shrink-0" />
                      )}
                      <span className={`font-semibold text-slate-900 ${!n.isRead ? 'text-indigo-950 font-bold' : ''}`}>
                        {n.title}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed text-[11px] line-clamp-2">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <span>{formatRelativeTime(n.createdAt)}</span>
                      {n.linkUrl && (
                        <span className="text-indigo-600 flex items-center gap-0.5 font-medium">
                          Consulter <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick actions per notification item */}
                  <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && (
                      <button
                        onClick={() => markReadMutation.mutate(n.id)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                        title="Marquer comme lu"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotificationMutation.mutate(n.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

