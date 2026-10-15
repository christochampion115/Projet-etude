import { useState } from 'react'
import { Pause, Play, Square } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataBoundary } from '@/components/layout/DataBoundary'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/form'
import { Badge } from '@/components/ui/Badge'
import { useFocusTimer } from '@/context/FocusTimerContext'
import { useSnapshot } from '@/data/DataProvider'
import { formatMinutes } from '@/lib/selectors'

function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function FocusPage() {
  const { state, remainingMs, start, pause, resume, stop } = useFocusTimer()
  const { courses, studySessions, preference } = useSnapshot()
  const [courseId, setCourseId] = useState('')
  const [workMinutes, setWorkMinutes] = useState(preference?.focusWorkMinutes ?? 25)
  const [breakMinutes, setBreakMinutes] = useState(preference?.focusBreakMinutes ?? 5)

  const timerSessions = [...studySessions]
    .filter((s) => s.source === 'timer')
    .sort((a, b) => b.startTime.localeCompare(a.startTime))
    .slice(0, 8)

  const courseName = (id: string | null) => (id ? courses.find((c) => c.id === id)?.name ?? 'Cours supprimé' : 'Sans cours')
  const circumference = 2 * Math.PI * 90
  const totalMs = (state.phase === 'work' ? state.workMinutes : state.breakMinutes) * 60_000
  const dashOffset = totalMs > 0 ? circumference * (1 - remainingMs / totalMs) : 0

  return (
    <div>
      <PageHeader title="Minuteur de concentration" description="Des séances de travail chronométrées, associées à un cours." />
      <DataBoundary>
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardBody className="flex flex-col items-center gap-6 py-10">
              <div className="relative flex h-56 w-56 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" strokeWidth="10" className="fill-none stroke-slate-100 dark:stroke-slate-800" />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className={`fill-none transition-all duration-1000 ${state.phase === 'work' ? 'stroke-accent-600' : 'stroke-emerald-500'}`}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatClock(remainingMs)}
                  </span>
                  <Badge tone={state.phase === 'work' ? 'accent' : 'success'}>
                    {state.phase === 'work' ? 'Travail' : 'Pause'}
                  </Badge>
                </div>
              </div>

              {state.status === 'idle' ? (
                <div className="grid w-full max-w-sm gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block font-medium text-slate-700 dark:text-slate-200">Cours (facultatif)</span>
                    <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                      <option value="">Sans cours</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <div />
                  <label className="text-sm">
                    <span className="mb-1 block font-medium text-slate-700 dark:text-slate-200">Travail (min)</span>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={workMinutes}
                      onChange={(e) => setWorkMinutes(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-medium text-slate-700 dark:text-slate-200">Pause (min)</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Cours : {courseName(state.courseId)}</p>
              )}

              <div className="flex gap-2">
                {state.status === 'idle' && (
                  <Button
                    variant="primary"
                    icon={<Play size={16} />}
                    onClick={() => start({ courseId: courseId || null, workMinutes, breakMinutes })}
                  >
                    Démarrer
                  </Button>
                )}
                {state.status === 'running' && (
                  <Button variant="secondary" icon={<Pause size={16} />} onClick={pause}>
                    Mettre en pause
                  </Button>
                )}
                {state.status === 'paused' && (
                  <Button variant="primary" icon={<Play size={16} />} onClick={resume}>
                    Reprendre
                  </Button>
                )}
                {state.status !== 'idle' && (
                  <Button variant="danger" icon={<Square size={16} />} onClick={stop}>
                    Arrêter
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dernières séances (minuteur)</CardTitle>
            </CardHeader>
            <CardBody>
              {timerSessions.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune séance enregistrée via le minuteur pour le moment.</p>
              ) : (
                <ul className="space-y-2">
                  {timerSessions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-200">{courseName(s.courseId)}</p>
                        <p className="text-xs text-slate-400">{new Date(s.startTime).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                      </div>
                      <span className="font-medium text-slate-600 dark:text-slate-300">{formatMinutes(s.durationMinutes)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </DataBoundary>
    </div>
  )
}
