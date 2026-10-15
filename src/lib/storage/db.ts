import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  AcademicPeriod,
  AcademicYear,
  Course,
  CourseDocument,
  CourseTopic,
  DocumentCategory,
  Exam,
  PersonalNote,
  StudySession,
  Task,
  UserPreference,
} from '@/types/domain'

const DB_NAME = 'etudes-suivi-demo'
const DB_VERSION = 1

interface AppDBSchema extends DBSchema {
  academicYears: { key: string; value: AcademicYear; indexes: { ownerId: string } }
  academicPeriods: { key: string; value: AcademicPeriod; indexes: { academicYearId: string } }
  courses: { key: string; value: Course; indexes: { ownerId: string } }
  topics: { key: string; value: CourseTopic; indexes: { courseId: string } }
  documentCategories: { key: string; value: DocumentCategory; indexes: { ownerId: string } }
  documents: { key: string; value: CourseDocument; indexes: { courseId: string } }
  tasks: { key: string; value: Task; indexes: { courseId: string } }
  exams: { key: string; value: Exam; indexes: { courseId: string } }
  studySessions: { key: string; value: StudySession; indexes: { courseId: string } }
  notes: { key: string; value: PersonalNote; indexes: { courseId: string } }
  preferences: { key: string; value: UserPreference }
  files: { key: string; value: { id: string; blob: Blob } }
}

let dbPromise: Promise<IDBPDatabase<AppDBSchema>> | null = null

export function getDemoDb(): Promise<IDBPDatabase<AppDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('academicYears', { keyPath: 'id' }).createIndex('ownerId', 'ownerId')
        db.createObjectStore('academicPeriods', { keyPath: 'id' }).createIndex('academicYearId', 'academicYearId')
        db.createObjectStore('courses', { keyPath: 'id' }).createIndex('ownerId', 'ownerId')
        db.createObjectStore('topics', { keyPath: 'id' }).createIndex('courseId', 'courseId')
        db.createObjectStore('documentCategories', { keyPath: 'id' }).createIndex('ownerId', 'ownerId')
        db.createObjectStore('documents', { keyPath: 'id' }).createIndex('courseId', 'courseId')
        db.createObjectStore('tasks', { keyPath: 'id' }).createIndex('courseId', 'courseId')
        db.createObjectStore('exams', { keyPath: 'id' }).createIndex('courseId', 'courseId')
        db.createObjectStore('studySessions', { keyPath: 'id' }).createIndex('courseId', 'courseId')
        db.createObjectStore('notes', { keyPath: 'id' }).createIndex('courseId', 'courseId')
        db.createObjectStore('preferences', { keyPath: 'ownerId' })
        db.createObjectStore('files', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

/** Réinitialise la connexion mise en cache (utile pour les tests). */
export function resetDemoDbConnection(): void {
  dbPromise = null
}

export type { AppDBSchema }
