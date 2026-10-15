import { FileText, ListChecks } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Course, CourseDocument, CourseTopic, Exam, Task } from '@/types/domain'

export function OverviewTab({
  course,
  tasks,
  exams,
  documents,
  onGoToTab,
}: {
  course: Course
  topics: CourseTopic[]
  tasks: Task[]
  exams: Exam[]
  documents: CourseDocument[]
  onGoToTab: (tab: 'tasks' | 'documents') => void
}) {
  const openTasks = tasks.filter((t) => t.status !== 'done').sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
  const upcomingExams = exams
    .filter((e) => e.date)
    .sort((a, b) => (a.date as string).localeCompare(b.date as string))
  const recentDocuments = [...documents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Description et modalités d'examen</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>{course.description || 'Aucune description personnelle renseignée pour ce cours.'}</p>
          <p className="text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-200">Modalités d'examen : </span>
            {course.examModalities || 'Non renseignées.'}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>À faire ensuite</CardTitle>
          <button onClick={() => onGoToTab('tasks')} className="text-xs font-medium text-accent-600 hover:underline">
            Voir tout
          </button>
        </CardHeader>
        <CardBody>
          {openTasks.length === 0 ? (
            <EmptyState icon={<ListChecks size={22} />} title="Aucune tâche ouverte" />
          ) : (
            <ul className="space-y-2">
              {openTasks.slice(0, 5).map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-200">{task.title}</span>
                  {task.dueDate && (
                    <Badge tone="neutral">{new Date(task.dueDate).toLocaleDateString('fr-FR')}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prochains examens</CardTitle>
        </CardHeader>
        <CardBody>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun examen planifié.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingExams.slice(0, 5).map((exam) => (
                <li key={exam.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-200">{exam.title}</span>
                  <Badge tone="accent">{new Date(exam.date as string).toLocaleDateString('fr-FR')}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Documents récemment ajoutés</CardTitle>
          <button onClick={() => onGoToTab('documents')} className="text-xs font-medium text-accent-600 hover:underline">
            Voir tout
          </button>
        </CardHeader>
        <CardBody>
          {recentDocuments.length === 0 ? (
            <EmptyState icon={<FileText size={22} />} title="Aucun document pour le moment" />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentDocuments.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-200">{doc.displayName}</span>
                  <span className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
