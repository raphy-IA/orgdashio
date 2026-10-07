import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge } from '@orgdashio/ui';
import {
  BookOpen,
  Calendar,
  Plus,
  ArrowRight,
  GraduationCap,
  Target,
  Users,
  Clock,
  Trash2,
  CalendarDays,
  Layers,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';

export function TrainingCatalogScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modals state
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showAttachCourseModal, setShowAttachCourseModal] = useState(false);
  const [activeProgramForAttach, setActiveProgramForAttach] = useState<any>(null);

  // Form State - Training Program
  const [progCode, setProgCode] = useState('');
  const [progTitle, setProgTitle] = useState('');
  const [progObjectives, setProgObjectives] = useState('');
  const [progAudience, setProgAudience] = useState('');

  // Form State - Autonomous Course
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseObjectives, setCourseObjectives] = useState('');
  const [courseDuration, setCourseDuration] = useState(7);

  // Form State - Attach Course to Program
  const [selectedCourseToAttach, setSelectedCourseToAttach] = useState('');

  // Form State - Training Session (Planifiée pour un Programme avec Période)
  const [sessionProgramId, setSessionProgramId] = useState('');
  const [sessionCourseId, setSessionCourseId] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState(20);

  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'programs' | 'courses' | 'sessions'>('programs');

  // Queries
  const { data: trainingPrograms = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ['trainingPrograms'],
    queryFn: async () => {
      const res = await fetch('/api/v1/training/programs');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch('/api/v1/training/courses');
      if (!res.ok) throw new Error('Erreur de chargement du catalogue des cours');
      return res.json();
    },
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['trainingSessions'],
    queryFn: async () => {
      const res = await fetch('/api/v1/training/sessions');
      if (!res.ok) throw new Error('Erreur de chargement des sessions');
      return res.json();
    },
  });

  // Create Training Program Mutation
  const createProgramMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/v1/training/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de la création du programme');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingPrograms'] });
      setShowProgramModal(false);
      setProgCode('');
      setProgTitle('');
      setProgObjectives('');
      setProgAudience('');
    },
    onError: (err: any) => setError(err.message),
  });

  // Create Course Mutation (Autonome dans le catalogue général)
  const createCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/v1/training/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de la création du cours');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setShowCourseModal(false);
      setCourseCode('');
      setCourseTitle('');
      setCourseDesc('');
      setCourseObjectives('');
      setCourseDuration(7);
    },
    onError: (err: any) => setError(err.message),
  });

  // Attach Course to Program Mutation
  const attachCourseMutation = useMutation({
    mutationFn: async ({ programId, courseId }: { programId: string; courseId: string }) => {
      const res = await fetch(`/api/v1/training/programs/${programId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Erreur lors de l'ajout du cours au programme");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingPrograms'] });
      setShowAttachCourseModal(false);
      setSelectedCourseToAttach('');
    },
    onError: (err: any) => setError(err.message),
  });

  // Remove Course from Program Mutation
  const removeCourseFromProgramMutation = useMutation({
    mutationFn: async ({ programId, courseId }: { programId: string; courseId: string }) => {
      const res = await fetch(`/api/v1/training/programs/${programId}/courses/${courseId}/remove`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Erreur de retrait du cours');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingPrograms'] });
    },
  });

  // Create Session Mutation (Avec Programme & Période)
  const createSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/v1/training/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de la création de la session');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingSessions'] });
      setShowSessionModal(false);
      setSessionProgramId('');
      setSessionCourseId('');
      setSessionTitle('');
      setStartDate('');
      setEndDate('');
      setCapacity(20);
    },
    onError: (err: any) => setError(err.message),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Catalogue & Sessions de Formation</h1>
            <p className="text-xs text-slate-500 mt-1">
              Gérez les programmes, votre catalogue de cours autonomes et planifiez les sessions sur des périodes définies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setShowProgramModal(true)}>
              <GraduationCap className="mr-1.5 h-4 w-4 text-indigo-600" />
              Nouveau Programme
            </Button>
            <Button variant="secondary" onClick={() => setShowCourseModal(true)}>
              <BookOpen className="mr-1.5 h-4 w-4 text-indigo-600" />
              Nouveau Cours au Catalogue
            </Button>
            <Button onClick={() => setShowSessionModal(true)}>
              <Calendar className="mr-1.5 h-4 w-4" />
              Planifier une Session
            </Button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('programs')}
            className={`pb-3 transition-colors ${
              activeTab === 'programs'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Programmes de Formation ({trainingPrograms.length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`pb-3 transition-colors ${
              activeTab === 'courses'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Catalogue des Cours Autonomes ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`pb-3 transition-colors ${
              activeTab === 'sessions'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sessions & Périodes Planifiées ({sessions.length})
          </button>
        </div>

        {/* Tab 1: Programs & Associated Courses (N-N) */}
        {activeTab === 'programs' && (
          <div className="space-y-6">
            {trainingPrograms.length === 0 ? (
              <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
                <GraduationCap className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-800">Aucun programme de formation</p>
                <p className="text-xs text-slate-500 mt-1">Créez votre premier programme et composez-le à partir de votre catalogue de cours.</p>
                <Button className="mt-4" onClick={() => setShowProgramModal(true)}>
                  Créer un Programme
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {trainingPrograms.map((prog: any) => (
                  <div key={prog.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    {/* Program Header */}
                    <div className="bg-slate-900 text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start space-x-3">
                        <div className="rounded-lg bg-indigo-500/20 p-2.5 text-amber-400 border border-indigo-500/30">
                          <GraduationCap className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded font-bold uppercase">
                              {prog.code}
                            </span>
                            <h2 className="font-bold text-lg text-white">{prog.title}</h2>
                          </div>
                          {prog.objectives && (
                            <p className="text-xs text-slate-300 mt-1 flex items-center">
                              <Target className="mr-1.5 h-3.5 w-3.5 text-amber-400 shrink-0" />
                              Objectifs : {prog.objectives}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge variant="default" className="bg-slate-800 text-slate-200 border-slate-700">
                          {prog.courses?.length || 0} Cours associé(s)
                        </Badge>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setActiveProgramForAttach(prog);
                            setShowAttachCourseModal(true);
                          }}
                          className="text-xs"
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Ajouter un cours existant
                        </Button>
                      </div>
                    </div>

                    {/* Associated Courses List */}
                    {!prog.courses || prog.courses.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 italic">
                        Aucun cours rattaché à ce programme. Utilisez "Ajouter un cours existant" pour composer le contenu.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {prog.courses.map((c: any) => (
                          <div key={c.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <BookOpen className="h-4 w-4 text-indigo-600 shrink-0" />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono text-xs font-bold text-indigo-600">{c.code}</span>
                                  <span className="font-semibold text-slate-900 text-sm">{c.title}</span>
                                </div>
                                {c.description && <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>}
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="text-xs text-slate-500 font-mono">
                                {c.durationHours}h
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  removeCourseFromProgramMutation.mutate({
                                    programId: prog.id,
                                    courseId: c.id,
                                  })
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Catalogue of Autonomous Courses */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Catalogue Général des Cours</h2>
                <p className="text-xs text-slate-500">Les cours sont créés de manière autonome et peuvent être intégrés dans un ou plusieurs programmes.</p>
              </div>
              <Button onClick={() => setShowCourseModal(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Créer un Cours
              </Button>
            </div>

            {loadingCourses ? (
              <div className="p-8 text-center text-slate-500">Chargement du catalogue...</div>
            ) : courses.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-white rounded-xl border">
                Aucun cours dans le catalogue.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((c: any) => (
                  <div key={c.id} className="rounded-xl border bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {c.code}
                        </span>
                        <span className="text-xs font-mono text-slate-500 flex items-center">
                          <Clock className="mr-1 h-3.5 w-3.5 text-slate-400" />
                          {c.durationHours} heure(s)
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{c.title}</h3>
                      {c.description && <p className="text-xs text-slate-600 mt-2 line-clamp-3">{c.description}</p>}
                    </div>

                    <div className="pt-3 border-t text-xs text-slate-400 flex items-center justify-between">
                      <span>Cours Réutilisable</span>
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Sessions & Periods */}
        {activeTab === 'sessions' && (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Sessions de Formation Planifiées</h2>
                <p className="text-xs text-slate-500">Une session planifie l'exécution d'un programme ou d'un cours sur une période donnée.</p>
              </div>
              <Button onClick={() => setShowSessionModal(true)}>
                <Calendar className="mr-1.5 h-4 w-4" />
                Planifier une Session
              </Button>
            </div>

            {loadingSessions ? (
              <div className="p-8 text-center text-slate-500">Chargement des sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Aucune session planifiée pour le moment.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Intitulé Session</th>
                    <th className="px-6 py-3">Programme / Cours</th>
                    <th className="px-6 py-3">Période (Début ➔ Fin)</th>
                    <th className="px-6 py-3">Capacité</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sessions.map((s: any) => {
                    const linkedProg = trainingPrograms.find((p: any) => p.id === s.trainingProgramId);
                    const linkedCourse = courses.find((c: any) => c.id === s.courseId);

                    return (
                      <tr
                        key={s.id}
                        onClick={() => navigate(`/training/sessions/${s.id}`)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-indigo-600" />
                          <span>{s.title}</span>
                        </td>
                        <td className="px-6 py-4">
                          {linkedProg ? (
                            <Badge variant="default" className="bg-indigo-50 text-indigo-800 border-indigo-200">
                              Programme: {linkedProg.title}
                            </Badge>
                          ) : linkedCourse ? (
                            <Badge variant="secondary">
                              Cours: {linkedCourse.title}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">Générale</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                          {s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'} ➔{' '}
                          {s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                          {s.capacity} places
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={s.status === 'open' ? 'success' : 'secondary'}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="ghost">
                            Gérer Cohorte <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* Modal: Create Training Program */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Créer un Programme de Formation</h2>

            {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                createProgramMutation.mutate({
                  code: progCode,
                  title: progTitle,
                  objectives: progObjectives,
                  targetAudience: progAudience,
                });
              }}
              className="space-y-4"
            >
              <Input
                label="Code Programme (Ex: PROG-DEV-WEB)"
                value={progCode}
                onChange={(e) => setProgCode(e.target.value)}
                placeholder="PROG-01"
                required
              />

              <Input
                label="Titre du Programme"
                value={progTitle}
                onChange={(e) => setProgTitle(e.target.value)}
                placeholder="Ex: Programme Développeur Web & Numérique"
                required
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Objectifs Pédagogiques Globaux</label>
                <textarea
                  className="w-full rounded-md border p-2 text-sm bg-white h-20"
                  value={progObjectives}
                  onChange={(e) => setProgObjectives(e.target.value)}
                  placeholder="Compétences visées par le programme..."
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowProgramModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createProgramMutation.isPending}>
                  {createProgramMutation.isPending ? 'Création...' : 'Créer le programme'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Course (Autonome dans Catalogue) */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Créer un Cours au Catalogue</h2>

            {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                createCourseMutation.mutate({
                  code: courseCode,
                  title: courseTitle,
                  description: courseDesc,
                  durationHours: Number(courseDuration),
                });
              }}
              className="space-y-4"
            >
              <Input
                label="Code du Cours (Ex: HTML-101)"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="COUR-01"
                required
              />

              <Input
                label="Titre du Cours"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Ex: Fundamentals HTML5 & CSS3"
                required
              />

              <Input
                label="Durée (heures)"
                type="number"
                value={courseDuration}
                onChange={(e) => setCourseDuration(Number(e.target.value))}
                required
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description & Programme Détaillé</label>
                <textarea
                  className="w-full rounded-md border p-2 text-sm bg-white h-20"
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowCourseModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createCourseMutation.isPending}>
                  {createCourseMutation.isPending ? 'Création...' : 'Créer le cours'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Attach Existing Course to Program */}
      {showAttachCourseModal && activeProgramForAttach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Ajouter un cours au Programme</h2>
            <p className="text-xs text-indigo-600 font-semibold mb-4">{activeProgramForAttach.title}</p>

            {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                if (!selectedCourseToAttach) return;
                attachCourseMutation.mutate({
                  programId: activeProgramForAttach.id,
                  courseId: selectedCourseToAttach,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sélectionner un cours du catalogue</label>
                <select
                  className="w-full rounded-md border p-2 text-sm bg-white"
                  value={selectedCourseToAttach}
                  onChange={(e) => setSelectedCourseToAttach(e.target.value)}
                  required
                >
                  <option value="">-- Choisir un cours existant --</option>
                  {courses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title} ({c.durationHours}h)
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowAttachCourseModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={attachCourseMutation.isPending}>
                  {attachCourseMutation.isPending ? 'Ajout...' : 'Attacher au programme'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Session with Period & Program */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Planifier une Session de Formation</h2>

            {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                createSessionMutation.mutate({
                  trainingProgramId: sessionProgramId || null,
                  courseId: sessionCourseId || null,
                  title: sessionTitle,
                  startDate,
                  endDate,
                  capacity: Number(capacity),
                });
              }}
              className="space-y-4"
            >
              <Input
                label="Titre de la Session"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="Ex: Cohorte Automne 2026 - Session 01"
                required
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Programme Associé</label>
                <select
                  className="w-full rounded-md border p-2 text-sm bg-white"
                  value={sessionProgramId}
                  onChange={(e) => setSessionProgramId(e.target.value)}
                >
                  <option value="">-- Aucun (Session par cours autonome) --</option>
                  {trainingPrograms.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {!sessionProgramId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ou Cours Spécifique</label>
                  <select
                    className="w-full rounded-md border p-2 text-sm bg-white"
                    value={sessionCourseId}
                    onChange={(e) => setSessionCourseId(e.target.value)}
                  >
                    <option value="">-- Sélectionner un cours --</option>
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date de Début"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input
                  label="Date de Fin"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Capacité maximale (nombre d'inscrits)"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                required
              />

              <div className="mt-6 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowSessionModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createSessionMutation.isPending}>
                  {createSessionMutation.isPending ? 'Planification...' : 'Créer et planifier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
