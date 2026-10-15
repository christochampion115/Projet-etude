import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataBoundary } from '@/components/layout/DataBoundary'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useSnapshot } from '@/data/DataProvider'
import { computeProgramProgress, formatMinutes, groupTopicsByCourse, sumStudyMinutes } from '@/lib/selectors'
import { BarChart3 } from 'lucide-react'

export function StatisticsPage() {
  const { courses, topics, tasks, studySessions } = useSnapshot()

  const topicsByCourse = useMemo(() => groupTopicsByCourse(topics), [topics])
  const totalMinutes = sumStudyMinutes(studySessions)
  const totalSessions = studySessions.length
  const completedTasks = tasks.filter((t) => t.status === 'done').length

  const minutesByCourse = useMemo(() => {
    return courses
      .map((course) => ({
        name: course.name.length > 18 ? `${course.name.slice(0, 16)}…` : course.name,
        minutes: sumStudyMinutes(studySessions.filter((s) => s.courseId === course.id)),
      }))
      .filter((c) => c.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)
  }, [courses, studySessions])

  const last14Days = useMemo(() => {
    const days: { date: string; minutes: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const minutes = sumStudyMinutes(studySessions.filter((s) => s.date === key))
      days.push({ date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), minutes })
    }
    return days
  }, [studySessions])

  const programProgress = useMemo(() => {
    const withTopics = courses.filter((c) => (topicsByCourse.get(c.id)?.length ?? 0) > 0)
    if (withTopics.length === 0) return null
    const total = withTopics.reduce((sum, c) => sum + (computeProgramProgress(topicsByCourse.get(c.id) ?? []).percent ?? 0), 0)
    return Math.round(total / withTopics.length)
  }, [courses, topicsByCourse])

  const hasData = studySessions.length > 0 || tasks.length > 0 || topics.length > 0

  return (
    <div>
      <PageHeader title="Statistiques" description="Indicateurs calculés à partir de vos données réelles." />
      <DataBoundary>
        {!hasData ? (
          <EmptyState
            icon={<BarChart3 size={24} />}
            title="Pas encore assez de données"
            description="Ajoutez des séances d'étude, des tâches et des chapitres pour voir vos statistiques."
          />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <StatCard label="Temps d'étude total" value={formatMinutes(totalMinutes)} />
              <StatCard label="Séances enregistrées" value={String(totalSessions)} />
              <StatCard label="Tâches terminées" value={String(completedTasks)} />
              <StatCard label="Progression moyenne des programmes" value={programProgress === null ? '—' : `${programProgress}%`} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Temps d'étude par cours</CardTitle>
              </CardHeader>
              <CardBody>
                {minutesByCourse.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune séance d'étude enregistrée pour le moment.</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={minutesByCourse}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => formatMinutes(Number(value))} />
                        <Bar dataKey="minutes" fill="#6250e8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Évolution du temps d'étude (14 derniers jours)</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={last14Days}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => formatMinutes(Number(value))} />
                      <Bar dataKey="minutes" fill="#a79ef7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </DataBoundary>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      </CardBody>
    </Card>
  )
}
