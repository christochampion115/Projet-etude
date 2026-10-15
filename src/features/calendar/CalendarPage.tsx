import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataBoundary } from '@/components/layout/DataBoundary'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useSnapshot } from '@/data/DataProvider'
import { StudySessionFormModal } from './StudySessionFormModal'

interface DayEvent {
  kind: 'session' | 'exam' | 'task'
  id: string
  title: string
  courseId: string | null
  meta?: string
}

export function CalendarPage() {
  const { studySessions, exams, tasks, courses } = useSnapshot()
  const [month, setMonth] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date())
  const [sessionForm, setSessionForm] = useState(false)

  const courseName = (id: string | null) => (id ? courses.find((c) => c.id === id)?.name : null)

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>()
    const push = (key: string, event: DayEvent) => {
      const list = map.get(key) ?? []
      list.push(event)
      map.set(key, list)
    }
    for (const session of studySessions) {
      push(session.date, {
        kind: 'session',
        id: session.id,
        title: courseName(session.courseId) ?? 'Séance libre',
        courseId: session.courseId,
        meta: `${session.durationMinutes} min`,
      })
    }
    for (const exam of exams) {
      if (!exam.date) continue
      push(exam.date.slice(0, 10), { kind: 'exam', id: exam.id, title: exam.title, courseId: exam.courseId })
    }
    for (const task of tasks) {
      if (!task.dueDate || task.status === 'done') continue
      push(task.dueDate.slice(0, 10), { kind: 'task', id: task.id, title: task.title, courseId: task.courseId })
    }
    return map
  }, [studySessions, exams, tasks, courses])

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const selectedKey = format(selectedDay, 'yyyy-MM-dd')
  const selectedEvents = eventsByDay.get(selectedKey) ?? []

  return (
    <div>
      <PageHeader
        title="Calendrier"
        description="Séances d'étude, examens et échéances."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setSessionForm(true)}>
            Nouvelle séance
          </Button>
        }
      />
      <DataBoundary>
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
                {format(month, 'MMMM yyyy', { locale: fr })}
              </h3>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" icon={<ChevronLeft size={15} />} onClick={() => setMonth((m) => subMonths(m, 1))} />
                <Button size="sm" variant="secondary" onClick={() => setMonth(new Date())}>
                  Aujourd'hui
                </Button>
                <Button size="sm" variant="ghost" icon={<ChevronRight size={15} />} onClick={() => setMonth((m) => addMonths(m, 1))} />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const events = eventsByDay.get(key) ?? []
                const outside = !isSameMonth(day, month)
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(day)}
                    className={`flex h-20 flex-col items-start gap-1 rounded-lg border p-1.5 text-left transition-colors ${
                      isSameDay(day, selectedDay)
                        ? 'border-accent-400 bg-accent-50 dark:bg-accent-900/30'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                    } ${outside ? 'opacity-40' : ''}`}
                  >
                    <span className={`text-xs ${isToday(day) ? 'flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 font-semibold text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="flex flex-wrap gap-0.5">
                      {events.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className={`h-1.5 w-1.5 rounded-full ${
                            e.kind === 'exam' ? 'bg-red-500' : e.kind === 'task' ? 'bg-amber-500' : 'bg-accent-500'
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {format(selectedDay, "EEEE d MMMM", { locale: fr })}
            </h3>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun événement ce jour-là.</p>
            ) : (
              <ul className="space-y-2">
                {selectedEvents.map((event) => (
                  <li key={`${event.kind}-${event.id}`} className="rounded-lg border border-slate-100 p-2 text-sm dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{event.title}</span>
                      <Badge tone={event.kind === 'exam' ? 'danger' : event.kind === 'task' ? 'warning' : 'accent'}>
                        {event.kind === 'exam' ? 'Examen' : event.kind === 'task' ? 'Tâche' : 'Séance'}
                      </Badge>
                    </div>
                    {event.meta && <p className="text-xs text-slate-400">{event.meta}</p>}
                    {event.courseId && (
                      <Link to={`/courses/${event.courseId}`} className="text-xs text-accent-600 hover:underline">
                        Voir le cours
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DataBoundary>

      {sessionForm && (
        <StudySessionFormModal defaultDate={format(selectedDay, 'yyyy-MM-dd')} onClose={() => setSessionForm(false)} />
      )}
    </div>
  )
}
