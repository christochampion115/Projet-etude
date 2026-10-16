import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Archive, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { DataBoundary } from '@/components/layout/DataBoundary'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDataStore, useSnapshot } from '@/data/DataProvider'
import { computeProgramProgress, computeTaskProgress, describeCourseCategory, findNextDeadline } from '@/lib/selectors'
import { pushRecentCourseId } from '@/lib/recentCourses'
import { CourseFormModal } from './CourseFormModal'
import { OverviewTab } from './detail/OverviewTab'
import { DocumentsTab } from './detail/DocumentsTab'
import { ProgramTab } from './detail/ProgramTab'
import { TasksExamsTab } from './detail/TasksExamsTab'
import { NotesTab } from './detail/NotesTab'
import { StudySessionsTab } from './detail/StudySessionsTab'

const TABS = [
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'documents', label: 'Documents' },
  { key: 'program', label: 'Programme et progression' },
  { key: 'tasks', label: 'Tâches et examens' },
  { key: 'notes', label: 'Notes personnelles' },
  { key: 'sessions', label: "Séances d'étude" },
] as const

type TabKey = (typeof TABS)[number]['key']

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const store = useDataStore()
  const snapshot = useSnapshot()
  const { academicYears, academicPeriods } = snapshot
  const [tab, setTab] = useState<TabKey>('overview')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const course = snapshot.courses.find((c) => c.id === courseId)

  useEffect(() => {
    if (course) pushRecentCourseId(course.id)
  }, [course])

  const topics = useMemo(() => snapshot.topics.filter((t) => t.courseId === courseId), [snapshot.topics, courseId])
  const tasks = useMemo(() => snapshot.tasks.filter((t) => t.courseId === courseId), [snapshot.tasks, courseId])
  const exams = useMemo(() => snapshot.exams.filter((e) => e.courseId === courseId), [snapshot.exams, courseId])
  const documents = useMemo(() => snapshot.documents.filter((d) => d.courseId === courseId), [snapshot.documents, courseId])
  const notes = useMemo(() => snapshot.notes.filter((n) => n.courseId === courseId), [snapshot.notes, courseId])
  const sessions = useMemo(
    () => snapshot.studySessions.filter((s) => s.courseId === courseId),
    [snapshot.studySessions, courseId],
  )

  return (
    <DataBoundary>
      {!course ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">Cours introuvable</p>
          <p className="text-sm text-slate-500">Ce cours n'existe pas ou a été supprimé.</p>
          <Button variant="primary" onClick={() => navigate('/courses')}>
            Retour à mes cours
          </Button>
        </div>
      ) : (
        <div>
          <Link to="/courses" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-accent-600">
            <ArrowLeft size={15} /> Mes cours
          </Link>

          <CourseHeader
            course={course}
            years={academicYears}
            periods={academicPeriods}
            categories={snapshot.courseCategories}
            topics={topics}
            tasks={tasks}
            exams={exams}
            onEdit={() => setEditing(true)}
            onDelete={() => setConfirmDelete(true)}
          />

          <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'border-accent-600 text-accent-700 dark:text-accent-300'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {tab === 'overview' && (
              <OverviewTab course={course} topics={topics} tasks={tasks} exams={exams} documents={documents} onGoToTab={setTab} />
            )}
            {tab === 'documents' && <DocumentsTab courseId={course.id} documents={documents} />}
            {tab === 'program' && <ProgramTab courseId={course.id} topics={topics} />}
            {tab === 'tasks' && <TasksExamsTab courseId={course.id} tasks={tasks} exams={exams} />}
            {tab === 'notes' && <NotesTab courseId={course.id} notes={notes} />}
            {tab === 'sessions' && <StudySessionsTab courseId={course.id} sessions={sessions} />}
          </div>

          {editing && <CourseFormModal course={course} onClose={() => setEditing(false)} />}
          <ConfirmDialog
            open={confirmDelete}
            title="Supprimer ce cours ?"
            description="Tous les documents, chapitres, tâches, examens, séances et notes associés à ce cours seront définitivement supprimés. Cette action est irréversible."
            confirmLabel="Supprimer définitivement"
            onCancel={() => setConfirmDelete(false)}
            onConfirm={async () => {
              await store.deleteCourse(course.id)
              navigate('/courses')
            }}
          />
        </div>
      )}
    </DataBoundary>
  )
}

function CourseHeader({
  course,
  years,
  periods,
  categories,
  topics,
  tasks,
  exams,
  onEdit,
  onDelete,
}: {
  course: ReturnType<typeof useSnapshot>['courses'][number]
  years: ReturnType<typeof useSnapshot>['academicYears']
  periods: ReturnType<typeof useSnapshot>['academicPeriods']
  categories: ReturnType<typeof useSnapshot>['courseCategories']
  topics: ReturnType<typeof useSnapshot>['topics']
  tasks: ReturnType<typeof useSnapshot>['tasks']
  exams: ReturnType<typeof useSnapshot>['exams']
  onEdit: () => void
  onDelete: () => void
}) {
  const store = useDataStore()
  const year = years.find((y) => y.id === course.academicYearId)
  const coursePeriods = periods.filter((p) => course.periodIds.includes(p.id))
  const categoryLabel = describeCourseCategory(course.categoryId, categories.filter((c) => c.academicYearId === course.academicYearId))
  const progress = computeProgramProgress(topics)
  const taskProgress = computeTaskProgress(tasks)
  const deadline = findNextDeadline(course.id, tasks, exams)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{course.name}</h2>
            {course.status === 'completed' && <Badge tone="success">Terminé</Badge>}
            {course.status === 'archived' && <Badge tone="neutral">Archivé</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {course.professors.length > 0 ? course.professors.join(', ') : 'Professeur non renseigné'}
            {' · '}
            {year?.label ?? 'Année inconnue'}
            {coursePeriods.length > 0 ? ` · ${coursePeriods.map((p) => p.name).join(', ')}` : ''}
            {course.ects ? ` · ${course.ects} ECTS` : ''}
          </p>
          {categoryLabel && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{categoryLabel}</p>}
        </div>
        <div className="flex items-center gap-2">
          {course.status === 'active' && (
            <Button size="sm" variant="ghost" icon={<CheckCircle2 size={14} />} onClick={() => void store.updateCourse(course.id, { status: 'completed' })}>
              Marquer terminé
            </Button>
          )}
          {course.status !== 'archived' && (
            <Button size="sm" variant="ghost" icon={<Archive size={14} />} onClick={() => void store.updateCourse(course.id, { status: 'archived' })}>
              Archiver
            </Button>
          )}
          <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={onEdit}>
            Modifier
          </Button>
          <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={onDelete}>
            Supprimer
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Programme</p>
          <div className="mt-1">
            <ProgressBar percent={progress.percent} />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Tâches</p>
          <div className="mt-1">
            <ProgressBar percent={taskProgress.percent} tone="success" emptyLabel="Aucune tâche" />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Prochaine échéance</p>
          <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
            {deadline ? `${new Date(deadline.date).toLocaleDateString('fr-FR')} — ${deadline.title}` : 'Aucune'}
          </p>
        </div>
      </div>
    </div>
  )
}
