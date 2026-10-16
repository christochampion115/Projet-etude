import { createId, nowIso } from '@/lib/id'
import { hasExamPassed } from '@/lib/selectors'
import { getRepository } from '@/lib/repositories'
import { emptySnapshot, type RepositorySnapshot } from '@/lib/repositories/types'
import type {
  AcademicPeriod,
  AcademicYear,
  Course,
  CourseCategory,
  CourseDocument,
  CourseTopic,
  Exam,
  PersonalNote,
  StudySession,
  Task,
  UserPreference,
} from '@/types/domain'

export type DataStatus = 'idle' | 'loading' | 'ready' | 'error'

type Listener = () => void

/**
 * Store applicatif centralisé.
 *
 * Il charge un instantané des données depuis le `Repository` actif, le garde
 * en mémoire, et expose des actions métier (créer/modifier/supprimer) qui
 * mettent à jour l'état local puis persistent via le repository. Les
 * composants ne lisent/écrivent jamais directement le repository : ils
 * passent par ce store (voir `src/data/DataProvider.tsx`).
 */
export class AppDataStore {
  private snapshot: RepositorySnapshot = emptySnapshot()
  private status: DataStatus = 'idle'
  private error: string | null = null
  private listeners = new Set<Listener>()
  private ownerId: string | null = null

  getSnapshot = (): RepositorySnapshot => this.snapshot
  getStatus = (): DataStatus => this.status
  getError = (): string | null => this.error

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit() {
    this.snapshot = { ...this.snapshot }
    for (const listener of this.listeners) listener()
  }

  async load(ownerId: string): Promise<void> {
    this.ownerId = ownerId
    this.status = 'loading'
    this.error = null
    this.emit()
    try {
      const repo = getRepository()
      this.snapshot = await repo.loadAll(ownerId)
      this.status = 'ready'
    } catch (err) {
      this.status = 'error'
      this.error = err instanceof Error ? err.message : 'Erreur de chargement des données'
    }
    this.emit()
  }

  private requireOwnerId(): string {
    if (!this.ownerId) throw new Error('Store non initialisé')
    return this.ownerId
  }

  /* ---------------------------- Années académiques ---------------------------- */

  async createAcademicYear(input: { label: string; startDate: string | null; endDate: string | null; periodNames?: string[] }) {
    const repo = getRepository()
    const yearId = createId()
    const periods = (input.periodNames ?? []).map((name, order) => ({
      id: createId(), ownerId: this.requireOwnerId(), academicYearId: yearId,
      name: name.trim(), startDate: null, endDate: null, order,
    }))
    if (periods.some((p) => !p.name || p.name.length > 60)) throw new Error('Nom de période invalide')
    if (new Set(periods.map((p) => p.name.toLocaleLowerCase('fr'))).size !== periods.length) {
      throw new Error('Les noms des périodes doivent être distincts.')
    }
    const entity = await repo.createAcademicYear({
      id: yearId,
      ownerId: this.requireOwnerId(),
      label: input.label,
      startDate: input.startDate,
      endDate: input.endDate,
      isActive: this.snapshot.academicYears.length === 0,
      archivedAt: null,
    }, periods)
    this.snapshot.academicYears = [...this.snapshot.academicYears, entity]
    this.snapshot.academicPeriods = [...this.snapshot.academicPeriods, ...periods.map((p) => ({
      ...p, createdAt: entity.createdAt, updatedAt: entity.updatedAt,
    }))]
    this.emit()
    return entity
  }

  async updateAcademicYear(id: string, patch: Partial<AcademicYear>) {
    const repo = getRepository()
    const updated = await repo.updateAcademicYear(id, patch)
    this.snapshot.academicYears = this.snapshot.academicYears.map((y) => (y.id === id ? updated : y))
    this.emit()
    return updated
  }

  async setActiveAcademicYear(id: string) {
    const repo = getRepository()
    const updates = await Promise.all(
      this.snapshot.academicYears.map((year) => repo.updateAcademicYear(year.id, { isActive: year.id === id })),
    )
    this.snapshot.academicYears = updates
    this.emit()
  }

  async archiveAcademicYear(id: string) {
    await this.updateAcademicYear(id, { isActive: false, archivedAt: nowIso() })
  }

  async deleteAcademicYear(id: string) {
    if (this.snapshot.courses.some((c) => c.academicYearId === id)) throw new Error('Supprimez les cours avant de supprimer cette année.')
    const repo = getRepository()
    await repo.deleteAcademicYear(id)
    this.snapshot.academicYears = this.snapshot.academicYears.filter((y) => y.id !== id)
    this.snapshot.academicPeriods = this.snapshot.academicPeriods.filter((p) => p.academicYearId !== id)
    this.snapshot.courseCategories = this.snapshot.courseCategories.filter((c) => c.academicYearId !== id)
    this.emit()
  }

  /* ------------------------------- Périodes ------------------------------- */

  async createAcademicPeriod(input: {
    academicYearId: string
    name: string
    startDate: string | null
    endDate: string | null
  }) {
    const repo = getRepository()
    const order = this.snapshot.academicPeriods.filter((p) => p.academicYearId === input.academicYearId).length
    const entity = await repo.createAcademicPeriod({
      id: createId(),
      ownerId: this.requireOwnerId(),
      academicYearId: input.academicYearId,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      order,
    })
    this.snapshot.academicPeriods = [...this.snapshot.academicPeriods, entity]
    this.emit()
    return entity
  }

  async updateAcademicPeriod(id: string, patch: Partial<AcademicPeriod>) {
    const repo = getRepository()
    const updated = await repo.updateAcademicPeriod(id, patch)
    this.snapshot.academicPeriods = this.snapshot.academicPeriods.map((p) => (p.id === id ? updated : p))
    this.emit()
    return updated
  }

  async deleteAcademicPeriod(id: string) {
    const repo = getRepository()
    await repo.deleteAcademicPeriod(id)
    this.snapshot.academicPeriods = this.snapshot.academicPeriods.filter((p) => p.id !== id)
    this.snapshot.courses = this.snapshot.courses.map((c) =>
      c.periodIds.includes(id) ? { ...c, periodIds: c.periodIds.filter((pid) => pid !== id) } : c,
    )
    this.emit()
  }

  /* -------------------------------- Cours -------------------------------- */

  private validateCoursePlacement(academicYearId: string, periodIds: string[], categoryId: string | null) {
    if (periodIds.some((id) => !this.snapshot.academicPeriods.some((p) => p.id === id && p.academicYearId === academicYearId))) {
      throw new Error("Les périodes doivent appartenir à l'année du cours.")
    }
    if (categoryId && !this.snapshot.courseCategories.some((c) => c.id === categoryId && c.academicYearId === academicYearId)) {
      throw new Error("La catégorie doit appartenir à l'année du cours.")
    }
  }

  async createCourseCategory(input: { academicYearId: string; kind: CourseCategory['kind']; parentId: string | null; name: string }) {
    this.validateCategory(input.academicYearId, input.kind, input.parentId, input.name)
    const entity = await getRepository().createCourseCategory({
      ...input, name: input.name.trim(), id: createId(), ownerId: this.requireOwnerId(),
    })
    this.snapshot.courseCategories = [...this.snapshot.courseCategories, entity]
    this.emit()
    return entity
  }

  private validateCategory(yearId: string, kind: CourseCategory['kind'], parentId: string | null, name: string) {
    if (!name.trim() || name.trim().length > 120) throw new Error('Nom de catégorie invalide')
    if (!this.snapshot.academicYears.some((y) => y.id === yearId)) throw new Error('Année introuvable')
    if (kind === 'option') {
      if (!parentId) throw new Error('Choisissez le domaine auquel rattacher cette option.')
      const domaine = this.snapshot.courseCategories.find((c) => c.id === parentId && c.academicYearId === yearId)
      if (!domaine || domaine.kind !== 'domaine') throw new Error('Le parent doit être un domaine de la même année.')
    } else if (parentId) {
      throw new Error('Seule une option peut être rattachée à un domaine.')
    }
  }

  async updateCourseCategory(id: string, patch: Pick<CourseCategory, 'name' | 'parentId'>) {
    const current = this.snapshot.courseCategories.find((c) => c.id === id)
    if (!current) throw new Error('Catégorie introuvable')
    this.validateCategory(current.academicYearId, current.kind, patch.parentId, patch.name)
    const updated = await getRepository().updateCourseCategory(id, { ...patch, name: patch.name.trim() })
    this.snapshot.courseCategories = this.snapshot.courseCategories.map((c) => c.id === id ? updated : c)
    this.emit()
  }

  async deleteCourseCategory(id: string) {
    const hasOptions = this.snapshot.courseCategories.some((c) => c.parentId === id)
    const hasCourses = this.snapshot.courses.some((c) => c.categoryId === id)
    if (hasOptions || hasCourses) {
      throw new Error('Déplacez les cours et options avant de supprimer cette catégorie.')
    }
    await getRepository().deleteCourseCategory(id)
    this.snapshot.courseCategories = this.snapshot.courseCategories.filter((c) => c.id !== id)
    this.emit()
  }

  async createCourse(input: {
    academicYearId: string
    periodIds: string[]
    categoryId?: string | null
    name: string
    professors: string[]
    description: string | null
    ects: number | null
    examModalities: string | null
  }) {
    this.validateCoursePlacement(input.academicYearId, input.periodIds, input.categoryId ?? null)
    const repo = getRepository()
    const entity = await repo.createCourse({
      id: createId(),
      ownerId: this.requireOwnerId(),
      academicYearId: input.academicYearId,
      periodIds: input.periodIds,
      categoryId: input.categoryId ?? null,
      name: input.name,
      professors: input.professors,
      description: input.description,
      ects: input.ects,
      status: 'active',
      examModalities: input.examModalities,
    })
    this.snapshot.courses = [...this.snapshot.courses, entity]
    this.emit()
    return entity
  }

  async updateCourse(id: string, patch: Partial<Course>) {
    const current = this.snapshot.courses.find((c) => c.id === id)
    if (!current) throw new Error('Cours introuvable')
    const candidate = { ...current, ...patch }
    this.validateCoursePlacement(candidate.academicYearId, candidate.periodIds, candidate.categoryId)
    const repo = getRepository()
    const updated = await repo.updateCourse(id, patch)
    this.snapshot.courses = this.snapshot.courses.map((c) => (c.id === id ? updated : c))
    this.emit()
    return updated
  }

  async deleteCourse(id: string) {
    const repo = getRepository()
    await repo.deleteCourse(id)
    this.snapshot.courses = this.snapshot.courses.filter((c) => c.id !== id)
    this.snapshot.topics = this.snapshot.topics.filter((t) => t.courseId !== id)
    this.snapshot.documents = this.snapshot.documents.filter((d) => d.courseId !== id)
    this.snapshot.tasks = this.snapshot.tasks.filter((t) => t.courseId !== id)
    this.snapshot.exams = this.snapshot.exams.filter((e) => e.courseId !== id)
    this.snapshot.studySessions = this.snapshot.studySessions.filter((s) => s.courseId !== id)
    this.snapshot.notes = this.snapshot.notes.filter((n) => n.courseId !== id)
    this.emit()
  }

  /* ------------------------------- Chapitres ------------------------------- */

  async createTopic(input: { courseId: string; title: string; description: string | null }) {
    const repo = getRepository()
    const order = this.snapshot.topics.filter((t) => t.courseId === input.courseId).length
    const entity = await repo.createTopic({
      id: createId(),
      courseId: input.courseId,
      title: input.title,
      description: input.description,
      status: 'pending',
      order,
      completedAt: null,
    })
    this.snapshot.topics = [...this.snapshot.topics, entity]
    this.emit()
    return entity
  }

  async updateTopic(id: string, patch: Partial<CourseTopic>) {
    const repo = getRepository()
    const updated = await repo.updateTopic(id, patch)
    this.snapshot.topics = this.snapshot.topics.map((t) => (t.id === id ? updated : t))
    this.emit()
    return updated
  }

  async setTopicStatus(id: string, status: CourseTopic['status']) {
    return this.updateTopic(id, { status, completedAt: status === 'done' ? nowIso() : null })
  }

  async deleteTopic(id: string) {
    const repo = getRepository()
    await repo.deleteTopic(id)
    this.snapshot.topics = this.snapshot.topics.filter((t) => t.id !== id)
    this.emit()
  }

  /* --------------------------- Catégories de documents --------------------------- */

  async createDocumentCategory(name: string) {
    const repo = getRepository()
    const entity = await repo.createDocumentCategory({
      id: createId(),
      ownerId: this.requireOwnerId(),
      name,
      isDefault: false,
    })
    this.snapshot.documentCategories = [...this.snapshot.documentCategories, entity]
    this.emit()
    return entity
  }

  async renameDocumentCategory(id: string, name: string) {
    const repo = getRepository()
    const updated = await repo.updateDocumentCategory(id, { name })
    this.snapshot.documentCategories = this.snapshot.documentCategories.map((c) => (c.id === id ? updated : c))
    this.emit()
    return updated
  }

  async deleteDocumentCategory(id: string) {
    const repo = getRepository()
    await repo.deleteDocumentCategory(id)
    this.snapshot.documentCategories = this.snapshot.documentCategories.filter((c) => c.id !== id)
    this.emit()
  }

  /* ------------------------------- Documents ------------------------------- */

  async createDocument(
    input: { courseId: string; categoryId: string; displayName: string },
    file: File,
  ) {
    const repo = getRepository()
    const entity = await repo.createDocument(
      {
        id: createId(),
        ownerId: this.requireOwnerId(),
        courseId: input.courseId,
        categoryId: input.categoryId,
        displayName: input.displayName,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      },
      file,
    )
    this.snapshot.documents = [...this.snapshot.documents, entity]
    this.emit()
    return entity
  }

  async updateDocument(id: string, patch: Partial<CourseDocument>) {
    const repo = getRepository()
    const updated = await repo.updateDocument(id, patch)
    this.snapshot.documents = this.snapshot.documents.map((d) => (d.id === id ? updated : d))
    this.emit()
    return updated
  }

  async deleteDocument(id: string) {
    const repo = getRepository()
    await repo.deleteDocument(id)
    this.snapshot.documents = this.snapshot.documents.filter((d) => d.id !== id)
    this.emit()
  }

  async getDocumentBlob(storageRef: string) {
    const repo = getRepository()
    return repo.getDocumentBlob(storageRef)
  }

  /* -------------------------------- Tâches -------------------------------- */

  async createTask(input: {
    courseId: string
    title: string
    description: string | null
    type: Task['type']
    dueDate: string | null
    priority: Task['priority']
  }) {
    const repo = getRepository()
    const entity = await repo.createTask({
      id: createId(),
      ownerId: this.requireOwnerId(),
      courseId: input.courseId,
      title: input.title,
      description: input.description,
      type: input.type,
      dueDate: input.dueDate,
      priority: input.priority,
      status: 'todo',
      completedAt: null,
    })
    this.snapshot.tasks = [...this.snapshot.tasks, entity]
    this.emit()
    return entity
  }

  async updateTask(id: string, patch: Partial<Task>) {
    const repo = getRepository()
    const updated = await repo.updateTask(id, patch)
    this.snapshot.tasks = this.snapshot.tasks.map((t) => (t.id === id ? updated : t))
    this.emit()
    return updated
  }

  async setTaskStatus(id: string, status: Task['status']) {
    return this.updateTask(id, { status, completedAt: status === 'done' ? nowIso() : null })
  }

  async deleteTask(id: string) {
    const repo = getRepository()
    await repo.deleteTask(id)
    this.snapshot.tasks = this.snapshot.tasks.filter((t) => t.id !== id)
    this.emit()
  }

  /* -------------------------------- Examens -------------------------------- */

  async createExam(input: {
    courseId: string
    title: string
    date: string | null
    type: Exam['type']
    modalities: string | null
  }) {
    const repo = getRepository()
    const entity = await repo.createExam({
      id: createId(),
      ownerId: this.requireOwnerId(),
      courseId: input.courseId,
      title: input.title,
      date: input.date,
      type: input.type,
      modalities: input.modalities,
      preparationStatus: 'not_started',
      result: null,
    })
    this.snapshot.exams = [...this.snapshot.exams, entity]
    this.emit()
    return entity
  }

  async updateExam(id: string, patch: Partial<Exam>) {
    const current = this.snapshot.exams.find((e) => e.id === id)
    if (!current) throw new Error('Examen introuvable')
    const date = patch.date === undefined ? current.date : patch.date
    if (patch.result != null && !hasExamPassed(date)) {
      throw new Error("Le résultat ne peut être renseigné qu'après la date de l'examen.")
    }
    if (!hasExamPassed(date)) patch = { ...patch, result: null }
    const repo = getRepository()
    const updated = await repo.updateExam(id, patch)
    this.snapshot.exams = this.snapshot.exams.map((e) => (e.id === id ? updated : e))
    this.emit()
    return updated
  }

  async deleteExam(id: string) {
    const repo = getRepository()
    await repo.deleteExam(id)
    this.snapshot.exams = this.snapshot.exams.filter((e) => e.id !== id)
    this.emit()
  }

  /* ----------------------------- Séances d'étude ----------------------------- */

  async createStudySession(input: {
    courseId: string | null
    date: string
    startTime: string
    durationMinutes: number
    source: StudySession['source']
    notes: string | null
  }) {
    const repo = getRepository()
    const entity = await repo.createStudySession({
      id: createId(),
      ownerId: this.requireOwnerId(),
      courseId: input.courseId,
      date: input.date,
      startTime: input.startTime,
      durationMinutes: input.durationMinutes,
      source: input.source,
      notes: input.notes,
    })
    this.snapshot.studySessions = [...this.snapshot.studySessions, entity]
    this.emit()
    return entity
  }

  async updateStudySession(id: string, patch: Partial<StudySession>) {
    const repo = getRepository()
    const updated = await repo.updateStudySession(id, patch)
    this.snapshot.studySessions = this.snapshot.studySessions.map((s) => (s.id === id ? updated : s))
    this.emit()
    return updated
  }

  async deleteStudySession(id: string) {
    const repo = getRepository()
    await repo.deleteStudySession(id)
    this.snapshot.studySessions = this.snapshot.studySessions.filter((s) => s.id !== id)
    this.emit()
  }

  /* -------------------------------- Notes -------------------------------- */

  async createNote(input: { courseId: string | null; title: string; content: string }) {
    const repo = getRepository()
    const entity = await repo.createNote({
      id: createId(),
      ownerId: this.requireOwnerId(),
      courseId: input.courseId,
      title: input.title,
      content: input.content,
    })
    this.snapshot.notes = [...this.snapshot.notes, entity]
    this.emit()
    return entity
  }

  async updateNote(id: string, patch: Partial<PersonalNote>) {
    const repo = getRepository()
    const updated = await repo.updateNote(id, patch)
    this.snapshot.notes = this.snapshot.notes.map((n) => (n.id === id ? updated : n))
    this.emit()
    return updated
  }

  async deleteNote(id: string) {
    const repo = getRepository()
    await repo.deleteNote(id)
    this.snapshot.notes = this.snapshot.notes.filter((n) => n.id !== id)
    this.emit()
  }

  /* ----------------------------- Préférences ----------------------------- */

  async savePreference(patch: Partial<UserPreference>) {
    const repo = getRepository()
    const current: UserPreference = this.snapshot.preference ?? {
      ownerId: this.requireOwnerId(),
      theme: 'system',
      focusWorkMinutes: 25,
      focusBreakMinutes: 5,
    }
    const updated = await repo.savePreference({ ...current, ...patch })
    this.snapshot.preference = updated
    this.emit()
    return updated
  }
}
