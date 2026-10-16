import { describe, expect, it } from 'vitest'
import {
  autresCategoriesForYear,
  computeProgramProgress,
  computeTaskProgress,
  coursesNeedingAttention,
  courseCategoryOptions,
  describeCourseCategory,
  domainesForYear,
  findNextDeadline,
  formatMinutes,
  groupTopicsByCourse,
  hasExamPassed,
  optionsForDomaine,
  sumStudyMinutes,
} from '@/lib/selectors'
import type { Course, CourseCategory, CourseTopic, Exam, StudySession, Task } from '@/types/domain'

const OWNER = 'owner-1'

function makeTopic(overrides: Partial<CourseTopic>): CourseTopic {
  return {
    id: 'topic-1',
    courseId: 'course-1',
    title: 'Chapitre',
    description: null,
    status: 'pending',
    order: 0,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 'task-1',
    ownerId: OWNER,
    courseId: 'course-1',
    title: 'Tâche',
    description: null,
    type: 'assignment',
    dueDate: null,
    priority: 'medium',
    status: 'todo',
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeExam(overrides: Partial<Exam>): Exam {
  return {
    id: 'exam-1',
    ownerId: OWNER,
    courseId: 'course-1',
    title: 'Examen',
    date: null,
    type: 'written',
    modalities: null,
    preparationStatus: 'not_started',
    result: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeCourse(overrides: Partial<Course>): Course {
  return {
    id: 'course-1',
    ownerId: OWNER,
    academicYearId: 'year-1',
    periodIds: ['period-1'],
    categoryId: null,
    name: 'Cours',
    professors: [],
    description: null,
    ects: null,
    status: 'active',
    examModalities: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeCategory(overrides: Partial<CourseCategory>): CourseCategory {
  return {
    id: 'category-1',
    ownerId: OWNER,
    academicYearId: 'year-1',
    kind: 'domaine',
    parentId: null,
    name: 'Catégorie',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('hasExamPassed', () => {
  it("attend la fin de la journée locale de l'examen", () => {
    expect(hasExamPassed('2026-06-10', new Date('2026-06-10T23:59:59.999'))).toBe(false)
    expect(hasExamPassed('2026-06-10', new Date('2026-06-11T00:00:00'))).toBe(true)
    expect(hasExamPassed('2026-06-12', new Date('2026-06-11T12:00:00'))).toBe(false)
    expect(hasExamPassed(null)).toBe(false)
    expect(hasExamPassed('invalid')).toBe(false)
  })
})

describe('catégorisation des cours (domaine / option / autre)', () => {
  const domaine = makeCategory({ id: 'domaine-1', kind: 'domaine', name: 'Sciences' })
  const option = makeCategory({ id: 'option-1', kind: 'option', parentId: domaine.id, name: 'Informatique' })
  const autre = makeCategory({ id: 'autre-1', kind: 'autre', name: 'Alternance' })
  const categories = [domaine, option, autre]

  it('sépare domaines, options et autres catégories', () => {
    expect(domainesForYear(categories, 'year-1')).toEqual([domaine])
    expect(optionsForDomaine(categories, domaine.id)).toEqual([option])
    expect(autresCategoriesForYear(categories, 'year-1')).toEqual([autre])
  })

  it('construit une liste aplatie avec des libellés lisibles', () => {
    expect(courseCategoryOptions(categories, 'year-1')).toEqual([
      { id: domaine.id, label: 'Domaine · Sciences' },
      { id: option.id, label: 'Option · Sciences / Informatique' },
      { id: autre.id, label: 'Autre catégorie · Alternance' },
    ])
  })

  it('décrit la catégorie d\'un cours, ou renvoie null pour le tronc commun', () => {
    expect(describeCourseCategory(null, categories)).toBeNull()
    expect(describeCourseCategory(domaine.id, categories)).toBe('Domaine : Sciences')
    expect(describeCourseCategory(option.id, categories)).toBe('Option : Informatique (Domaine Sciences)')
    expect(describeCourseCategory(autre.id, categories)).toBe('Catégorie : Alternance')
  })
})

describe('computeProgramProgress', () => {
  it('retourne percent=null quand le cours ne possède aucun chapitre', () => {
    expect(computeProgramProgress([])).toEqual({ completed: 0, total: 0, percent: null })
  })

  it('calcule le pourcentage de chapitres terminés', () => {
    const topics = [
      makeTopic({ id: 't1', status: 'done' }),
      makeTopic({ id: 't2', status: 'done' }),
      makeTopic({ id: 't3', status: 'pending' }),
      makeTopic({ id: 't4', status: 'in_progress' }),
    ]
    expect(computeProgramProgress(topics)).toEqual({ completed: 2, total: 4, percent: 50 })
  })
})

describe('computeTaskProgress', () => {
  it('compte les tâches ouvertes, terminées et en retard', () => {
    const now = new Date('2026-03-15T00:00:00.000Z')
    const tasks = [
      makeTask({ id: 'a', status: 'done' }),
      makeTask({ id: 'b', status: 'todo', dueDate: '2026-03-10T00:00:00.000Z' }), // overdue
      makeTask({ id: 'c', status: 'todo', dueDate: '2026-04-01T00:00:00.000Z' }), // not yet due
      makeTask({ id: 'd', status: 'in_progress' }),
    ]
    const progress = computeTaskProgress(tasks, now)
    expect(progress.total).toBe(4)
    expect(progress.done).toBe(1)
    expect(progress.open).toBe(3)
    expect(progress.overdue).toBe(1)
    expect(progress.percent).toBe(25)
  })

  it('retourne percent=null quand il n\'y a aucune tâche', () => {
    expect(computeTaskProgress([]).percent).toBeNull()
  })
})

describe('sumStudyMinutes / formatMinutes', () => {
  it('additionne les minutes des séances', () => {
    const sessions: StudySession[] = [
      { id: '1', ownerId: OWNER, courseId: null, date: '2026-01-01', startTime: '', durationMinutes: 30, source: 'manual', notes: null, createdAt: '', updatedAt: '' },
      { id: '2', ownerId: OWNER, courseId: null, date: '2026-01-02', startTime: '', durationMinutes: 45, source: 'timer', notes: null, createdAt: '', updatedAt: '' },
    ]
    expect(sumStudyMinutes(sessions)).toBe(75)
  })

  it('formate les minutes en heures/minutes lisibles', () => {
    expect(formatMinutes(0)).toBe('0 min')
    expect(formatMinutes(45)).toBe('45 min')
    expect(formatMinutes(60)).toBe('1 h')
    expect(formatMinutes(90)).toBe('1 h 30')
  })
})

describe('findNextDeadline', () => {
  it("ignore les tâches terminées et les échéances passées, retient la plus proche", () => {
    const now = new Date('2026-03-01T00:00:00.000Z')
    const tasks = [
      makeTask({ id: 'past', dueDate: '2026-02-01T00:00:00.000Z' }),
      makeTask({ id: 'done', status: 'done', dueDate: '2026-03-10T00:00:00.000Z' }),
      makeTask({ id: 'soon', dueDate: '2026-03-05T00:00:00.000Z' }),
      makeTask({ id: 'later', dueDate: '2026-03-20T00:00:00.000Z' }),
    ]
    const exams = [makeExam({ id: 'exam-soon', date: '2026-03-03T00:00:00.000Z' })]
    const deadline = findNextDeadline('course-1', tasks, exams, now)
    expect(deadline).toMatchObject({ kind: 'exam', id: 'exam-soon' })
  })

  it('retourne null quand aucune échéance future', () => {
    expect(findNextDeadline('course-1', [], [], new Date())).toBeNull()
  })
})

describe('coursesNeedingAttention', () => {
  it("retient les cours avec échéance proche ou programme peu avancé", () => {
    const now = new Date('2026-03-01T00:00:00.000Z')
    const courses = [
      makeCourse({ id: 'c-ok', name: 'OK' }),
      makeCourse({ id: 'c-deadline', name: 'Deadline proche' }),
      makeCourse({ id: 'c-low-progress', name: 'Peu avancé' }),
    ]
    const topics = [
      makeTopic({ id: 't1', courseId: 'c-low-progress', status: 'pending' }),
      makeTopic({ id: 't2', courseId: 'c-low-progress', status: 'pending' }),
      makeTopic({ id: 't3', courseId: 'c-low-progress', status: 'pending' }),
      makeTopic({ id: 't4', courseId: 'c-low-progress', status: 'done' }),
      makeTopic({ id: 't5', courseId: 'c-ok', status: 'done' }),
    ]
    const tasks = [makeTask({ id: 'task-deadline', courseId: 'c-deadline', dueDate: '2026-03-03T00:00:00.000Z' })]
    const result = coursesNeedingAttention(courses, groupTopicsByCourse(topics), tasks, [], now)
    const ids = result.map((c) => c.id)
    expect(ids).toContain('c-deadline')
    expect(ids).toContain('c-low-progress')
    expect(ids).not.toContain('c-ok')
  })
})
