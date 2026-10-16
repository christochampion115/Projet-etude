import { getDemoDb } from '@/lib/storage/db'
import { createId, nowIso } from '@/lib/id'
import type { Repository, RepositorySnapshot } from './types'
import { emptySnapshot } from './types'
import type {
  AcademicPeriod,
  AcademicYear,
  Course,
  CourseCategory,
  CourseDocument,
  CourseTopic,
  DocumentCategory,
  Exam,
  PersonalNote,
  StudySession,
  Task,
  UserPreference,
} from '@/types/domain'

const DEFAULT_CATEGORY_NAMES = [
  'Notes de cours',
  'Synthèses des années précédentes',
  'Supports de cours',
  'Exercices et corrigés',
  'Autres documents',
]

/**
 * Implémentation de démonstration : toutes les données et tous les fichiers
 * sont stockés localement dans IndexedDB (via la bibliothèque `idb`).
 *
 * Ce mode ne protège pas réellement les données (pas de serveur, pas de
 * contrôle d'accès) : il sert uniquement à faire fonctionner le prototype
 * sans configuration backend.
 */
export function createDemoRepository(): Repository {
  async function ensureDefaultCategories(ownerId: string): Promise<DocumentCategory[]> {
    const db = await getDemoDb()
    const existing = await db.getAllFromIndex('documentCategories', 'ownerId', ownerId)
    if (existing.length > 0) return existing

    const created: DocumentCategory[] = []
    for (const name of DEFAULT_CATEGORY_NAMES) {
      const category: DocumentCategory = {
        id: createId(),
        ownerId,
        name,
        isDefault: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      await db.put('documentCategories', category)
      created.push(category)
    }
    return created
  }

  async function ensurePreference(ownerId: string): Promise<UserPreference> {
    const db = await getDemoDb()
    const existing = await db.get('preferences', ownerId)
    if (existing) return existing
    const pref: UserPreference = {
      ownerId,
      theme: 'system',
      focusWorkMinutes: 25,
      focusBreakMinutes: 5,
    }
    await db.put('preferences', pref)
    return pref
  }

  return {
    mode: 'demo',

    async loadAll(ownerId: string): Promise<RepositorySnapshot> {
      const db = await getDemoDb()
      const [academicYears, academicPeriods, courses, topics, documents, tasks, exams, studySessions, notes] =
        await Promise.all([
          db.getAllFromIndex('academicYears', 'ownerId', ownerId),
          db.getAll('academicPeriods'),
          db.getAllFromIndex('courses', 'ownerId', ownerId),
          db.getAll('topics'),
          db.getAll('documents'),
          db.getAll('tasks'),
          db.getAll('exams'),
          db.getAll('studySessions'),
          db.getAll('notes'),
        ])
      const documentCategories = await ensureDefaultCategories(ownerId)
      const preference = await ensurePreference(ownerId)

      const snapshot = emptySnapshot()
      snapshot.academicYears = academicYears
      snapshot.academicPeriods = academicPeriods.filter((p) =>
        academicYears.some((y) => y.id === p.academicYearId),
      )
      snapshot.courses = courses
      snapshot.courseCategories = await db.getAllFromIndex('courseCategories', 'ownerId', ownerId)
      const courseIds = new Set(courses.map((c) => c.id))
      snapshot.topics = topics.filter((t) => courseIds.has(t.courseId))
      snapshot.documentCategories = documentCategories
      snapshot.documents = documents.filter((d) => courseIds.has(d.courseId))
      snapshot.tasks = tasks.filter((t) => courseIds.has(t.courseId))
      snapshot.exams = exams.filter((e) => courseIds.has(e.courseId))
      snapshot.studySessions = studySessions.filter((s) => s.courseId === null || courseIds.has(s.courseId))
      snapshot.notes = notes.filter((n) => n.courseId === null || courseIds.has(n.courseId))
      snapshot.preference = preference
      return snapshot
    },

    async createAcademicYear(input, periods = []) {
      const db = await getDemoDb()
      const entity: AcademicYear = { ...input, createdAt: nowIso(), updatedAt: nowIso() }
      const tx = db.transaction(['academicYears', 'academicPeriods'], 'readwrite')
      await tx.objectStore('academicYears').put(entity)
      for (const period of periods) {
        await tx.objectStore('academicPeriods').put({ ...period, createdAt: nowIso(), updatedAt: nowIso() })
      }
      await tx.done
      return entity
    },
    async updateAcademicYear(id, patch) {
      const db = await getDemoDb()
      const current = await db.get('academicYears', id)
      if (!current) throw new Error('Année académique introuvable')
      const updated = { ...current, ...patch, updatedAt: nowIso() }
      await db.put('academicYears', updated)
      return updated
    },
    async deleteAcademicYear(id) {
      const db = await getDemoDb()
      const tx = db.transaction(['academicYears', 'academicPeriods', 'courseCategories', 'courses'], 'readwrite')
      const courses = await tx.objectStore('courses').getAll()
      if (courses.some((c) => c.academicYearId === id)) throw new Error('Supprimez les cours avant de supprimer cette année.')
      const periods = await tx.objectStore('academicPeriods').index('academicYearId').getAll(id)
      const categories = await tx.objectStore('courseCategories').getAll()
      for (const period of periods) await tx.objectStore('academicPeriods').delete(period.id)
      for (const category of categories.filter((c) => c.academicYearId === id)) await tx.objectStore('courseCategories').delete(category.id)
      await tx.objectStore('academicYears').delete(id)
      await tx.done
    },

    async createAcademicPeriod(input) {
      const db = await getDemoDb()
      const entity: AcademicPeriod = { ...input, createdAt: nowIso(), updatedAt: nowIso() }
      await db.put('academicPeriods', entity)
      return entity
    },
    async updateAcademicPeriod(id, patch) {
      const db = await getDemoDb()
      const current = await db.get('academicPeriods', id)
      if (!current) throw new Error('Période introuvable')
      const updated = { ...current, ...patch, updatedAt: nowIso() }
      await db.put('academicPeriods', updated)
      return updated
    },
    async deleteAcademicPeriod(id) {
      const db = await getDemoDb()
      const tx = db.transaction(['academicPeriods', 'courses'], 'readwrite')
      const courses = await tx.objectStore('courses').getAll()
      for (const course of courses.filter((c) => c.periodIds.includes(id))) {
        await tx.objectStore('courses').put({ ...course, periodIds: course.periodIds.filter((pid) => pid !== id), updatedAt: nowIso() })
      }
      await tx.objectStore('academicPeriods').delete(id)
      await tx.done
    },

    async createCourseCategory(input) {
      const db = await getDemoDb()
      const entity: CourseCategory = { ...input, createdAt: nowIso(), updatedAt: nowIso() }
      await db.put('courseCategories', entity)
      return entity
    },
    async updateCourseCategory(id, patch) {
      const db = await getDemoDb()
      const current = await db.get('courseCategories', id)
      if (!current) throw new Error('Catégorie introuvable')
      const updated = { ...current, ...patch, updatedAt: nowIso() }
      await db.put('courseCategories', updated)
      return updated
    },
    async deleteCourseCategory(id) {
      const db = await getDemoDb()
      const tx = db.transaction(['courseCategories', 'courses'], 'readwrite')
      const categories = await tx.objectStore('courseCategories').getAll()
      const courses = await tx.objectStore('courses').getAll()
      if (categories.some((c) => c.parentId === id) || courses.some((c) => c.categoryId === id)) {
        throw new Error('Déplacez les cours et options avant de supprimer cette catégorie.')
      }
      await tx.objectStore('courseCategories').delete(id)
      await tx.done
    },

    async createCourse(input) {
      const db = await getDemoDb()
      const entity: Course = { ...input, createdAt: nowIso(), updatedAt: nowIso() }
      await db.put('courses', entity)
      return entity
    },
    async updateCourse(id, patch) {
      const db = await getDemoDb()
      const current = await db.get('courses', id)
      if (!current) throw new Error('Cours introuvable')
      const updated = { ...current, ...patch, updatedAt: nowIso() }
      await db.put('courses', updated)
      return updated
    },
    async deleteCourse(id) {
      const db = await getDemoDb()
      const tx = db.transaction(
        ['courses', 'topics', 'documents', 'tasks', 'exams', 'studySessions', 'notes', 'files'],
        'readwrite',
      )
      const [topics, documents, tasks, exams, sessions, notes] = await Promise.all([
        tx.objectStore('topics').index('courseId').getAll(id),
        tx.objectStore('documents').index('courseId').getAll(id),
        tx.objectStore('tasks').index('courseId').getAll(id),
        tx.objectStore('exams').index('courseId').getAll(id),
        tx.objectStore('studySessions').index('courseId').getAll(id),
        tx.objectStore('notes').index('courseId').getAll(id),
      ])
      await Promise.all([
        ...topics.map((t) => tx.objectStore('topics').delete(t.id)),
        ...documents.map((d) => tx.objectStore('documents').delete(d.id)),
        ...documents.map((d) => tx.objectStore('files').delete(d.storageRef)),
        ...tasks.map((t) => tx.objectStore('tasks').delete(t.id)),
        ...exams.map((e) => tx.objectStore('exams').delete(e.id)),
        ...sessions.map((s) => tx.objectStore('studySessions').delete(s.id)),
        ...notes.map((n) => tx.objectStore('notes').delete(n.id)),
        tx.objectStore('courses').delete(id),
      ])
      await tx.done
    },

    async createTopic(input) {
      const db = await getDemoDb()
      const entity: CourseTopic = { ...input, createdAt: nowIso(), updatedAt: nowIso() }
      await db.put('topics', entity)
      return entity
    },
    async updateTopic(id, patch) {
      const db = await getDemoDb()
      const current = await db.get('topics', id)
      if (!current) throw new Error('Chapitre introuvable')
      const updated = { ...current, ...patch, updatedAt: nowIso() }
      await db.put('topics', updated)
      return updated
    },
    async deleteTopic(id) {
      const db = await getDemoDb()
      await db.delete('topics', id)
    },

    async createDocumentCategory(input) {
      const db = await getDemoDb()
      const entity: DocumentCategory = { ...input, createdAt: nowIso(), updatedAt: nowIso() }
      await db.put('documentCategories', entity)
      return entity
    },
    async updateDocumentCategory(id, patch) {
      const db = await getDemoDb()
      const current = await db.get('documentCategories', id)
      if (!current) throw new Error('Catégorie introuvable')
      const updated = { ...current, ...patch, updatedAt: nowIso() }
      await db.put('documentCategories', updated)
      return updated
    },
    async deleteDocumentCategory(id) {
      const db = await getDemoDb()
      await db.delete('documentCategories', id)
    },

    async createDocument(input, file) {
      const db = await getDemoDb()
      const storageRef = createId()
      await db.put('files', { id: storageRef, blob: file })
      const entity: CourseDocument = { ...input, storageRef, createdAt: nowIso(), updatedAt: nowIso() }
      await db.put('documents', entity)
      return entity
    },
    async updateDocument(id, patch) {
      const db = await getDemoDb()
      const current = await db.get('documents', id)
      if (!current) throw new Error('Document introuvable')
      const updated = { ...current, ...patch, updatedAt: nowIso() }
      await db.put('documents', updated)
      return updated
    },
    async deleteDocument(id) {
      const db = await getDemoDb()
      const current = await db.get('documents', id)
      if (current) await db.delete('files', current.storageRef)
      await db.delete('documents', id)
    },
    async getDocumentBlob(storageRef) {
      const db = await getDemoDb()
      const record = await db.get('files', storageRef)
      return record?.blob ?? null
    },

    async createTask(input) {
      const db = await getDemoDb()
      const entity: Task = { ...input, createdAt: nowIso(), updatedAt: nowIso() }
      await db.put('tasks', entity)
      return entity
    },
    async updateTask(id, patch) {
      const db = await getDemoDb()
      const current = await db.get('tasks', id)
      if (!current) throw new Error('Tâche introuvable')
      const updated = { ...current, ...patch, updatedAt: nowIso() }
      await db.put('tasks', updated)
      return updated
    },
    async deleteTask(id) {
      const db = await getDemoDb()
      await db.delete('tasks', id)
    },

    async createExam(input) {
      const db = await getDemoDb()
      const entity: Exam = { ...input, createdAt: nowIso(), updatedAt: nowIso() }
      await db.put('exams', entity)
      return entity
    },
    async updateExam(id, patch) {
      const db = await getDemoDb()
      const current = await db.get('exams', id)
      if (!current) throw new Error('Examen introuvable')
      const updated = { ...current, ...patch, updatedAt: nowIso() }
      await db.put('exams', updated)
      return updated
    },
    async deleteExam(id) {
      const db = await getDemoDb()
      await db.delete('exams', id)
    },

    async createStudySession(input) {
      const db = await getDemoDb()
      const entity: StudySession = { ...input, createdAt: nowIso(), updatedAt: nowIso() }
      await db.put('studySessions', entity)
      return entity
    },
    async updateStudySession(id, patch) {
      const db = await getDemoDb()
      const current = await db.get('studySessions', id)
      if (!current) throw new Error('Séance introuvable')
      const updated = { ...current, ...patch, updatedAt: nowIso() }
      await db.put('studySessions', updated)
      return updated
    },
    async deleteStudySession(id) {
      const db = await getDemoDb()
      await db.delete('studySessions', id)
    },

    async createNote(input) {
      const db = await getDemoDb()
      const entity: PersonalNote = { ...input, createdAt: nowIso(), updatedAt: nowIso() }
      await db.put('notes', entity)
      return entity
    },
    async updateNote(id, patch) {
      const db = await getDemoDb()
      const current = await db.get('notes', id)
      if (!current) throw new Error('Note introuvable')
      const updated = { ...current, ...patch, updatedAt: nowIso() }
      await db.put('notes', updated)
      return updated
    },
    async deleteNote(id) {
      const db = await getDemoDb()
      await db.delete('notes', id)
    },

    async savePreference(pref) {
      const db = await getDemoDb()
      await db.put('preferences', pref)
      return pref
    },
  }
}
