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

/**
 * Contrat d'accès aux données.
 *
 * Toute l'application passe par cette interface pour lire/écrire des
 * données. Les composants ne doivent jamais appeler directement un backend
 * (IndexedDB ou Supabase) : ils passent par le store (voir `src/data/store.tsx`)
 * qui s'appuie lui-même sur une implémentation de `Repository`.
 *
 * Deux implémentations existent :
 * - `createDemoRepository` (mode démonstration, persistance locale IndexedDB)
 * - `createSupabaseRepository` (mode backend, Supabase)
 */
export interface Repository {
  readonly mode: 'demo' | 'backend'

  loadAll(ownerId: string): Promise<RepositorySnapshot>

  createAcademicYear(input: Omit<AcademicYear, 'createdAt' | 'updatedAt'>, periods?: Omit<AcademicPeriod, 'createdAt' | 'updatedAt'>[]): Promise<AcademicYear>
  updateAcademicYear(id: string, patch: Partial<AcademicYear>): Promise<AcademicYear>
  deleteAcademicYear(id: string): Promise<void>

  createAcademicPeriod(input: Omit<AcademicPeriod, 'createdAt' | 'updatedAt'>): Promise<AcademicPeriod>
  updateAcademicPeriod(id: string, patch: Partial<AcademicPeriod>): Promise<AcademicPeriod>
  deleteAcademicPeriod(id: string): Promise<void>

  createCourseCategory(input: Omit<CourseCategory, 'createdAt' | 'updatedAt'>): Promise<CourseCategory>
  updateCourseCategory(id: string, patch: Pick<CourseCategory, 'name' | 'parentId'>): Promise<CourseCategory>
  deleteCourseCategory(id: string): Promise<void>

  createCourse(input: Omit<Course, 'createdAt' | 'updatedAt'>): Promise<Course>
  updateCourse(id: string, patch: Partial<Course>): Promise<Course>
  deleteCourse(id: string): Promise<void>

  createTopic(input: Omit<CourseTopic, 'createdAt' | 'updatedAt'>): Promise<CourseTopic>
  updateTopic(id: string, patch: Partial<CourseTopic>): Promise<CourseTopic>
  deleteTopic(id: string): Promise<void>

  createDocumentCategory(input: Omit<DocumentCategory, 'createdAt' | 'updatedAt'>): Promise<DocumentCategory>
  updateDocumentCategory(id: string, patch: Partial<DocumentCategory>): Promise<DocumentCategory>
  deleteDocumentCategory(id: string): Promise<void>

  createDocument(
    input: Omit<CourseDocument, 'createdAt' | 'updatedAt' | 'storageRef'>,
    file: File,
  ): Promise<CourseDocument>
  updateDocument(id: string, patch: Partial<CourseDocument>): Promise<CourseDocument>
  deleteDocument(id: string): Promise<void>
  getDocumentBlob(storageRef: string): Promise<Blob | null>

  createTask(input: Omit<Task, 'createdAt' | 'updatedAt'>): Promise<Task>
  updateTask(id: string, patch: Partial<Task>): Promise<Task>
  deleteTask(id: string): Promise<void>

  createExam(input: Omit<Exam, 'createdAt' | 'updatedAt'>): Promise<Exam>
  updateExam(id: string, patch: Partial<Exam>): Promise<Exam>
  deleteExam(id: string): Promise<void>

  createStudySession(input: Omit<StudySession, 'createdAt' | 'updatedAt'>): Promise<StudySession>
  updateStudySession(id: string, patch: Partial<StudySession>): Promise<StudySession>
  deleteStudySession(id: string): Promise<void>

  createNote(input: Omit<PersonalNote, 'createdAt' | 'updatedAt'>): Promise<PersonalNote>
  updateNote(id: string, patch: Partial<PersonalNote>): Promise<PersonalNote>
  deleteNote(id: string): Promise<void>

  savePreference(pref: UserPreference): Promise<UserPreference>
}

export interface RepositorySnapshot {
  academicYears: AcademicYear[]
  academicPeriods: AcademicPeriod[]
  courses: Course[]
  courseCategories: CourseCategory[]
  topics: CourseTopic[]
  documentCategories: DocumentCategory[]
  documents: CourseDocument[]
  tasks: Task[]
  exams: Exam[]
  studySessions: StudySession[]
  notes: PersonalNote[]
  preference: UserPreference | null
}

export function emptySnapshot(): RepositorySnapshot {
  return {
    academicYears: [],
    academicPeriods: [],
    courses: [],
    courseCategories: [],
    topics: [],
    documentCategories: [],
    documents: [],
    tasks: [],
    exams: [],
    studySessions: [],
    notes: [],
    preference: null,
  }
}
