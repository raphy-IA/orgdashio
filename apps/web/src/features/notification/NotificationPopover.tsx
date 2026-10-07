import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Button, Badge } from '@orgdashio/ui';

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/v1/notifications');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-white shadow-lg z-50 p-4">
          <div className="flex items-center justify-between border-b pb-2 mb-2 font-bold text-slate-800 text-sm">
            <span>Notifications</span>
            {unreadCount > 0 && <Badge variant="warning">{unreadCount} non lue(s)</Badge>}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Aucune notification.</p>
            ) : (
              notifications.map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => markReadMutation.mutate(n.id)}
                  className={`p-2 text-xs rounded cursor-pointer transition-colors ${
                    !n.isRead ? 'bg-indigo-50/50 font-medium' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-slate-800">{n.title}</div>
                  <div className="text-slate-600 mt-0.5">{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
