import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  Clock,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  Send,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  PieChart,
  Settings,
  FolderKanban,
  Landmark,
  FileText,
  User,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';

type TimesheetTab = 'my_timesheet' | 'approvals' | 'analytics' | 'hr_profiles';

interface TimesheetEntryItem {
  id?: string;
  entryDate: string;
  hours: number;
  activityType: string;
  description?: string;
  projectId?: string;
  grantId?: string;
  planItemId?: string;
  isBillable?: boolean;
  hourlyRate?: number;
}

interface TimesheetRow {
  key: string;
  projectId: string;
  grantId: string;
  activityType: string;
  description: string;
  isBillable: boolean;
  mondayHours: number;
  tuesdayHours: number;
  wednesdayHours: number;
  thursdayHours: number;
  fridayHours: number;
  saturdayHours: number;
  sundayHours: number;
}

export function TimesheetScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TimesheetTab>('my_timesheet');
  const [currentWeekMonday, setCurrentWeekMonday] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().substring(0, 10);
  });

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTimesheetId, setRejectTimesheetId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  // HR Profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [profileFormData, setProfileFormData] = useState({
    employeeNumber: '',
    jobTitle: '',
    department: '',
    contractType: 'full_time',
    standardWeeklyHours: '35',
    defaultHourlyRate: '35.00',
    volunteerImputedRate: '25.00',
    active: true,
  });

  // Shift week navigation
  const handlePreviousWeek = () => {
    const d = new Date(currentWeekMonday);
    d.setDate(d.getDate() - 7);
    setCurrentWeekMonday(d.toISOString().substring(0, 10));
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekMonday);
    d.setDate(d.getDate() + 7);
    setCurrentWeekMonday(d.toISOString().substring(0, 10));
  };

  const handleCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    setCurrentWeekMonday(mon.toISOString().substring(0, 10));
  };

  // 1. Fetch current user & auth
  const { data: meData } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      const res = await fetch('/api/v1/auth/me');
      if (!res.ok) return null;
      return res.json();
    },
  });
  const currentUserId = meData?.user?.id;

  // 2. Fetch Projects and Grants for dropdowns
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects');
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : json.data || [];
    },
  });

  const { data: grantsData } = useQuery({
    queryKey: ['grants'],
    queryFn: async () => {
      const res = await fetch('/api/v1/grants');
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : json.data || [];
    },
  });

  // 3. Fetch Timesheet for current week
  const { data: currentTimesheet, isLoading: loadingTimesheet } = useQuery({
    queryKey: ['timesheetWeek', currentWeekMonday, currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const res = await fetch(`/api/v1/timesheets/weekly?weekStartDate=${currentWeekMonday}`);
      if (!res.ok) throw new Error('Erreur lors du chargement de la feuille de temps');
      return res.json();
    },
    enabled: !!currentUserId,
  });

  // 4. Fetch All Timesheets for Approvals & KPIs
  const { data: allTimesheetsData, isLoading: loadingAll } = useQuery({
    queryKey: ['allTimesheets'],
    queryFn: async () => {
      const res = await fetch('/api/v1/timesheets');
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : json.data || [];
    },
  });

  // 5. Fetch Analytical Allocations
  const { data: analyticsData } = useQuery({
    queryKey: ['timesheetAnalytics'],
    queryFn: async () => {
      const res = await fetch('/api/v1/timesheets/analytics/allocations');
      if (!res.ok) return { byProject: [], byGrant: [], byActivity: [] };
      return res.json();
    },
  });

  // 6. Fetch HR Profiles
  const { data: hrProfilesData = [], isLoading: isLoadingHrProfiles } = useQuery({
    queryKey: ['hrProfiles'],
    queryFn: async () => {
      const res = await fetch('/api/v1/timesheets/hr-profiles');
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : json.data || [];
    },
  });

  // Compute Days for current week
  const weekDates = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const d = new Date(currentWeekMonday);
    d.setDate(d.getDate() + offset);
    return d.toISOString().substring(0, 10);
  });

  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Local grid rows state
  const [rows, setRows] = useState<TimesheetRow[]>([]);

  // Synchronize rows when currentTimesheet data loads
  useEffect(() => {
    if (currentTimesheet?.entries && Array.isArray(currentTimesheet.entries)) {
      const entries: TimesheetEntryItem[] = currentTimesheet.entries;
      // Group entries into rows by projectId + grantId + activityType + description
      const groupMap = new Map<string, TimesheetRow>();

      entries.forEach((entry) => {
        const pId = entry.projectId || '';
        const gId = entry.grantId || '';
        const act = entry.activityType || 'direct_program';
        const desc = entry.description || '';
        const bill = entry.isBillable ?? true;
        const key = `${pId}_${gId}_${act}_${desc}`;

        if (!groupMap.has(key)) {
          groupMap.set(key, {
            key,
            projectId: pId,
            grantId: gId,
            activityType: act,
            description: desc,
            isBillable: bill,
            mondayHours: 0,
            tuesdayHours: 0,
            wednesdayHours: 0,
            thursdayHours: 0,
            fridayHours: 0,
            saturdayHours: 0,
            sundayHours: 0,
          });
        }

        const row = groupMap.get(key)!;
        const entryDate = entry.entryDate.substring(0, 10);
        const dayIdx = weekDates.indexOf(entryDate);
        const h = Number(entry.hours || 0);

        if (dayIdx === 0) row.mondayHours += h;
        else if (dayIdx === 1) row.tuesdayHours += h;
        else if (dayIdx === 2) row.wednesdayHours += h;
        else if (dayIdx === 3) row.thursdayHours += h;
        else if (dayIdx === 4) row.fridayHours += h;
        else if (dayIdx === 5) row.saturdayHours += h;
        else if (dayIdx === 6) row.sundayHours += h;
      });

      const loadedRows = Array.from(groupMap.values());
      if (loadedRows.length === 0) {
        setRows([
          {
            key: 'default-row-1',
            projectId: '',
            grantId: '',
            activityType: 'direct_program',
            description: '',
            isBillable: true,
            mondayHours: 0,
            tuesdayHours: 0,
            wednesdayHours: 0,
            thursdayHours: 0,
            fridayHours: 0,
            saturdayHours: 0,
            sundayHours: 0,
          },
        ]);
      } else {
        setRows(loadedRows);
      }
    } else {
      setRows([
        {
          key: 'default-row-1',
          projectId: '',
          grantId: '',
          activityType: 'direct_program',
          description: '',
          isBillable: true,
          mondayHours: 0,
          tuesdayHours: 0,
          wednesdayHours: 0,
          thursdayHours: 0,
          fridayHours: 0,
          saturdayHours: 0,
          sundayHours: 0,
        },
      ]);
    }
  }, [currentTimesheet, currentWeekMonday]);

  // Handle row mutations
  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        key: `row-${Date.now()}`,
        projectId: '',
        grantId: '',
        activityType: 'direct_program',
        description: '',
        isBillable: true,
        mondayHours: 0,
        tuesdayHours: 0,
        wednesdayHours: 0,
        thursdayHours: 0,
        fridayHours: 0,
        saturdayHours: 0,
        sundayHours: 0,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof TimesheetRow, value: any) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Convert matrix rows back into flat TimesheetEntry array for backend
  const buildFlatEntries = () => {
    const flatEntries: any[] = [];
    rows.forEach((row) => {
      const days = [
        { date: weekDates[0], hours: Number(row.mondayHours) || 0 },
        { date: weekDates[1], hours: Number(row.tuesdayHours) || 0 },
        { date: weekDates[2], hours: Number(row.wednesdayHours) || 0 },
        { date: weekDates[3], hours: Number(row.thursdayHours) || 0 },
        { date: weekDates[4], hours: Number(row.fridayHours) || 0 },
        { date: weekDates[5], hours: Number(row.saturdayHours) || 0 },
        { date: weekDates[6], hours: Number(row.sundayHours) || 0 },
      ];

      days.forEach((d) => {
        if (d.hours > 0) {
          flatEntries.push({
            entryDate: d.date,
            hours: d.hours,
            activityType: row.activityType,
            description: row.description || undefined,
            projectId: row.projectId || undefined,
            grantId: row.grantId || undefined,
            isBillable: row.isBillable,
          });
        }
      });
    });
    return flatEntries;
  };

  // Save entries mutation
  const saveEntriesMutation = useMutation({
    mutationFn: async () => {
      if (!currentTimesheet?.id) return;
      const entries = buildFlatEntries();
      const res = await fetch(`/api/v1/timesheets/${currentTimesheet.id}/entries/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      if (!res.ok) throw new Error('Erreur lors de la sauvegarde des heures');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheetWeek'] });
      queryClient.invalidateQueries({ queryKey: ['allTimesheets'] });
      queryClient.invalidateQueries({ queryKey: ['timesheetAnalytics'] });
    },
  });

  // Submit timesheet mutation
  const submitTimesheetMutation = useMutation({
    mutationFn: async () => {
      if (!currentTimesheet?.id) return;
      // First save current entries
      const entries = buildFlatEntries();
      await fetch(`/api/v1/timesheets/${currentTimesheet.id}/entries/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });

      const res = await fetch(`/api/v1/timesheets/${currentTimesheet.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' }),
      });
      if (!res.ok) throw new Error('Erreur lors de la soumission de la feuille');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheetWeek'] });
      queryClient.invalidateQueries({ queryKey: ['allTimesheets'] });
      queryClient.invalidateQueries({ queryKey: ['timesheetAnalytics'] });
    },
  });

  // Manager Approval mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await fetch(`/api/v1/timesheets/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes: notes }),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour du statut');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTimesheets'] });
      queryClient.invalidateQueries({ queryKey: ['timesheetWeek'] });
      queryClient.invalidateQueries({ queryKey: ['timesheetAnalytics'] });
      setRejectModalOpen(false);
      setRejectTimesheetId(null);
      setRejectComment('');
    },
  });

  // Save HR Profile mutation
  const saveHrProfileMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/v1/timesheets/hr-profiles/${selectedUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Erreur lors de la mise à jour du profil RH');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrProfiles'] });
      setProfileModalOpen(false);
    },
  });

  // Calculation summaries
  const dailyTotals = [0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
    return rows.reduce((sum, r) => {
      if (dayIdx === 0) return sum + (Number(r.mondayHours) || 0);
      if (dayIdx === 1) return sum + (Number(r.tuesdayHours) || 0);
      if (dayIdx === 2) return sum + (Number(r.wednesdayHours) || 0);
      if (dayIdx === 3) return sum + (Number(r.thursdayHours) || 0);
      if (dayIdx === 4) return sum + (Number(r.fridayHours) || 0);
      if (dayIdx === 5) return sum + (Number(r.saturdayHours) || 0);
      if (dayIdx === 6) return sum + (Number(r.sundayHours) || 0);
      return sum;
    }, 0);
  });

  const weekGrandTotalHours = dailyTotals.reduce((a, b) => a + b, 0);

  // Global KPIs from all timesheets
  const totalHoursLogged = Array.isArray(allTimesheetsData)
    ? allTimesheetsData.reduce((acc, ts) => acc + Number(ts.totalHours || 0), 0)
    : 0;
  const totalCostValuation = Array.isArray(allTimesheetsData)
    ? allTimesheetsData.reduce((acc, ts) => acc + Number(ts.totalCost || 0), 0)
    : 0;
  const approvedHoursCount = Array.isArray(allTimesheetsData)
    ? allTimesheetsData
        .filter((ts) => ts.status === 'approved')
        .reduce((acc, ts) => acc + Number(ts.totalHours || 0), 0)
    : 0;
  const pendingApprovalsCount = Array.isArray(allTimesheetsData)
    ? allTimesheetsData.filter((ts) => ts.status === 'submitted').length
    : 0;

  const currentStatus = currentTimesheet?.status || 'draft';
  const isReadOnly = currentStatus === 'approved' || currentStatus === 'submitted';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-300">Approuvé</Badge>;
      case 'submitted':
        return <Badge variant="warning" className="bg-amber-100 text-amber-800 border-amber-300">En attente d'approbation</Badge>;
      case 'rejected':
        return <Badge variant="danger" className="bg-rose-100 text-rose-800 border-rose-300">Rejeté / À corriger</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300">Brouillon</Badge>;
    }
  };

  const activityTypeOptions = [
    { value: 'direct_program', label: 'Projet / Programme direct' },
    { value: 'case_management', label: 'Suivi de cas / Intervention' },
    { value: 'training_delivery', label: 'Animation formation' },
    { value: 'admin_management', label: 'Administration / Coordination' },
    { value: 'fundraising', label: 'Recherche de fonds / Bailleurs' },
    { value: 'governance', label: 'Conseil / Gouvernance' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Feuilles de Temps & Valorisation RH
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Suivi hebdomadaire des heures, imputation analytique par projet et valorisation du temps bénévole/salarié.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCurrentWeek}
              className="text-xs font-semibold"
            >
              Semaine actuelle
            </Button>
          </div>
        </div>

        {/* Top Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Heures Déclarées</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalHoursLogged.toFixed(1)} h</h3>
              <p className="text-xs text-slate-400 mt-1">Cumul total organisation</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valorisation RH</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {totalCostValuation.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">Coût analytique imputé</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Heures Approuvées</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{approvedHoursCount.toFixed(1)} h</h3>
              <p className="text-xs text-slate-400 mt-1">
                {totalHoursLogged > 0 ? `${((approvedHoursCount / totalHoursLogged) * 100).toFixed(0)}% validé` : '0% validé'}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">En Attente Validation</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{pendingApprovalsCount}</h3>
              <p className="text-xs text-slate-400 mt-1">Feuilles soumises RH</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-6 space-x-8">
          <button
            onClick={() => setActiveTab('my_timesheet')}
            className={`pb-4 px-1 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'my_timesheet'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Ma Feuille Hebdomadaire</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`pb-4 px-1 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'approvals'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Validation & Approbations</span>
            {pendingApprovalsCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-4 px-1 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Ventilation Analytique</span>
          </button>

          <button
            onClick={() => setActiveTab('hr_profiles')}
            className={`pb-4 px-1 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'hr_profiles'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Profils RH & Taux</span>
          </button>
        </div>

        {/* TAB 1: MY WEEKLY TIMESHEET */}
        {activeTab === 'my_timesheet' && (
          <div className="space-y-6">
            {/* Week Selector Bar */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-800 font-semibold text-sm">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>
                    Semaine du {new Date(weekDates[0]).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })} au{' '}
                    {new Date(weekDates[6]).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <Button variant="outline" size="sm" onClick={handleNextWeek}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Statut :</span>
                  {getStatusBadge(currentStatus)}
                </div>

                {currentTimesheet?.totalCost && (
                  <div className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    Coût calculé :{' '}
                    <strong className="text-slate-900">
                      {Number(currentTimesheet.totalCost).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection / Review note alert if any */}
            {currentTimesheet?.reviewNotes && (
              <div
                className={`p-4 rounded-xl border flex items-start space-x-3 ${
                  currentStatus === 'rejected'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                {currentStatus === 'rejected' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-bold">Commentaire de révision RH</h4>
                  <p className="text-xs mt-1">{currentTimesheet.reviewNotes}</p>
                </div>
              </div>
            )}

            {/* Matrix Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 uppercase font-bold">
                      <th className="py-3 px-3 w-48">Projet</th>
                      <th className="py-3 px-3 w-44">Subvention / Bailleurs</th>
                      <th className="py-3 px-3 w-40">Activité</th>
                      <th className="py-3 px-3 min-w-[140px]">Description</th>
                      {dayLabels.map((lbl, idx) => (
                        <th key={lbl} className="py-3 px-2 text-center w-16">
                          <div>{lbl}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {new Date(weekDates[idx]).toLocaleDateString('fr-CA', { day: 'numeric', month: 'numeric' })}
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-3 text-center w-16 bg-slate-200/60 font-black">Total</th>
                      {!isReadOnly && <th className="py-3 px-2 text-center w-10"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, idx) => {
                      const rowTotal =
                        (Number(row.mondayHours) || 0) +
                        (Number(row.tuesdayHours) || 0) +
                        (Number(row.wednesdayHours) || 0) +
                        (Number(row.thursdayHours) || 0) +
                        (Number(row.fridayHours) || 0) +
                        (Number(row.saturdayHours) || 0) +
                        (Number(row.sundayHours) || 0);

                      return (
                        <tr key={row.key || idx} className="hover:bg-slate-50/80 transition-colors">
                          {/* Project select */}
                          <td className="p-2">
                            <select
                              disabled={isReadOnly}
                              value={row.projectId}
                              onChange={(e) => handleRowChange(idx, 'projectId', e.target.value)}
                              className="w-full text-xs rounded border-slate-300 bg-white py-1 px-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                            >
                              <option value="">-- Aucun projet --</option>
                              {Array.isArray(projectsData) &&
                                projectsData.map((p: any) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                            </select>
                          </td>

                          {/* Grant select */}
                          <td className="p-2">
                            <select
                              disabled={isReadOnly}
                              value={row.grantId}
                              onChange={(e) => handleRowChange(idx, 'grantId', e.target.value)}
                              className="w-full text-xs rounded border-slate-300 bg-white py-1 px-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                            >
                              <option value="">-- Aucune subvention --</option>
                              {Array.isArray(grantsData) &&
                                grantsData.map((g: any) => (
                                  <option key={g.id} value={g.id}>
                                    {g.title} ({g.donorAgency})
                                  </option>
                                ))}
                            </select>
                          </td>

                          {/* Activity Type select */}
                          <td className="p-2">
                            <select
                              disabled={isReadOnly}
                              value={row.activityType}
                              onChange={(e) => handleRowChange(idx, 'activityType', e.target.value)}
                              className="w-full text-xs rounded border-slate-300 bg-white py-1 px-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                            >
                              {activityTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Description */}
                          <td className="p-2">
                            <input
                              type="text"
                              disabled={isReadOnly}
                              placeholder="Notes / Tâches..."
                              value={row.description}
                              onChange={(e) => handleRowChange(idx, 'description', e.target.value)}
                              className="w-full text-xs rounded border-slate-300 bg-white py-1 px-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                            />
                          </td>

                          {/* 7 Days Hours Inputs */}
                          <td className="p-1 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              disabled={isReadOnly}
                              value={row.mondayHours === 0 ? '' : row.mondayHours}
                              placeholder="0"
                              onChange={(e) => handleRowChange(idx, 'mondayHours', parseFloat(e.target.value) || 0)}
                              className="w-14 text-center text-xs py-1 rounded border-slate-200 focus:border-blue-500 disabled:bg-slate-100 font-semibold"
                            />
                          </td>

                          <td className="p-1 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              disabled={isReadOnly}
                              value={row.tuesdayHours === 0 ? '' : row.tuesdayHours}
                              placeholder="0"
                              onChange={(e) => handleRowChange(idx, 'tuesdayHours', parseFloat(e.target.value) || 0)}
                              className="w-14 text-center text-xs py-1 rounded border-slate-200 focus:border-blue-500 disabled:bg-slate-100 font-semibold"
                            />
                          </td>

                          <td className="p-1 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              disabled={isReadOnly}
                              value={row.wednesdayHours === 0 ? '' : row.wednesdayHours}
                              placeholder="0"
                              onChange={(e) => handleRowChange(idx, 'wednesdayHours', parseFloat(e.target.value) || 0)}
                              className="w-14 text-center text-xs py-1 rounded border-slate-200 focus:border-blue-500 disabled:bg-slate-100 font-semibold"
                            />
                          </td>

                          <td className="p-1 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              disabled={isReadOnly}
                              value={row.thursdayHours === 0 ? '' : row.thursdayHours}
                              placeholder="0"
                              onChange={(e) => handleRowChange(idx, 'thursdayHours', parseFloat(e.target.value) || 0)}
                              className="w-14 text-center text-xs py-1 rounded border-slate-200 focus:border-blue-500 disabled:bg-slate-100 font-semibold"
                            />
                          </td>

                          <td className="p-1 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              disabled={isReadOnly}
                              value={row.fridayHours === 0 ? '' : row.fridayHours}
                              placeholder="0"
                              onChange={(e) => handleRowChange(idx, 'fridayHours', parseFloat(e.target.value) || 0)}
                              className="w-14 text-center text-xs py-1 rounded border-slate-200 focus:border-blue-500 disabled:bg-slate-100 font-semibold"
                            />
                          </td>

                          <td className="p-1 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              disabled={isReadOnly}
                              value={row.saturdayHours === 0 ? '' : row.saturdayHours}
                              placeholder="0"
                              onChange={(e) => handleRowChange(idx, 'saturdayHours', parseFloat(e.target.value) || 0)}
                              className="w-14 text-center text-xs py-1 rounded border-slate-200 focus:border-blue-500 disabled:bg-slate-100 font-semibold text-slate-500"
                            />
                          </td>

                          <td className="p-1 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              disabled={isReadOnly}
                              value={row.sundayHours === 0 ? '' : row.sundayHours}
                              placeholder="0"
                              onChange={(e) => handleRowChange(idx, 'sundayHours', parseFloat(e.target.value) || 0)}
                              className="w-14 text-center text-xs py-1 rounded border-slate-200 focus:border-blue-500 disabled:bg-slate-100 font-semibold text-slate-500"
                            />
                          </td>

                          {/* Row Total */}
                          <td className="p-2 text-center font-bold text-slate-900 bg-slate-50">
                            {rowTotal.toFixed(1)} h
                          </td>

                          {/* Delete row button */}
                          {!isReadOnly && (
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleRemoveRow(idx)}
                                disabled={rows.length <= 1}
                                className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Table Footer with Daily Totals & Grand Total */}
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-800">
                      <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                        Total Heures Quotidiennes :
                      </td>
                      {dailyTotals.map((tot, idx) => (
                        <td
                          key={idx}
                          className={`py-3 px-1 text-center font-black ${
                            tot > 12 ? 'text-amber-600' : 'text-slate-900'
                          }`}
                        >
                          {tot.toFixed(1)} h
                        </td>
                      ))}
                      <td className="py-3 px-2 text-center bg-blue-100/70 text-blue-900 font-black text-sm">
                        {weekGrandTotalHours.toFixed(1)} h
                      </td>
                      {!isReadOnly && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Action Buttons under table */}
              {!isReadOnly && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddRow}
                    className="flex items-center space-x-1.5 text-xs font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une ligne d'imputation</span>
                  </Button>

                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveEntriesMutation.mutate()}
                      disabled={saveEntriesMutation.isPending}
                      className="flex items-center space-x-1.5 text-xs font-semibold"
                    >
                      <Save className="w-4 h-4 text-slate-500" />
                      <span>{saveEntriesMutation.isPending ? 'Sauvegarde...' : 'Enregistrer le brouillon'}</span>
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => submitTimesheetMutation.mutate()}
                      disabled={submitTimesheetMutation.isPending || weekGrandTotalHours === 0}
                      className="flex items-center space-x-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitTimesheetMutation.isPending ? 'Soumission...' : 'Soumettre pour approbation'}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: APPROVALS & REVIEWS (FOR MANAGERS / HR) */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Feuilles de temps à valider</h3>
                  <p className="text-xs text-slate-500">
                    Consultez, approuvez ou renvoyez les feuilles soumises par votre équipe.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <th className="py-3 px-4">Collaborateur</th>
                      <th className="py-3 px-4">Période</th>
                      <th className="py-3 px-4 text-center">Total Heures</th>
                      <th className="py-3 px-4 text-right">Valorisation Coût</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Array.isArray(allTimesheetsData) && allTimesheetsData.length > 0 ? (
                      allTimesheetsData.map((ts: any) => (
                        <tr key={ts.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {ts.user?.firstName || ts.user?.lastName
                                ? `${ts.user?.firstName || ''} ${ts.user?.lastName || ''}`.trim()
                                : ts.user?.email || 'Utilisateur'}
                            </div>
                            <div className="text-[11px] text-slate-400">{ts.user?.email}</div>
                          </td>

                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            Semaine du {new Date(ts.weekStartDate).toLocaleDateString('fr-CA')} au{' '}
                            {new Date(ts.weekEndDate).toLocaleDateString('fr-CA')}
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                            {Number(ts.totalHours || 0).toFixed(1)} h
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                            {Number(ts.totalCost || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                          </td>

                          <td className="py-3.5 px-4 text-center">{getStatusBadge(ts.status)}</td>

                          <td className="py-3.5 px-4 text-right">
                            {ts.status === 'submitted' ? (
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRejectTimesheetId(ts.id);
                                    setRejectModalOpen(true);
                                  }}
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs"
                                >
                                  Rejeter
                                </Button>

                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: ts.id,
                                      status: 'approved',
                                    })
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                >
                                  Approuver
                                </Button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Traité</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Aucune feuille de temps soumise pour le moment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICS & ALLOCATIONS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Allocations */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <FolderKanban className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Ventilation par Projet</h3>
                </div>

                <div className="space-y-3">
                  {analyticsData?.byProject && analyticsData.byProject.length > 0 ? (
                    analyticsData.byProject.map((p: any) => (
                      <div key={p.projectId || 'unassigned'} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
                          <span>{p.projectName || 'Non rattaché à un projet'}</span>
                          <span className="text-blue-700">{Number(p.hours || 0).toFixed(1)} h</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                          <span>Coût imputé valorisé</span>
                          <span className="font-medium text-emerald-700">
                            {Number(p.cost || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4 text-center">Aucune heure imputée sur un projet.</p>
                  )}
                </div>
              </div>

              {/* Grant Allocations */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <Landmark className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Ventilation par Subvention / Bailleur</h3>
                </div>

                <div className="space-y-3">
                  {analyticsData?.byGrant && analyticsData.byGrant.length > 0 ? (
                    analyticsData.byGrant.map((g: any) => (
                      <div key={g.grantId || 'unassigned'} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
                          <span>{g.grantTitle || 'Fonds généraux'}</span>
                          <span className="text-indigo-700">{Number(g.hours || 0).toFixed(1)} h</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                          <span>Justification bailleur</span>
                          <span className="font-medium text-emerald-700">
                            {Number(g.cost || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4 text-center">Aucune heure imputée sur une subvention.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Type Allocations */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <PieChart className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Répartition par Type d'Activité</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {analyticsData?.byActivity && analyticsData.byActivity.length > 0 ? (
                  analyticsData.byActivity.map((act: any) => {
                    const matched = activityTypeOptions.find((o) => o.value === act.activityType);
                    return (
                      <div key={act.activityType} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs font-semibold text-slate-700">{matched?.label || act.activityType}</div>
                        <div className="text-lg font-black text-slate-900 mt-1">{Number(act.hours || 0).toFixed(1)} h</div>
                        <div className="text-xs text-emerald-700 font-medium">
                          {Number(act.cost || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic py-4 text-center col-span-3">Aucune activité enregistrée.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HR PROFILES & HOURLY RATES */}
        {activeTab === 'hr_profiles' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Profils RH, Taux Horaires & Bénévolat</h3>
                  <p className="text-xs text-slate-500">
                    Configurez les taux horaires chargés et la valorisation du bénévolat pour l'imputation analytique et la reddition aux bailleurs.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <th className="py-3 px-4">Membre / Utilisateur</th>
                      <th className="py-3 px-4">Poste & Département</th>
                      <th className="py-3 px-4 text-center">Contrat</th>
                      <th className="py-3 px-4 text-center">Heures / Semaine</th>
                      <th className="py-3 px-4 text-right">Taux Horaire Chargé</th>
                      <th className="py-3 px-4 text-right">Taux Bénévolat Valorisé</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingHrProfiles ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Chargement des profils RH...
                        </td>
                      </tr>
                    ) : Array.isArray(hrProfilesData) && hrProfilesData.length > 0 ? (
                      hrProfilesData.map((prof: any) => {
                        const getContractBadge = (cType: string) => {
                          switch (cType) {
                            case 'volunteer':
                              return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Bénévole</span>;
                            case 'part_time':
                              return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">Temps partiel</span>;
                            case 'contractor':
                              return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Contractuel</span>;
                            case 'intern':
                              return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">Stagiaire</span>;
                            default:
                              return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Temps plein</span>;
                          }
                        };

                        return (
                          <tr key={prof.id || prof.userId} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{prof.displayName}</div>
                              <div className="text-[11px] text-slate-400">{prof.user?.email}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              <div className="font-medium">{prof.jobTitle || 'Non renseigné'}</div>
                              <div className="text-[11px] text-slate-400">{prof.department || 'Général'}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getContractBadge(prof.contractType)}
                            </td>
                            <td className="py-3 px-4 text-center font-medium">{prof.standardWeeklyHours || 35} h</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              {Number(prof.defaultHourlyRate || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}/h
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-emerald-700">
                              {Number(prof.volunteerImputedRate || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}/h
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUserId(prof.userId);
                                  setProfileFormData({
                                    employeeNumber: prof.employeeNumber || '',
                                    jobTitle: prof.jobTitle || '',
                                    department: prof.department || '',
                                    contractType: prof.contractType || 'full_time',
                                    standardWeeklyHours: String(prof.standardWeeklyHours || '35'),
                                    defaultHourlyRate: String(prof.defaultHourlyRate || '35.00'),
                                    volunteerImputedRate: String(prof.volunteerImputedRate || '25.00'),
                                    active: prof.active !== undefined ? prof.active : true,
                                  });
                                  setProfileModalOpen(true);
                                }}
                                className="text-xs"
                              >
                                Modifier Profil RH
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Aucun collaborateur trouvé dans l'organisme.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* REJECT MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Rejeter la feuille de temps</h3>
                <p className="text-xs text-slate-500">Indiquez la raison du rejet ou les corrections demandées.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motif de rejet / Instructions</label>
                <textarea
                  rows={4}
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Ex: Merci de réimputer les heures du mardi sur la subvention X..."
                  className="w-full text-xs rounded-lg border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectTimesheetId(null);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={!rejectComment.trim() || updateStatusMutation.isPending}
                  onClick={() => {
                    if (rejectTimesheetId) {
                      updateStatusMutation.mutate({
                        id: rejectTimesheetId,
                        status: 'rejected',
                        notes: rejectComment,
                      });
                    }
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  Confirmer le rejet
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HR PROFILE MODAL */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Paramètres RH & Taux du Collaborateur</h3>
                <p className="text-xs text-slate-500">Configurez le taux horaire d'imputation et la valorisation bénévole.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Poste / Fonction</label>
                  <input
                    type="text"
                    value={profileFormData.jobTitle}
                    onChange={(e) => setProfileFormData({ ...profileFormData, jobTitle: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 py-2 px-3"
                    placeholder="Ex: Chargé de projet"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Département</label>
                  <input
                    type="text"
                    value={profileFormData.department}
                    onChange={(e) => setProfileFormData({ ...profileFormData, department: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 py-2 px-3"
                    placeholder="Ex: Programmes Sociaux"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Matricule / N° Employé</label>
                  <input
                    type="text"
                    value={profileFormData.employeeNumber}
                    onChange={(e) => setProfileFormData({ ...profileFormData, employeeNumber: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 py-2 px-3"
                    placeholder="Ex: EMP-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type de Contrat</label>
                  <select
                    value={profileFormData.contractType}
                    onChange={(e) => setProfileFormData({ ...profileFormData, contractType: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 py-2 px-3 bg-white"
                  >
                    <option value="full_time">Salarié (Temps plein)</option>
                    <option value="part_time">Salarié (Temps partiel)</option>
                    <option value="volunteer">Bénévole / Volontaire</option>
                    <option value="contractor">Contractuel / Consultant</option>
                    <option value="intern">Stagiaire</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Heures Std/Sem</label>
                  <input
                    type="number"
                    step="0.5"
                    value={profileFormData.standardWeeklyHours}
                    onChange={(e) => setProfileFormData({ ...profileFormData, standardWeeklyHours: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 py-2 px-3 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Taux Salarié ($/h)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={profileFormData.defaultHourlyRate}
                    onChange={(e) => setProfileFormData({ ...profileFormData, defaultHourlyRate: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 py-2 px-3 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Taux Bénévole ($/h)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={profileFormData.volunteerImputedRate}
                    onChange={(e) => setProfileFormData({ ...profileFormData, volunteerImputedRate: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 py-2 px-3 font-semibold text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <Button variant="outline" size="sm" onClick={() => setProfileModalOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={saveHrProfileMutation.isPending}
                  onClick={() => {
                    saveHrProfileMutation.mutate({
                      employeeNumber: profileFormData.employeeNumber || undefined,
                      jobTitle: profileFormData.jobTitle || undefined,
                      department: profileFormData.department || undefined,
                      contractType: profileFormData.contractType as any,
                      standardWeeklyHours: parseFloat(profileFormData.standardWeeklyHours) || 35,
                      defaultHourlyRate: parseFloat(profileFormData.defaultHourlyRate) || 30,
                      volunteerImputedRate: parseFloat(profileFormData.volunteerImputedRate) || 25,
                      active: profileFormData.active,
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  {saveHrProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
