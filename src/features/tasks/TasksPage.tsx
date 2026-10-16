import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListChecks, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataBoundary } from '@/components/layout/DataBoundary'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select } from '@/components/ui/form'
import { useDataStore, useSnapshot } from '@/data/DataProvider'
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES, EXAM_PREPARATION_STATUSES } from '@/types/domain'
import { TaskFormModal } from './TaskFormModal'
import { ExamFormModal } from './ExamFormModal'
import { ExamResultSelect } from './ExamResultSelect'
import type { Exam, Task } from '@/types/domain'

type ViewMode = 'tasks' | 'exams'

export function TasksPage() {
  const store = useDataStore()
  const { tasks, exams, courses } = useSnapshot()
  const [view, setView] = useState<ViewMode>('tasks')
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [taskForm, setTaskForm] = useState<{ open: boolean; task?: Task } | null>(null)
  const [examForm, setExamForm] = useState<{ open: boolean; exam?: Exam } | null>(null)
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null)

  const courseName = (id: string) => courses.find((c) => c.id === id)?.name ?? 'Cours supprimé'

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => courseFilter === 'all' || t.courseId === courseFilter)
      .filter((t) => statusFilter === 'all' || t.status === statusFilter)
      .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
  }, [tasks, courseFilter, statusFilter])

  const filteredExams = useMemo(() => {
    return exams
      .filter((e) => courseFilter === 'all' || e.courseId === courseFilter)
      .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
  }, [exams, courseFilter])

  return (
    <div>
      <PageHeader
        title="Tâches et examens"
        description="Toutes vos échéances, tous cours confondus."
        actions={
          <>
            <Button icon={<Plus size={15} />} onClick={() => setTaskForm({ open: true })} disabled={courses.length === 0}>
              Tâche
            </Button>
            <Button icon={<Plus size={15} />} onClick={() => setExamForm({ open: true })} disabled={courses.length === 0}>
              Examen
            </Button>
          </>
        }
      />
      <DataBoundary>
        {courses.length === 0 ? (
          <EmptyState
            icon={<ListChecks size={24} />}
            title="Aucun cours"
            description="Créez un cours avant de pouvoir ajouter des tâches ou des examens."
          />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                <button
                  onClick={() => setView('tasks')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === 'tasks' ? 'bg-accent-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  Tâches
                </button>
                <button
                  onClick={() => setView('exams')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === 'exams' ? 'bg-accent-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  Examens
                </button>
              </div>
              <Select className="w-auto" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
                <option value="all">Tous les cours</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {view === 'tasks' && (
                <Select className="w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">Tous les statuts</option>
                  {TASK_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {view === 'tasks' ? (
              filteredTasks.length === 0 ? (
                <EmptyState title="Aucune tâche" actionLabel="Ajouter une tâche" onAction={() => setTaskForm({ open: true })} />
              ) : (
                <ul className="space-y-2">
                  {filteredTasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                      <input
                        type="checkbox"
                        checked={task.status === 'done'}
                        onChange={(e) => void store.setTaskStatus(task.id, e.target.checked ? 'done' : 'todo')}
                        className="h-4 w-4 accent-accent-600"
                      />
                      <div
                        role="button"
                        tabIndex={0}
                        className="flex-1 cursor-pointer text-left"
                        onClick={() => setTaskForm({ open: true, task })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') setTaskForm({ open: true, task })
                        }}
                      >
                        <p className={`text-sm font-medium ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                          {task.title}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Link to={`/courses/${task.courseId}`} className="text-xs text-accent-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                            {courseName(task.courseId)}
                          </Link>
                          <Badge tone="neutral">{TASK_TYPES.find((t) => t.value === task.type)?.label}</Badge>
                          <Badge tone={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'neutral'}>
                            {TASK_PRIORITIES.find((p) => p.value === task.priority)?.label}
                          </Badge>
                          {task.dueDate && <Badge tone="accent">{new Date(task.dueDate).toLocaleDateString('fr-FR')}</Badge>}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setDeleteTask(task)} />
                    </li>
                  ))}
                </ul>
              )
            ) : filteredExams.length === 0 ? (
              <EmptyState title="Aucun examen" actionLabel="Ajouter un examen" onAction={() => setExamForm({ open: true })} />
            ) : (
              <ul className="space-y-2">
                {filteredExams.map((exam) => (
                  <li key={exam.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div
                      role="button"
                      tabIndex={0}
                      className="flex-1 cursor-pointer text-left"
                      onClick={() => setExamForm({ open: true, exam })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setExamForm({ open: true, exam })
                      }}
                    >
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{exam.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Link to={`/courses/${exam.courseId}`} className="text-xs text-accent-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                          {courseName(exam.courseId)}
                        </Link>
                        {exam.date && <Badge tone="accent">{new Date(exam.date).toLocaleDateString('fr-FR')}</Badge>}
                        <Badge tone="neutral">{EXAM_PREPARATION_STATUSES.find((s) => s.value === exam.preparationStatus)?.label}</Badge>
                      </div>
                    </div>
                    <ExamResultSelect exam={exam} />
                    <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setDeleteExam(exam)} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </DataBoundary>

      {taskForm?.open && <TaskFormModal task={taskForm.task} onClose={() => setTaskForm(null)} />}
      {examForm?.open && <ExamFormModal exam={examForm.exam} onClose={() => setExamForm(null)} />}
      <ConfirmDialog
        open={deleteTask !== null}
        title="Supprimer cette tâche ?"
        description={`"${deleteTask?.title}" sera définitivement supprimée.`}
        confirmLabel="Supprimer"
        onCancel={() => setDeleteTask(null)}
        onConfirm={() => {
          if (deleteTask) void store.deleteTask(deleteTask.id)
          setDeleteTask(null)
        }}
      />
      <ConfirmDialog
        open={deleteExam !== null}
        title="Supprimer cet examen ?"
        description={`"${deleteExam?.title}" sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        onCancel={() => setDeleteExam(null)}
        onConfirm={() => {
          if (deleteExam) void store.deleteExam(deleteExam.id)
          setDeleteExam(null)
        }}
      />
    </div>
  )
}
