import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repository, RepositorySnapshot } from '@/lib/repositories/types'
import { emptySnapshot } from '@/lib/repositories/types'

/**
 * Repository en mémoire utilisé uniquement pour tester la logique du store
 * applicatif indépendamment de la persistance réelle (IndexedDB/Supabase).
 */
function createFakeRepository(): Repository {
  const snapshot: RepositorySnapshot = emptySnapshot()
  const stamp = () => new Date().toISOString()

  return {
    mode: 'demo',
    async loadAll() {
      return structuredClone(snapshot)
    },
    async createAcademicYear(input, periods = []) {
      const entity = { ...input, createdAt: stamp(), updatedAt: stamp() }
      snapshot.academicYears.push(entity)
      snapshot.academicPeriods.push(...periods.map((p) => ({ ...p, createdAt: stamp(), updatedAt: stamp() })))
      return entity
    },
    async updateAcademicYear(id, patch) {
      const entity = snapshot.academicYears.find((y) => y.id === id)!
      Object.assign(entity, patch, { updatedAt: stamp() })
      return entity
    },
    async deleteAcademicYear(id) {
      snapshot.academicYears = snapshot.academicYears.filter((y) => y.id !== id)
    },
    async createAcademicPeriod(input) {
      const entity = { ...input, createdAt: stamp(), updatedAt: stamp() }
      snapshot.academicPeriods.push(entity)
      return entity
    },
    async updateAcademicPeriod(id, patch) {
      const entity = snapshot.academicPeriods.find((p) => p.id === id)!
      Object.assign(entity, patch, { updatedAt: stamp() })
      return entity
    },
    async deleteAcademicPeriod(id) {
      snapshot.academicPeriods = snapshot.academicPeriods.filter((p) => p.id !== id)
    },
    async createCourseCategory(input) {
      const entity = { ...input, createdAt: stamp(), updatedAt: stamp() }
      snapshot.courseCategories.push(entity)
      return entity
    },
    async updateCourseCategory(id, patch) {
      const entity = snapshot.courseCategories.find((c) => c.id === id)!
      Object.assign(entity, patch, { updatedAt: stamp() })
      return entity
    },
    async deleteCourseCategory(id) {
      snapshot.courseCategories = snapshot.courseCategories.filter((c) => c.id !== id)
    },
    async createCourse(input) {
      const entity = { ...input, createdAt: stamp(), updatedAt: stamp() }
      snapshot.courses.push(entity)
      return entity
    },
    async updateCourse(id, patch) {
      const entity = snapshot.courses.find((c) => c.id === id)!
      Object.assign(entity, patch, { updatedAt: stamp() })
      return entity
    },
    async deleteCourse(id) {
      snapshot.courses = snapshot.courses.filter((c) => c.id !== id)
      snapshot.tasks = snapshot.tasks.filter((t) => t.courseId !== id)
      snapshot.topics = snapshot.topics.filter((t) => t.courseId !== id)
    },
    async createTopic(input) {
      const entity = { ...input, createdAt: stamp(), updatedAt: stamp() }
      snapshot.topics.push(entity)
      return entity
    },
    async updateTopic(id, patch) {
      const entity = snapshot.topics.find((t) => t.id === id)!
      Object.assign(entity, patch, { updatedAt: stamp() })
      return entity
    },
    async deleteTopic(id) {
      snapshot.topics = snapshot.topics.filter((t) => t.id !== id)
    },
    async createDocumentCategory(input) {
      const entity = { ...input, createdAt: stamp(), updatedAt: stamp() }
      snapshot.documentCategories.push(entity)
      return entity
    },
    async updateDocumentCategory(id, patch) {
      const entity = snapshot.documentCategories.find((c) => c.id === id)!
      Object.assign(entity, patch, { updatedAt: stamp() })
      return entity
    },
    async deleteDocumentCategory(id) {
      snapshot.documentCategories = snapshot.documentCategories.filter((c) => c.id !== id)
    },
    async createDocument(input) {
      const entity = { ...input, storageRef: 'fake-ref', createdAt: stamp(), updatedAt: stamp() }
      snapshot.documents.push(entity)
      return entity
    },
    async updateDocument(id, patch) {
      const entity = snapshot.documents.find((d) => d.id === id)!
      Object.assign(entity, patch, { updatedAt: stamp() })
      return entity
    },
    async deleteDocument(id) {
      snapshot.documents = snapshot.documents.filter((d) => d.id !== id)
    },
    async getDocumentBlob() {
      return null
    },
    async createTask(input) {
      const entity = { ...input, createdAt: stamp(), updatedAt: stamp() }
      snapshot.tasks.push(entity)
      return entity
    },
    async updateTask(id, patch) {
      const entity = snapshot.tasks.find((t) => t.id === id)!
      Object.assign(entity, patch, { updatedAt: stamp() })
      return entity
    },
    async deleteTask(id) {
      snapshot.tasks = snapshot.tasks.filter((t) => t.id !== id)
    },
    async createExam(input) {
      const entity = { ...input, createdAt: stamp(), updatedAt: stamp() }
      snapshot.exams.push(entity)
      return entity
    },
    async updateExam(id, patch) {
      const entity = snapshot.exams.find((e) => e.id === id)!
      Object.assign(entity, patch, { updatedAt: stamp() })
      return entity
    },
    async deleteExam(id) {
      snapshot.exams = snapshot.exams.filter((e) => e.id !== id)
    },
    async createStudySession(input) {
      const entity = { ...input, createdAt: stamp(), updatedAt: stamp() }
      snapshot.studySessions.push(entity)
      return entity
    },
    async updateStudySession(id, patch) {
      const entity = snapshot.studySessions.find((s) => s.id === id)!
      Object.assign(entity, patch, { updatedAt: stamp() })
      return entity
    },
    async deleteStudySession(id) {
      snapshot.studySessions = snapshot.studySessions.filter((s) => s.id !== id)
    },
    async createNote(input) {
      const entity = { ...input, createdAt: stamp(), updatedAt: stamp() }
      snapshot.notes.push(entity)
      return entity
    },
    async updateNote(id, patch) {
      const entity = snapshot.notes.find((n) => n.id === id)!
      Object.assign(entity, patch, { updatedAt: stamp() })
      return entity
    },
    async deleteNote(id) {
      snapshot.notes = snapshot.notes.filter((n) => n.id !== id)
    },
    async savePreference(pref) {
      snapshot.preference = pref
      return pref
    },
  }
}

vi.mock('@/lib/repositories', () => {
  return { getRepository: vi.fn() }
})

const { AppDataStore } = await import('./store')
const { getRepository } = await import('@/lib/repositories')

describe('AppDataStore', () => {
  let store: InstanceType<typeof AppDataStore>

  beforeEach(async () => {
    vi.mocked(getRepository).mockReturnValue(createFakeRepository())
    store = new AppDataStore()
    await store.load('owner-1')
  })

  it('crée une année et ses périodes nommées puis les recharge', async () => {
    const year = await store.createAcademicYear({ label: '2026', startDate: null, endDate: null, periodNames: ['Q1', 'Q2', 'TA'] })
    expect(store.getSnapshot().academicPeriods.map((p) => p.name)).toEqual(['Q1', 'Q2', 'TA'])
    await store.load('owner-1')
    expect(store.getSnapshot().academicPeriods.every((p) => p.academicYearId === year.id)).toBe(true)
    await expect(store.createAcademicYear({ label: '2027', startDate: null, endDate: null, periodNames: ['Q1', ' q1 '] })).rejects.toThrow('distincts')
    expect(store.getSnapshot().academicYears).toHaveLength(1)
  })

  it('catégorise un cours en tronc commun, domaine, option ou autre catégorie, et refuse les rattachements invalides', async () => {
    const year = await store.createAcademicYear({ label: '2026', startDate: null, endDate: null, periodNames: ['Q1', 'Q2', 'TA'] })
    const domaine = await store.createCourseCategory({ academicYearId: year.id, kind: 'domaine', parentId: null, name: 'Sciences' })
    const option = await store.createCourseCategory({ academicYearId: year.id, kind: 'option', parentId: domaine.id, name: 'Informatique' })
    const autre = await store.createCourseCategory({ academicYearId: year.id, kind: 'autre', parentId: null, name: 'Alternance' })
    const periodIds = store.getSnapshot().academicPeriods.map((p) => p.id)

    // Une option doit obligatoirement être rattachée à un domaine.
    await expect(store.createCourseCategory({ academicYearId: year.id, kind: 'option', parentId: null, name: 'Orpheline' })).rejects.toThrow('domaine')
    // Le parent d'une option doit être un domaine, pas une autre option ou une autre catégorie.
    await expect(store.createCourseCategory({ academicYearId: year.id, kind: 'option', parentId: option.id, name: 'Sous-option' })).rejects.toThrow('domaine')
    // Un domaine ou une autre catégorie ne peut pas avoir de parent.
    await expect(store.createCourseCategory({ academicYearId: year.id, kind: 'domaine', parentId: domaine.id, name: 'Autre domaine' })).rejects.toThrow('Seule une option')
    await expect(store.createCourseCategory({ academicYearId: year.id, kind: 'autre', parentId: domaine.id, name: 'Autre catégorie' })).rejects.toThrow('Seule une option')

    // Tronc commun par défaut (aucune catégorie).
    const course = await store.createCourse({
      academicYearId: year.id, periodIds, categoryId: null,
      name: 'Maths', professors: [], description: null, ects: null, examModalities: null,
    })
    expect(store.getSnapshot().courses[0].categoryId).toBeNull()

    // Le cours peut être rattaché directement à un domaine...
    await store.updateCourse(course.id, { categoryId: domaine.id })
    expect(store.getSnapshot().courses[0].categoryId).toBe(domaine.id)
    // ... ou à une option de ce domaine...
    await store.updateCourse(course.id, { categoryId: option.id })
    expect(store.getSnapshot().courses[0].categoryId).toBe(option.id)
    // ... ou à une autre catégorie nommée.
    await store.updateCourse(course.id, { categoryId: autre.id })
    expect(store.getSnapshot().courses[0].categoryId).toBe(autre.id)
    expect(store.getSnapshot().courses[0].periodIds).toEqual(periodIds)

    // Une catégorie occupée (par un cours ou par une option) ne peut pas être supprimée.
    await store.updateCourse(course.id, { categoryId: option.id })
    await expect(store.deleteCourseCategory(option.id)).rejects.toThrow('Déplacez')
    await expect(store.deleteCourseCategory(domaine.id)).rejects.toThrow('Déplacez')

    const other = await store.createAcademicYear({ label: '2027', startDate: null, endDate: null, periodNames: ['Q1'] })
    await expect(store.updateCourse(course.id, { academicYearId: other.id })).rejects.toThrow('périodes')
    await expect(store.updateCourse(course.id, { academicYearId: other.id, periodIds: [] })).rejects.toThrow('catégorie')

    await store.updateCourse(course.id, { categoryId: null })
    await store.deleteCourseCategory(option.id)
    await store.deleteCourseCategory(domaine.id)
    await store.deleteCourseCategory(autre.id)
    expect(store.getSnapshot().courseCategories).toHaveLength(0)
  })

  it("autorise les résultats après l'examen et les réinitialise si l'examen est reporté", async () => {
    const exam = await store.createExam({ courseId: 'course', title: 'Examen', date: '2000-01-01', type: 'written', modalities: null })
    for (const result of ['passed', 'failed', 'pending'] as const) {
      await store.updateExam(exam.id, { result })
      expect(store.getSnapshot().exams[0].result).toBe(result)
    }
    await store.updateExam(exam.id, { date: '2999-01-01' })
    expect(store.getSnapshot().exams[0].result).toBeNull()
    await expect(store.updateExam(exam.id, { result: 'passed' })).rejects.toThrow("après la date")
    await store.updateExam(exam.id, { date: null })
    await expect(store.updateExam(exam.id, { result: 'pending' })).rejects.toThrow("après la date")
  })

  it('crée un cours et le reflète immédiatement dans l\'instantané', async () => {
    const course = await store.createCourse({
      academicYearId: 'year-1',
      periodIds: [],
      name: 'Algorithmique',
      professors: [],
      description: null,
      ects: null,
      examModalities: null,
    })
    expect(store.getSnapshot().courses).toHaveLength(1)
    expect(store.getSnapshot().courses[0].id).toBe(course.id)
  })

  it('notifie les abonnés à chaque mutation', async () => {
    const listener = vi.fn()
    store.subscribe(listener)
    await store.createCourse({
      academicYearId: 'year-1',
      periodIds: [],
      name: 'Physique',
      professors: [],
      description: null,
      ects: null,
      examModalities: null,
    })
    expect(listener).toHaveBeenCalled()
  })

  it('marquer une tâche terminée met à jour son statut et sa date de complétion de façon cohérente', async () => {
    const course = await store.createCourse({
      academicYearId: 'year-1',
      periodIds: [],
      name: 'Chimie',
      professors: [],
      description: null,
      ects: null,
      examModalities: null,
    })
    const task = await store.createTask({
      courseId: course.id,
      title: 'Lire le chapitre 3',
      description: null,
      type: 'reading',
      dueDate: null,
      priority: 'low',
    })
    expect(store.getSnapshot().tasks[0].status).toBe('todo')

    await store.setTaskStatus(task.id, 'done')
    const updated = store.getSnapshot().tasks.find((t) => t.id === task.id)
    expect(updated?.status).toBe('done')
    expect(updated?.completedAt).not.toBeNull()

    await store.setTaskStatus(task.id, 'todo')
    const reverted = store.getSnapshot().tasks.find((t) => t.id === task.id)
    expect(reverted?.status).toBe('todo')
    expect(reverted?.completedAt).toBeNull()
  })

  it('supprimer un cours supprime aussi ses tâches et chapitres associés', async () => {
    const course = await store.createCourse({
      academicYearId: 'year-1',
      periodIds: [],
      name: 'Histoire',
      professors: [],
      description: null,
      ects: null,
      examModalities: null,
    })
    await store.createTopic({ courseId: course.id, title: 'Chapitre 1', description: null })
    await store.createTask({
      courseId: course.id,
      title: 'Devoir',
      description: null,
      type: 'assignment',
      dueDate: null,
      priority: 'medium',
    })

    await store.deleteCourse(course.id)

    expect(store.getSnapshot().courses).toHaveLength(0)
    expect(store.getSnapshot().topics).toHaveLength(0)
    expect(store.getSnapshot().tasks).toHaveLength(0)
  })
})
