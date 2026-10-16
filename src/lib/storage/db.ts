import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
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

const DB_NAME = 'etudes-suivi-demo'
const DB_VERSION = 3

interface AppDBSchema extends DBSchema {
  academicYears: { key: string; value: AcademicYear; indexes: { ownerId: string } }
  academicPeriods: { key: string; value: AcademicPeriod; indexes: { academicYearId: string } }
  courses: { key: string; value: Course; indexes: { ownerId: string } }
  courseCategories: { key: string; value: CourseCategory; indexes: { ownerId: string } }
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

/**
 * Vue faiblement typée de la base, utilisée uniquement pour migrer l'ancien
 * magasin générique `courseGroups` (absent du schéma courant `AppDBSchema`).
 */
interface LegacyStore {
  getAll(): Promise<Record<string, unknown>[]>
  put(value: Record<string, unknown>): Promise<unknown>
  createIndex(name: string, keyPath: string | string[]): unknown
}
interface LegacyDatabase {
  createObjectStore(name: string, options?: IDBObjectStoreParameters): LegacyStore
  deleteObjectStore(name: string): void
}
interface LegacyTransaction {
  objectStoreNames: { contains(name: string): boolean }
  objectStore(name: string): LegacyStore
}

let dbPromise: Promise<IDBPDatabase<AppDBSchema>> | null = null

export function getDemoDb(): Promise<IDBPDatabase<AppDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDBSchema>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
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
        }
        const legacyDb = db as unknown as LegacyDatabase
        const legacyTx = tx as unknown as LegacyTransaction
        if (oldVersion >= 1 && oldVersion < 2) {
          legacyDb.createObjectStore('courseGroups', { keyPath: 'id' }).createIndex('ownerId', 'ownerId')
          for (let cursor = await tx.objectStore('exams').openCursor(); cursor; cursor = await cursor.continue()) {
            await cursor.update({ ...cursor.value, result: null })
          }
        }
        if (oldVersion < 3) {
          // Les anciens « groupes » génériques deviennent des catégories
          // typées : un groupe racine devient un domaine, un sous-groupe
          // devient une option rattachée à ce domaine.
          const hadLegacyGroups = legacyTx.objectStoreNames.contains('courseGroups')
          const legacyGroups = hadLegacyGroups ? await legacyTx.objectStore('courseGroups').getAll() : []
          db.createObjectStore('courseCategories', { keyPath: 'id' }).createIndex('ownerId', 'ownerId')
          for (const group of legacyGroups) {
            await tx.objectStore('courseCategories').put({
              ...group,
              kind: group.parentId ? 'option' : 'domaine',
            } as CourseCategory)
          }
          if (hadLegacyGroups) legacyDb.deleteObjectStore('courseGroups')

          for (let cursor = await tx.objectStore('courses').openCursor(); cursor; cursor = await cursor.continue()) {
            const { groupId, ...rest } = cursor.value as unknown as Record<string, unknown>
            await cursor.update({ ...rest, categoryId: (groupId as string | null) ?? null } as Course)
          }
        }
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
