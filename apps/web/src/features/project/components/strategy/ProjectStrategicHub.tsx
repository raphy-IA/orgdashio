import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Target,
  HandCoins,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
  CheckCircle2,
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
      badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'logframe' as const,
      label: 'Cadre Logique & Chaîne GAR',
      icon: Target,
      count: resultNodes?.length || 0,
      badge: `${resultNodes?.length || 0} niveaux`,
      badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'funding' as const,
      label: 'Bailleurs & Financements',
      icon: HandCoins,
      count: fundingSources?.length || 0,
      badge: budget > 0 ? `${fundingRate}% couvert` : `${fundingSources?.length || 0} source(s)`,
      badgeCls: fundingRate >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'team' as const,
      label: 'Gouvernance & Matrice RACI 2D',
      icon: ShieldCheck,
      count: members?.length || 0,
      badge: `${members?.length || 0} membres`,
      badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Strategic Hub Header Banner - Light, Crisp & Modern */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Pilier 1 · Cadrage & Stratégie
              </span>
              <span className="text-xs text-slate-400 font-medium">Standard GAR / RBM & PMI PMBOK</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Orientation Stratégique & Cadre de Référence
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1 leading-relaxed">
              Structurez les fondations du projet : note de cadrage officielle, chaîne des résultats (Impact &rarr; Outcomes &rarr; Outputs), conventions de bailleurs et gouvernance RACI 2D.
            </p>
          </div>

          {/* Key KPIs Pill Strip */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-center min-w-[105px] shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">Cadre Logique</div>
              <div className="text-lg font-bold text-blue-700">
                {resultNodes?.length || 0} <span className="text-[11px] font-normal text-slate-400">nœuds</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-center min-w-[105px] shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">Couverture Budget</div>
              <div className="text-lg font-bold text-emerald-700">
                {fundingRate}%
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-center min-w-[105px] shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">Équipe & RACI</div>
              <div className="text-lg font-bold text-purple-700">
                {members?.length || 0} <span className="text-[11px] font-normal text-slate-400">membres</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs - Wrap naturally with no scrollbar */}
        <div className="flex flex-wrap items-center gap-2 pt-4 mt-5 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100/90 p-1 border border-slate-200 shadow-2xs">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      isActive ? tab.badgeCls : 'bg-slate-200/70 text-slate-600 border-slate-300/60'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
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
