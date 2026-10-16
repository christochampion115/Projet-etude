import type {
  AcademicPeriod,
  AcademicYear,
  Course,
  CourseCategory,
  CourseTopic,
  Exam,
  StudySession,
  Task,
} from '@/types/domain'

export function hasExamPassed(date: string | null, referenceDate = new Date()): boolean {
  if (!date) return false
  // Une date sans heure couvre toute la journée locale de l'examen.
  const end = date.length === 10 ? new Date(`${date}T23:59:59.999`) : new Date(date)
  return end.getTime() < referenceDate.getTime()
}

/** Domaines d'une année académique, triés par nom. */
export function domainesForYear(categories: CourseCategory[], academicYearId: string): CourseCategory[] {
  return categories
    .filter((c) => c.academicYearId === academicYearId && c.kind === 'domaine')
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

/** Options rattachées à un domaine donné, triées par nom. */
export function optionsForDomaine(categories: CourseCategory[], domaineId: string): CourseCategory[] {
  return categories
    .filter((c) => c.kind === 'option' && c.parentId === domaineId)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

/** Autres catégories (ni domaine ni option) d'une année académique, triées par nom. */
export function autresCategoriesForYear(categories: CourseCategory[], academicYearId: string): CourseCategory[] {
  return categories
    .filter((c) => c.academicYearId === academicYearId && c.kind === 'autre')
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

/**
 * Liste aplatie de toutes les catégories d'une année, avec un libellé prêt à
 * afficher (les options sont préfixées par le nom de leur domaine).
 */
export function courseCategoryOptions(categories: CourseCategory[], academicYearId: string): { id: string; label: string }[] {
  const domaines = domainesForYear(categories, academicYearId)
  const autres = autresCategoriesForYear(categories, academicYearId)
  return [
    ...domaines.flatMap((domaine) => [
      { id: domaine.id, label: `Domaine · ${domaine.name}` },
      ...optionsForDomaine(categories, domaine.id).map((option) => ({
        id: option.id,
        label: `Option · ${domaine.name} / ${option.name}`,
      })),
    ]),
    ...autres.map((autre) => ({ id: autre.id, label: `Autre catégorie · ${autre.name}` })),
  ]
}

/** Libellé lisible de la catégorie d'un cours (`null` pour le tronc commun). */
export function describeCourseCategory(categoryId: string | null, categories: CourseCategory[]): string | null {
  if (!categoryId) return null
  const category = categories.find((c) => c.id === categoryId)
  if (!category) return null
  if (category.kind === 'domaine') return `Domaine : ${category.name}`
  if (category.kind === 'autre') return `Catégorie : ${category.name}`
  const domaine = categories.find((c) => c.id === category.parentId)
  return `Option : ${category.name}${domaine ? ` (Domaine ${domaine.name})` : ''}`
}

export interface ProgramProgress {
  completed: number
  total: number
  /** `null` lorsque le cours ne possède aucun chapitre : aucun pourcentage ne doit être affiché. */
  percent: number | null
}

/** Progression du programme = chapitres terminés / nombre total de chapitres. */
export function computeProgramProgress(topics: CourseTopic[]): ProgramProgress {
  const total = topics.length
  const completed = topics.filter((t) => t.status === 'done').length
  return { completed, total, percent: total === 0 ? null : Math.round((completed / total) * 100) }
}

export interface TaskProgress {
  open: number
  done: number
  overdue: number
  total: number
  percent: number | null
}

export function computeTaskProgress(tasks: Task[], referenceDate: Date = new Date()): TaskProgress {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const open = tasks.filter((t) => t.status !== 'done').length
  const overdue = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate !== null && new Date(t.dueDate) < referenceDate,
  ).length
  return { open, done, overdue, total, percent: total === 0 ? null : Math.round((done / total) * 100) }
}

/** Temps d'étude cumulé (en minutes) pour un ensemble de séances. */
export function sumStudyMinutes(sessions: StudySession[]): number {
  return sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0 min'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  if (rest === 0) return `${hours} h`
  return `${hours} h ${rest}`
}

export interface NextDeadline {
  kind: 'task' | 'exam'
  id: string
  title: string
  date: string
}

/** Prochaine échéance (tâche ou examen datés) pour un cours donné, triée par date croissante. */
export function findNextDeadline(courseId: string, tasks: Task[], exams: Exam[], referenceDate = new Date()): NextDeadline | null {
  const candidates: NextDeadline[] = [
    ...tasks
      .filter((t) => t.courseId === courseId && t.status !== 'done' && t.dueDate)
      .map((t) => ({ kind: 'task' as const, id: t.id, title: t.title, date: t.dueDate as string })),
    ...exams
      .filter((e) => e.courseId === courseId && e.date)
      .map((e) => ({ kind: 'exam' as const, id: e.id, title: e.title, date: e.date as string })),
  ].filter((c) => new Date(c.date) >= referenceDate)

  candidates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return candidates[0] ?? null
}

/** Cours visibles dans la liste principale (actifs), triés par nom. */
export function visibleCourses(courses: Course[]): Course[] {
  return courses.filter((c) => c.status === 'active').sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

export function archivedOrCompletedCourses(courses: Course[]): Course[] {
  return courses.filter((c) => c.status !== 'active').sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

export function activeAcademicYear(years: AcademicYear[]): AcademicYear | null {
  return years.find((y) => y.isActive) ?? years[0] ?? null
}

export function periodsForYear(periods: AcademicPeriod[], yearId: string): AcademicPeriod[] {
  return periods.filter((p) => p.academicYearId === yearId).sort((a, b) => a.order - b.order)
}

/**
 * Détermine les cours qui nécessitent de l'attention : échéance proche
 * (moins de 7 jours) ou programme peu avancé (< 30 % alors que des chapitres existent).
 */
export function coursesNeedingAttention(
  courses: Course[],
  topicsByCourse: Map<string, CourseTopic[]>,
  tasks: Task[],
  exams: Exam[],
  referenceDate = new Date(),
): Course[] {
  const sevenDaysFromNow = new Date(referenceDate.getTime() + 7 * 24 * 60 * 60 * 1000)
  return visibleCourses(courses).filter((course) => {
    const deadline = findNextDeadline(course.id, tasks, exams, referenceDate)
    const hasCloseDeadline = deadline !== null && new Date(deadline.date) <= sevenDaysFromNow
    const progress = computeProgramProgress(topicsByCourse.get(course.id) ?? [])
    const hasLowProgress = progress.percent !== null && progress.percent < 30
    return hasCloseDeadline || hasLowProgress
  })
}

export function groupTopicsByCourse(topics: CourseTopic[]): Map<string, CourseTopic[]> {
  const map = new Map<string, CourseTopic[]>()
  for (const topic of topics) {
    const list = map.get(topic.courseId) ?? []
    list.push(topic)
    map.set(topic.courseId, list)
  }
  return map
}
