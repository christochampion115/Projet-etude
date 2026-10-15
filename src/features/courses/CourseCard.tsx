import { ChevronRight } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { computeProgramProgress, findNextDeadline } from '@/lib/selectors'
import type { Course, CourseTopic, Exam, Task } from '@/types/domain'

export function CourseCard({
  course,
  topics,
  tasks,
  exams,
  onOpen,
}: {
  course: Course
  topics: CourseTopic[]
  tasks: Task[]
  exams: Exam[]
  onOpen: () => void
}) {
  const progress = computeProgramProgress(topics)
  const nextDeadline = findNextDeadline(course.id, tasks, exams)
  const openTasks = tasks.filter((t) => t.status !== 'done').length

  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardBody>
        <button onClick={onOpen} className="block w-full text-left">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{course.name}</h3>
            <ChevronRight size={16} className="mt-0.5 shrink-0 text-slate-300" />
          </div>
          {course.professors.length > 0 && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{course.professors.join(', ')}</p>
          )}
          <div className="mt-3">
            <ProgressBar percent={progress.percent} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {nextDeadline && (
              <Badge tone="accent">
                {new Date(nextDeadline.date).toLocaleDateString('fr-FR')} · {nextDeadline.title}
              </Badge>
            )}
            {openTasks > 0 && <Badge tone="neutral">{openTasks} tâche(s) ouverte(s)</Badge>}
            {course.status === 'completed' && <Badge tone="success">Terminé</Badge>}
            {course.status === 'archived' && <Badge tone="neutral">Archivé</Badge>}
          </div>
        </button>
      </CardBody>
    </Card>
  )
}
