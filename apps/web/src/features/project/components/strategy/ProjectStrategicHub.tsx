import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Target,
  HandCoins,
  ShieldCheck,
  Sparkles,
  HeartHandshake,
  Building2,
  Users,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@orgdashio/ui';
import { useNavigate } from 'react-router-dom';
import { ProjectCharterView } from './ProjectCharterView';
import { ProjectLogframeView } from './ProjectLogframeView';
import { ProjectFundingView } from './ProjectFundingView';
import { ProjectRaciGovernanceView } from './ProjectRaciGovernanceView';

export type StrategySubTab = 'charter' | 'logframe' | 'funding' | 'team' | 'beneficiaries';

interface ProjectStrategicHubProps {
  project: any;
  fundingSources: any[];
  members: any[];
  planItems: any[];
  resultNodes: any[];
  raci: any[];
  orgPeople: any[];
  serviceDeliveries?: any[];
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
  onOpenAddBeneficiary?: () => void;
}

export function ProjectStrategicHub({
  project,
  fundingSources,
  members,
  planItems,
  resultNodes,
  raci,
  orgPeople,
  serviceDeliveries = [],
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
  onOpenAddBeneficiary,
}: ProjectStrategicHubProps) {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<StrategySubTab>(initialSubTab);

  // Quick summary badges
  const totalFunding = (fundingSources || []).reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
  const budget = Number(project?.budget) || 0;
  const fundingRate = budget > 0 ? Math.min(100, Math.round((totalFunding / budget) * 100)) : 0;

  const subTabs = [
    {
      id: 'charter' as const,
      label: 'Charte Projet',
      icon: FileSpreadsheet,
      badge: 'PMI',
      badgeCls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    },
    {
      id: 'logframe' as const,
      label: 'Cadre Logique',
      icon: Target,
      count: resultNodes?.length || 0,
      badge: `${resultNodes?.length || 0} nœuds`,
      badgeCls: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    },
    {
      id: 'funding' as const,
      label: 'Bailleurs & Fonds',
      icon: HandCoins,
      count: fundingSources?.length || 0,
      badge: budget > 0 ? `${fundingRate}%` : `${fundingSources?.length || 0}`,
      badgeCls: fundingRate >= 100 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    },
    {
      id: 'team' as const,
      label: 'Équipe & RACI',
      icon: ShieldCheck,
      count: members?.length || 0,
      badge: `${members?.length || 0}`,
      badgeCls: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    },
    {
      id: 'beneficiaries' as const,
      label: 'Bénéficiaires & Cibles',
      icon: HeartHandshake,
      count: serviceDeliveries?.length || 0,
      badge: `${serviceDeliveries?.length || 0}`,
      badgeCls: 'bg-pink-500/20 text-pink-300 border-pink-400/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Strategic Hub Header Banner - Refined Indigo/Slate Theme */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-indigo-900/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Pilier 1 · Stratégie
              </span>
              <span className="text-[11px] text-slate-400 font-medium">GAR / RBM & PMI PMBOK</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Cadrage Stratégique & Référence
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              Charte officielle, chaîne des résultats RBM, conventions de bailleurs et gouvernance RACI 2D.
            </p>
          </div>

          {/* Compact KPIs */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3 py-2 border border-white/10 text-center min-w-[85px]">
              <div className="text-[10px] text-slate-400 font-medium">Cadre Logique</div>
              <div className="text-base font-bold text-blue-300">{resultNodes?.length || 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3 py-2 border border-white/10 text-center min-w-[85px]">
              <div className="text-[10px] text-slate-400 font-medium">Couverture</div>
              <div className="text-base font-bold text-emerald-300">{fundingRate}%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3 py-2 border border-white/10 text-center min-w-[85px]">
              <div className="text-[10px] text-slate-400 font-medium">Membres RACI</div>
              <div className="text-base font-bold text-purple-300">{members?.length || 0}</div>
            </div>
          </div>
        </div>

        {/* Compact Sub-Navigation Tabs - Single line fit */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3.5 mt-3.5 border-t border-slate-700/60">
          <div className="inline-flex flex-wrap items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shadow-inner">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold border ${
                      isActive ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : tab.badgeCls
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

        {activeSubTab === 'beneficiaries' && (
          <div className="space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-indigo-600" />
                    Bénéficiaires & Cibles associées au projet
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Liste des personnes physiques, ménages et villages ayant bénéficié des prestations de ce projet.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (onOpenAddBeneficiary) onOpenAddBeneficiary();
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  + Affecter bénéficiaire
                </Button>
              </div>

              {serviceDeliveries.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <HeartHandshake className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="font-semibold text-slate-700">Aucune distribution ni bénéficiaire encore consigné pour ce projet</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Pour associer un bénéficiaire (individu ou village), cliquez sur <strong>« + Affecter bénéficiaire »</strong> ci-dessus.
                  </p>
                  <div className="pt-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (onOpenAddBeneficiary) onOpenAddBeneficiary();
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      + Affecter bénéficiaire
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-6 py-3">Bénéficiaire</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Prestation / Aide reçue</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Notes & Quantités</th>
                        <th className="px-6 py-3 text-right">Fiche</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {serviceDeliveries.map((s: any) => {
                        const isOrg = s.partyKind === 'organization';
                        const name = isOrg ? (s.lastName || s.firstName) : `${s.firstName || ''} ${s.lastName || ''}`.trim();
                        return (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              {name || 'Bénéficiaire'}
                            </td>
                            <td className="px-6 py-4">
                              {isOrg ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  <Building2 className="h-3 w-3" /> Village / Entité
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                                  <Users className="h-3 w-3" /> Individu
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-800">
                              {s.serviceType}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                              {s.deliveredAt ? new Date(s.deliveredAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600">
                              {s.notes || '—'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/people/${s.partyId}`)}>
                                Voir fiche
                                <ChevronRight className="ml-1 h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
