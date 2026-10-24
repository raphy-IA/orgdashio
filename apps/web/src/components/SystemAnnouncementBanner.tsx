import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BellRing, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

export function SystemAnnouncementBanner() {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const { data: announcements = [] } = useQuery({
    queryKey: ['active-system-announcements'],
    queryFn: async () => {
      const res = await fetch('/api/v1/notifications/announcements');
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 60000, // Check for new announcements every minute
  });

  const visibleAnnouncements = announcements.filter(
    (a: any) => a.isActive && !dismissedIds.includes(a.id)
  );

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-1">
      {visibleAnnouncements.map((ann: any) => {
        let bgStyle = 'bg-blue-600 text-white border-blue-700';
        let Icon = Info;

        if (ann.severity === 'warning') {
          bgStyle = 'bg-amber-600 text-white border-amber-700';
          Icon = AlertTriangle;
        } else if (ann.severity === 'critical') {
          bgStyle = 'bg-rose-700 text-white border-rose-800 animate-pulse';
          Icon = AlertOctagon;
        }

        return (
          <div
            key={ann.id}
            className={`px-4 py-2 border-b flex items-center justify-between text-xs font-medium shadow-sm transition-all ${bgStyle}`}
          >
            <div className="flex items-center space-x-2.5 max-w-5xl mx-auto flex-1">
              <Icon className="h-4 w-4 shrink-0" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="font-bold tracking-wide">{ann.title}</span>
                <span className="opacity-95">{ann.message}</span>
              </div>
            </div>
            <button
              onClick={() => setDismissedIds((prev) => [...prev, ann.id])}
              className="ml-4 p-1 hover:bg-black/20 rounded text-white/80 hover:text-white transition shrink-0"
              title="Fermer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
