import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select } from '@/components/ui/form'
import { useDataStore } from '@/data/DataProvider'
import { TaskFormModal } from '@/features/tasks/TaskFormModal'
import { ExamFormModal } from '@/features/tasks/ExamFormModal'
import { ExamResultSelect } from '@/features/tasks/ExamResultSelect'
import { EXAM_PREPARATION_STATUSES, TASK_PRIORITIES, TASK_TYPES } from '@/types/domain'
import type { Exam, Task } from '@/types/domain'

export function TasksExamsTab({ courseId, tasks, exams }: { courseId: string; tasks: Task[]; exams: Exam[] }) {
  const store = useDataStore()
  const [taskForm, setTaskForm] = useState<{ open: boolean; task?: Task } | null>(null)
  const [examForm, setExamForm] = useState<{ open: boolean; exam?: Exam } | null>(null)
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null)

  const sortedTasks = [...tasks].sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
  const sortedExams = [...exams].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tâches</CardTitle>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setTaskForm({ open: true })}>
            Ajouter
          </Button>
        </CardHeader>
        <CardBody>
          {sortedTasks.length === 0 ? (
            <EmptyState title="Aucune tâche" actionLabel="Ajouter une tâche" onAction={() => setTaskForm({ open: true })} />
          ) : (
            <ul className="space-y-2">
              {sortedTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={(e) => void store.setTaskStatus(task.id, e.target.checked ? 'done' : 'todo')}
                    className="h-4 w-4 accent-accent-600"
                  />
                  <button className="flex-1 text-left" onClick={() => setTaskForm({ open: true, task })}>
                    <p className={`text-sm font-medium ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge tone="neutral">{TASK_TYPES.find((t) => t.value === task.type)?.label}</Badge>
                      <Badge tone={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'neutral'}>
                        {TASK_PRIORITIES.find((p) => p.value === task.priority)?.label}
                      </Badge>
                      {task.dueDate && <Badge tone="accent">{new Date(task.dueDate).toLocaleDateString('fr-FR')}</Badge>}
                    </div>
                  </button>
                  <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setDeleteTask(task)} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Examens</CardTitle>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setExamForm({ open: true })}>
            Ajouter
          </Button>
        </CardHeader>
        <CardBody>
          {sortedExams.length === 0 ? (
            <EmptyState title="Aucun examen" actionLabel="Ajouter un examen" onAction={() => setExamForm({ open: true })} />
          ) : (
            <ul className="space-y-2">
              {sortedExams.map((exam) => (
                <li key={exam.id} className="rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <button className="text-left" onClick={() => setExamForm({ open: true, exam })}>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{exam.title}</p>
                      <p className="text-xs text-slate-400">
                        {exam.date ? new Date(exam.date).toLocaleDateString('fr-FR') : 'Date à définir'}
                      </p>
                    </button>
                    <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setDeleteExam(exam)} />
                  </div>
                  <Select
                    className="mt-2"
                    value={exam.preparationStatus}
                    onChange={(e) => void store.updateExam(exam.id, { preparationStatus: e.target.value as Exam['preparationStatus'] })}
                  >
                    {EXAM_PREPARATION_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        Préparation : {s.label}
                      </option>
                    ))}
                  </Select>
                  <ExamResultSelect exam={exam} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {taskForm?.open && (
        <TaskFormModal task={taskForm.task} defaultCourseId={courseId} onClose={() => setTaskForm(null)} />
      )}
      {examForm?.open && (
        <ExamFormModal exam={examForm.exam} defaultCourseId={courseId} onClose={() => setExamForm(null)} />
      )}
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
