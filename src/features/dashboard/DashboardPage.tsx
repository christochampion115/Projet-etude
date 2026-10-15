import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, FileText, ListChecks } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataBoundary } from '@/components/layout/DataBoundary'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useSnapshot } from '@/data/DataProvider'
import {
  computeProgramProgress,
  coursesNeedingAttention,
  findNextDeadline,
  formatMinutes,
  groupTopicsByCourse,
  sumStudyMinutes,
  visibleCourses,
} from '@/lib/selectors'
import { getRecentCourseIds } from '@/lib/recentCourses'

export function DashboardPage() {
  const navigate = useNavigate()
  const { courses, tasks, exams, topics, documents, studySessions, academicYears } = useSnapshot()

  const active = useMemo(() => visibleCourses(courses), [courses])
  const topicsByCourse = useMemo(() => groupTopicsByCourse(topics), [topics])
  const now = new Date()

  const openTasks = tasks.filter((t) => t.status !== 'done')
  const overdueTasks = openTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now)
  const upcomingExams = exams
    .filter((e) => e.date && new Date(e.date) >= now)
    .sort((a, b) => (a.date as string).localeCompare(b.date as string))

  const upcomingDeadlines = useMemo(() => {
    const items = active
      .map((course) => ({ course, deadline: findNextDeadline(course.id, tasks, exams, now) }))
      .filter((item): item is { course: (typeof active)[number]; deadline: NonNullable<ReturnType<typeof findNextDeadline>> } => item.deadline !== null)
      .sort((a, b) => new Date(a.deadline.date).getTime() - new Date(b.deadline.date).getTime())
    return items.slice(0, 6)
  }, [active, tasks, exams])

  const attentionCourses = useMemo(
    () => coursesNeedingAttention(courses, topicsByCourse, tasks, exams, now),
    [courses, topicsByCourse, tasks, exams],
  )

  const coursesWithProgram = active.filter((c) => (topicsByCourse.get(c.id)?.length ?? 0) > 0)
  const globalProgress =
    coursesWithProgram.length === 0
      ? null
      : Math.round(
          coursesWithProgram.reduce((sum, c) => sum + (computeProgramProgress(topicsByCourse.get(c.id) ?? []).percent ?? 0), 0) /
            coursesWithProgram.length,
        )

  const last7DaysMinutes = sumStudyMinutes(
    studySessions.filter((s) => new Date(s.date).getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000),
  )
  const recentSessions = [...studySessions].sort((a, b) => b.startTime.localeCompare(a.startTime)).slice(0, 5)
  const recentDocuments = [...documents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  const recentCourses = getRecentCourseIds()
    .map((id) => courses.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  const courseName = (id: string) => courses.find((c) => c.id === id)?.name ?? 'Cours supprimé'

  if (academicYears.length === 0) {
    return (
      <div>
        <PageHeader title="Vue d'ensemble" description="Votre suivi d'études en un coup d'œil." />
        <EmptyState
          icon={<BookOpen size={24} />}
          title="Bienvenue"
          description="Commencez par créer une année académique puis votre premier cours depuis la page Paramètres ou Mes cours."
          actionLabel="Aller à Mes cours"
          onAction={() => navigate('/courses')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Vue d'ensemble" description="Votre suivi d'études en un coup d'œil." />
      <DataBoundary>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Cours actifs" value={String(active.length)} />
            <StatCard label="Tâches ouvertes" value={String(openTasks.length)} />
            <StatCard label="Tâches en retard" value={String(overdueTasks.length)} tone={overdueTasks.length > 0 ? 'danger' : undefined} />
            <StatCard label="Prochains examens" value={String(upcomingExams.length)} />
          </div>

          {active.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={22} />}
              title="Aucun cours actif"
              description="Ajoutez votre premier cours pour commencer à suivre votre progression."
              actionLabel="Ajouter un cours"
              onAction={() => navigate('/courses')}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>À faire ensuite</CardTitle>
                  <Link to="/tasks" className="text-xs font-medium text-accent-600 hover:underline">
                    Voir tout
                  </Link>
                </CardHeader>
                <CardBody>
                  {upcomingDeadlines.length === 0 ? (
                    <EmptyState
                      icon={<ListChecks size={20} />}
                      title="Aucune échéance à venir"
                      description="Ajoutez des tâches ou des examens datés pour les voir apparaître ici."
                    />
                  ) : (
                    <ul className="space-y-2">
                      {upcomingDeadlines.map(({ course, deadline }) => (
                        <li key={`${course.id}-${deadline.id}`} className="flex items-center justify-between gap-2 text-sm">
                          <div>
                            <Link to={`/courses/${course.id}`} className="font-medium text-slate-700 hover:text-accent-600 dark:text-slate-200">
                              {deadline.title}
                            </Link>
                            <p className="text-xs text-slate-400">{course.name}</p>
                          </div>
                          <Badge tone={deadline.kind === 'exam' ? 'danger' : 'accent'}>
                            {new Date(deadline.date).toLocaleDateString('fr-FR')}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cours nécessitant de l'attention</CardTitle>
                </CardHeader>
                <CardBody>
                  {attentionCourses.length === 0 ? (
                    <p className="text-sm text-slate-400">Rien d'urgent : tous vos cours actifs sont à jour.</p>
                  ) : (
                    <ul className="space-y-3">
                      {attentionCourses.slice(0, 5).map((course) => (
                        <li key={course.id}>
                          <Link to={`/courses/${course.id}`} className="text-sm font-medium text-slate-700 hover:text-accent-600 dark:text-slate-200">
                            {course.name}
                          </Link>
                          <ProgressBar percent={computeProgramProgress(topicsByCourse.get(course.id) ?? []).percent} />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activité d'étude récente</CardTitle>
                  <Link to="/statistics" className="text-xs font-medium text-accent-600 hover:underline">
                    Statistiques
                  </Link>
                </CardHeader>
                <CardBody>
                  <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
                    7 derniers jours : <span className="font-semibold">{formatMinutes(last7DaysMinutes)}</span>
                  </p>
                  {recentSessions.length === 0 ? (
                    <p className="text-sm text-slate-400">Aucune séance enregistrée pour le moment.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {recentSessions.map((s) => (
                        <li key={s.id} className="flex items-center justify-between text-xs text-slate-500">
                          <span>{s.courseId ? courseName(s.courseId) : 'Libre'}</span>
                          <span>{formatMinutes(s.durationMinutes)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progression globale des programmes</CardTitle>
                </CardHeader>
                <CardBody>
                  {globalProgress === null ? (
                    <p className="text-sm text-slate-400">Aucun cours ne possède encore de programme défini.</p>
                  ) : (
                    <ProgressBar percent={globalProgress} />
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Derniers documents ajoutés</CardTitle>
                  <Link to="/documents" className="text-xs font-medium text-accent-600 hover:underline">
                    Voir tout
                  </Link>
                </CardHeader>
                <CardBody>
                  {recentDocuments.length === 0 ? (
                    <EmptyState icon={<FileText size={20} />} title="Aucun document" />
                  ) : (
                    <ul className="space-y-1.5">
                      {recentDocuments.map((d) => (
                        <li key={d.id} className="flex items-center justify-between text-sm">
                          <Link to={`/courses/${d.courseId}`} className="truncate text-slate-700 hover:text-accent-600 dark:text-slate-200">
                            {d.displayName}
                          </Link>
                          <span className="shrink-0 text-xs text-slate-400">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cours récemment consultés</CardTitle>
                </CardHeader>
                <CardBody>
                  {recentCourses.length === 0 ? (
                    <p className="text-sm text-slate-400">Ouvrez un cours pour qu'il apparaisse ici.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {recentCourses.map((c) => (
                        <li key={c.id}>
                          <Link to={`/courses/${c.id}`} className="text-sm text-slate-700 hover:text-accent-600 dark:text-slate-200">
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </DataBoundary>
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${tone === 'danger' && value !== '0' ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
          {value}
        </p>
      </CardBody>
    </Card>
  )
}
