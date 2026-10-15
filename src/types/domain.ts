/**
 * Modèle de données du domaine métier.
 *
 * Ces types sont indépendants du mode de persistance (démo locale ou
 * Supabase) : ils représentent la forme des données telle que manipulée par
 * l'application, pas le schéma physique d'un backend en particulier.
 */

export type ID = string

export interface OwnedEntity {
  ownerId: ID
}

export interface Timestamped {
  createdAt: string
  updatedAt: string
}

export type CourseStatus = 'active' | 'completed' | 'archived'

export const COURSE_STATUSES: { value: CourseStatus; label: string }[] = [
  { value: 'active', label: 'Actif' },
  { value: 'completed', label: 'Terminé' },
  { value: 'archived', label: 'Archivé' },
]

export type TaskType = 'assignment' | 'reading' | 'revision' | 'project' | 'other'

export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'assignment', label: 'Devoir' },
  { value: 'reading', label: 'Lecture' },
  { value: 'revision', label: 'Révision' },
  { value: 'project', label: 'Travail' },
  { value: 'other', label: 'Autre' },
]

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Terminé' },
]

export type TaskPriority = 'low' | 'medium' | 'high'

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
]

export type ExamType = 'written' | 'oral' | 'practical' | 'project' | 'other'

export const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: 'written', label: 'Écrit' },
  { value: 'oral', label: 'Oral' },
  { value: 'practical', label: 'Pratique' },
  { value: 'project', label: 'Projet' },
  { value: 'other', label: 'Autre' },
]

export type ExamPreparationStatus = 'not_started' | 'in_progress' | 'ready'

export const EXAM_PREPARATION_STATUSES: { value: ExamPreparationStatus; label: string }[] = [
  { value: 'not_started', label: 'Pas commencée' },
  { value: 'in_progress', label: 'En préparation' },
  { value: 'ready', label: 'Prêt·e' },
]

export type TopicStatus = 'pending' | 'in_progress' | 'done'

export const TOPIC_STATUSES: { value: TopicStatus; label: string }[] = [
  { value: 'pending', label: 'À étudier' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Terminé' },
]

export interface AcademicYear extends Timestamped, OwnedEntity {
  id: ID
  label: string
  startDate: string | null
  endDate: string | null
  isActive: boolean
  archivedAt: string | null
}

export interface AcademicPeriod extends Timestamped, OwnedEntity {
  id: ID
  academicYearId: ID
  name: string
  startDate: string | null
  endDate: string | null
  order: number
}

export interface Course extends Timestamped, OwnedEntity {
  id: ID
  academicYearId: ID
  periodIds: ID[]
  name: string
  professors: string[]
  description: string | null
  ects: number | null
  status: CourseStatus
  examModalities: string | null
}

export interface CourseTopic extends Timestamped {
  id: ID
  courseId: ID
  title: string
  description: string | null
  status: TopicStatus
  order: number
  completedAt: string | null
}

export interface DocumentCategory extends Timestamped, OwnedEntity {
  id: ID
  name: string
  isDefault: boolean
}

export interface CourseDocument extends Timestamped, OwnedEntity {
  id: ID
  courseId: ID
  categoryId: ID
  displayName: string
  fileName: string
  mimeType: string
  size: number
  /** Clé de stockage interne (fichier IndexedDB en démo, chemin Supabase Storage en backend). */
  storageRef: string
}

export interface Task extends Timestamped, OwnedEntity {
  id: ID
  courseId: ID
  title: string
  description: string | null
  type: TaskType
  dueDate: string | null
  priority: TaskPriority
  status: TaskStatus
  completedAt: string | null
}

export interface Exam extends Timestamped, OwnedEntity {
  id: ID
  courseId: ID
  title: string
  date: string | null
  type: ExamType
  modalities: string | null
  preparationStatus: ExamPreparationStatus
}

export type StudySessionSource = 'timer' | 'manual'

export interface StudySession extends Timestamped, OwnedEntity {
  id: ID
  courseId: ID | null
  date: string
  startTime: string
  durationMinutes: number
  source: StudySessionSource
  notes: string | null
}

export interface PersonalNote extends Timestamped, OwnedEntity {
  id: ID
  courseId: ID | null
  title: string
  content: string
}

export interface UserPreference {
  ownerId: ID
  theme: 'light' | 'dark' | 'system'
  focusWorkMinutes: number
  focusBreakMinutes: number
}

export interface AppUser {
  id: ID
  email: string | null
  displayName: string | null
  isDemo: boolean
}
