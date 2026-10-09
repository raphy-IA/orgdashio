import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Layers,
  Scale,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ProjectCockpitView } from './ProjectCockpitView';
import { EarnedValueManagementView } from './EarnedValueManagementView';
import { MilestonesDeliverablesView } from './MilestonesDeliverablesView';
import { RaidHeatmapView } from './RaidHeatmapView';
import { CopilFlashReportView } from './CopilFlashReportView';

export type MonitoringSubTab = 'cockpit' | 'evm' | 'milestones' | 'raid' | 'report';

interface ProjectMonitoringHubProps {
  project: any;
  planItems: any[];
  expenses: any[];
  members: any[];
  deliverables: any[];
  updates: any[];
  raidItems: any[];
  fundingSources: any[];
  initialSubTab?: MonitoringSubTab;
  onSelectTask?: (task: any) => void;
  onApproveDeliverable?: (delivId: string) => Promise<void>;
  onRejectDeliverable?: (delivId: string, reason: string) => Promise<void>;
  onAddRaidItem: (item: any) => Promise<void>;
  onDeleteRaidItem: (id: string) => Promise<void>;
}

export function ProjectMonitoringHub({
  project,
  planItems,
  expenses,
  members,
  deliverables,
  updates,
  raidItems,
  fundingSources,
  initialSubTab = 'cockpit',
  onSelectTask,
  onApproveDeliverable,
  onRejectDeliverable,
  onAddRaidItem,
  onDeleteRaidItem,
}: ProjectMonitoringHubProps) {
  const [subTab, setSubTab] = useState<MonitoringSubTab>(initialSubTab);

  const pendingDeliverablesCount = deliverables.filter((d) => d.status === 'pending').length;
  const blockedTasksCount = planItems.filter((p) => p.status === 'blocked').length;

  const SUB_TABS = [
    {
      key: 'cockpit' as MonitoringSubTab,
      label: 'Cockpit Exécutif 360°',
      icon: Activity,
      badge: blockedTasksCount > 0 ? `${blockedTasksCount} bloqué` : null,
      badgeCls: 'bg-red-100 text-red-700 font-bold',
    },
    {
      key: 'evm' as MonitoringSubTab,
      label: 'Valeur Acquise (EVM) & Courbe en S',
      icon: TrendingUp,
      badge: null,
      badgeCls: '',
    },
    {
      key: 'milestones' as MonitoringSubTab,
      label: 'Jalons & Visas Qualité',
      icon: FileCheck,
      badge: pendingDeliverablesCount > 0 ? `${pendingDeliverablesCount} à viser` : null,
      badgeCls: 'bg-amber-100 text-amber-800 font-bold',
    },
    {
      key: 'raid' as MonitoringSubTab,
      label: `Radar & Matrice RAID (${raidItems.length})`,
      icon: AlertTriangle,
      badge: null,
      badgeCls: '',
    },
    {
      key: 'report' as MonitoringSubTab,
      label: 'Rapport Flash COPIL',
      icon: FileText,
      badge: 'PDF',
      badgeCls: 'bg-indigo-100 text-indigo-700 font-mono font-bold',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Sub-Navigation Pill Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-2xs">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSubTab(tab.key)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${tab.badgeCls}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Sub-Tab View ── */}
      {subTab === 'cockpit' && (
        <ProjectCockpitView
          project={project}
          planItems={planItems}
          expenses={expenses}
          members={members}
          deliverables={deliverables}
          updates={updates}
          raidItems={raidItems}
          onSelectTask={onSelectTask}
          onNavigateTab={(_, targetSubTab) => {
            if (targetSubTab) setSubTab(targetSubTab as MonitoringSubTab);
          }}
        />
      )}

      {subTab === 'evm' && (
        <EarnedValueManagementView
          tasks={planItems}
          expenses={expenses}
          budgetTotal={parseFloat(project?.budgetTotal || '0') || 0}
        />
      )}

      {subTab === 'milestones' && (
        <MilestonesDeliverablesView
          projectId={project.id}
          planItems={planItems}
          deliverables={deliverables}
          members={members}
          onSelectTask={onSelectTask}
          onApproveDeliverable={onApproveDeliverable}
          onRejectDeliverable={onRejectDeliverable}
        />
      )}

      {subTab === 'raid' && (
        <RaidHeatmapView
          raidItems={raidItems}
          planItems={planItems}
          updates={updates}
          members={members}
          onAddRaidItem={onAddRaidItem}
          onDeleteRaidItem={onDeleteRaidItem}
          onSelectTask={onSelectTask}
        />
      )}

      {subTab === 'report' && (
        <CopilFlashReportView
          project={project}
          planItems={planItems}
          expenses={expenses}
          members={members}
          deliverables={deliverables}
          updates={updates}
          raidItems={raidItems}
          fundingSources={fundingSources}
        />
      )}
    </div>
  );
}
