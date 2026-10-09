import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Target,
  HandCoins,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { ProjectCharterView } from './ProjectCharterView';
import { ProjectLogframeView } from './ProjectLogframeView';
import { ProjectFundingView } from './ProjectFundingView';
import { ProjectRaciGovernanceView } from './ProjectRaciGovernanceView';

export type StrategySubTab = 'charter' | 'logframe' | 'funding' | 'team';

interface ProjectStrategicHubProps {
  project: any;
  fundingSources: any[];
  members: any[];
  planItems: any[];
  resultNodes: any[];
  raci: any[];
  orgPeople: any[];
  initialSubTab?: StrategySubTab;
  onUpdateProject?: (updates: any) => Promise<void>;
  onAddResultNode: (node: any) => Promise<void>;
  onDeleteResultNode: (id: string) => Promise<void>;
  onAddFundingSource: (source: any) => Promise<void>;
  onDeleteFundingSource: (id: string) => Promise<void>;
  onAddMember: (member: any) => Promise<void>;
  onRemoveMember: (id: string) => Promise<void>;
  onSetRaciRole: (planItemId: string, projectMemberId: string, raciRole: 'R' | 'A' | 'C' | 'I' | null) => Promise<void>;
  onSelectTask?: (task: any) => void;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export function ProjectStrategicHub({
  project,
  fundingSources,
  members,
  planItems,
  resultNodes,
  raci,
  orgPeople,
  initialSubTab = 'charter',
  onUpdateProject,
  onAddResultNode,
  onDeleteResultNode,
  onAddFundingSource,
  onDeleteFundingSource,
  onAddMember,
  onRemoveMember,
  onSetRaciRole,
  onSelectTask,
  onNavigateTab,
}: ProjectStrategicHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<StrategySubTab>(initialSubTab);

  // Quick summary badges
  const totalFunding = (fundingSources || []).reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
  const budget = Number(project?.budget) || 0;
  const fundingRate = budget > 0 ? Math.min(100, Math.round((totalFunding / budget) * 100)) : 0;

  const subTabs = [
    {
      id: 'charter' as const,
      label: 'Charte & Note de Cadrage',
      icon: FileSpreadsheet,
      badge: 'PMI Standard',
      badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'logframe' as const,
      label: 'Cadre Logique & Chaîne GAR',
      icon: Target,
      count: resultNodes?.length || 0,
      badge: `${resultNodes?.length || 0} niveaux`,
      badgeCls: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'funding' as const,
      label: 'Bailleurs & Financements',
      icon: HandCoins,
      count: fundingSources?.length || 0,
      badge: budget > 0 ? `${fundingRate}% couvert` : `${fundingSources?.length || 0} bails`,
      badgeCls: fundingRate >= 100 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'team' as const,
      label: 'Gouvernance & Matrice RACI 2D',
      icon: ShieldCheck,
      count: members?.length || 0,
      badge: `${members?.length || 0} acteurs`,
      badgeCls: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Strategic Hub Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Pilier 1 · Cadrage & Stratégie
              </span>
              <span className="text-xs text-slate-400">Standard GAR / RBM & PMI PMBOK</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Orientation Stratégique & Cadre de Référence
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Structurez les fondations du projet : note de cadrage officielle, chaîne des résultats (Impact &rarr; Outcomes &rarr; Outputs), conventions de bailleurs et gouvernance RACI 2D.
            </p>
          </div>

          {/* Key KPIs Pill Strip */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[100px]">
              <div className="text-xs text-slate-400 font-medium">Cadre Logique</div>
              <div className="text-lg font-bold text-blue-300">{resultNodes?.length || 0} <span className="text-xs font-normal text-slate-400">noeuds</span></div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[100px]">
              <div className="text-xs text-slate-400 font-medium">Couverture Budget</div>
              <div className="text-lg font-bold text-emerald-300">{fundingRate}%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[100px]">
              <div className="text-xs text-slate-400 font-medium">Équipe & RACI</div>
              <div className="text-lg font-bold text-purple-300">{members?.length || 0} <span className="text-xs font-normal text-slate-400">membres</span></div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-5 mt-5 border-t border-slate-700/60 no-scrollbar">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-lg shadow-black/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    isActive ? tab.badgeCls : 'bg-white/10 text-slate-300 border-white/10'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active SubTab Component View */}
      <div className="transition-all duration-300">
        {activeSubTab === 'charter' && (
          <ProjectCharterView
            project={project}
            fundingSources={fundingSources}
            members={members}
            planItems={planItems}
            resultNodes={resultNodes}
            onUpdateProject={onUpdateProject}
            onNavigateTab={(tab, subTab) => {
              if (tab === 'strategy' && subTab) {
                setActiveSubTab(subTab as StrategySubTab);
              } else if (onNavigateTab) {
                onNavigateTab(tab, subTab);
              }
            }}
          />
        )}

        {activeSubTab === 'logframe' && (
          <ProjectLogframeView
            projectId={project.id}
            resultNodes={resultNodes}
            planItems={planItems}
            onAddResultNode={onAddResultNode}
            onDeleteResultNode={onDeleteResultNode}
            onSelectTask={onSelectTask}
          />
        )}

        {activeSubTab === 'funding' && (
          <ProjectFundingView
            projectId={project.id}
            fundingSources={fundingSources}
            projectBudgetTotal={budget}
            onAddFundingSource={onAddFundingSource}
            onDeleteFundingSource={onDeleteFundingSource}
          />
        )}

        {activeSubTab === 'team' && (
          <ProjectRaciGovernanceView
            projectId={project.id}
            members={members}
            raci={raci}
            planItems={planItems}
            orgPeople={orgPeople}
            onAddMember={onAddMember}
            onRemoveMember={onRemoveMember}
            onSetRaciRole={onSetRaciRole}
          />
        )}
      </div>
    </div>
  );
}
