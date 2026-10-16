import type { SupabaseClient } from '@supabase/supabase-js'
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

const DOCUMENTS_BUCKET = 'course-documents'

/* ------------------------------------------------------------------ */
/* Mappers ligne SQL (snake_case) <-> entité du domaine (camelCase)     */
/* ------------------------------------------------------------------ */

function mapYear(row: Record<string, unknown>): AcademicYear {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    label: row.label as string,
    startDate: (row.start_date as string | null) ?? null,
    endDate: (row.end_date as string | null) ?? null,
    isActive: Boolean(row.is_active),
    archivedAt: (row.archived_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapPeriod(row: Record<string, unknown>): AcademicPeriod {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    academicYearId: row.academic_year_id as string,
    name: row.name as string,
    startDate: (row.start_date as string | null) ?? null,
    endDate: (row.end_date as string | null) ?? null,
    order: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapCourse(row: Record<string, unknown>): Course {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    academicYearId: row.academic_year_id as string,
    periodIds: (row.period_ids as string[]) ?? [],
    categoryId: (row.category_id as string | null) ?? null,
    name: row.name as string,
    professors: (row.professors as string[]) ?? [],
    description: (row.description as string | null) ?? null,
    ects: (row.ects as number | null) ?? null,
    status: row.status as Course['status'],
    examModalities: (row.exam_modalities as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapCourseCategory(row: Record<string, unknown>): CourseCategory {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    academicYearId: row.academic_year_id as string,
    kind: row.kind as CourseCategory['kind'],
    parentId: (row.parent_id as string | null) ?? null,
    name: row.name as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapTopic(row: Record<string, unknown>): CourseTopic {
  return {
    id: row.id as string,
    courseId: row.course_id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: row.status as CourseTopic['status'],
    order: (row.sort_order as number) ?? 0,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapCategory(row: Record<string, unknown>): DocumentCategory {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    name: row.name as string,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapDocument(row: Record<string, unknown>): CourseDocument {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    courseId: row.course_id as string,
    categoryId: row.category_id as string,
    displayName: row.display_name as string,
    fileName: row.file_name as string,
    mimeType: row.mime_type as string,
    size: row.size_bytes as number,
    storageRef: row.storage_path as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    courseId: row.course_id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    type: row.type as Task['type'],
    dueDate: (row.due_date as string | null) ?? null,
    priority: row.priority as Task['priority'],
    status: row.status as Task['status'],
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapExam(row: Record<string, unknown>): Exam {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    courseId: row.course_id as string,
    title: row.title as string,
    date: (row.exam_date as string | null)?.slice(0, 10) ?? null,
    type: row.type as Exam['type'],
    modalities: (row.modalities as string | null) ?? null,
    preparationStatus: row.preparation_status as Exam['preparationStatus'],
    result: (row.result as Exam['result']) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapSession(row: Record<string, unknown>): StudySession {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    courseId: (row.course_id as string | null) ?? null,
    date: row.session_date as string,
    startTime: row.start_time as string,
    durationMinutes: row.duration_minutes as number,
    source: row.source as StudySession['source'],
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapNote(row: Record<string, unknown>): PersonalNote {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    courseId: (row.course_id as string | null) ?? null,
    title: row.title as string,
    content: row.content as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapPreference(row: Record<string, unknown>): UserPreference {
  return {
    ownerId: row.owner_id as string,
    theme: row.theme as UserPreference['theme'],
    focusWorkMinutes: row.focus_work_minutes as number,
    focusBreakMinutes: row.focus_break_minutes as number,
  }
}

function unwrapRow(result: { data: unknown; error: { message: string } | null }): Record<string, unknown> {
  if (result.error) throw new Error(result.error.message)
  if (result.data === null || typeof result.data !== 'object') throw new Error('Aucune donnée retournée par Supabase')
  return result.data as Record<string, unknown>
}

function unwrapRows(result: { data: unknown; error: { message: string } | null }): Record<string, unknown>[] {
  if (result.error) throw new Error(result.error.message)
  if (!Array.isArray(result.data)) throw new Error('Aucune donnée retournée par Supabase')
  return result.data as Record<string, unknown>[]
}

/**
 * Implémentation Supabase du contrat `Repository`.
 *
 * Nécessite les migrations SQL fournies dans `supabase/migrations` et les
 * politiques Row Level Security associées : la sécurité d'accès entre
 * utilisateurs repose entièrement sur ces politiques, pas sur ce code
 * frontend.
 */
export function createSupabaseRepository(client: SupabaseClient): Repository {
  return {
    mode: 'backend',

    async loadAll(ownerId: string): Promise<RepositorySnapshot> {
      const [years, periods, courses, topics, categories, documents, tasks, exams, sessions, notes, preference] =
        await Promise.all([
          client.from('academic_years').select('*').eq('owner_id', ownerId),
          client.from('academic_periods').select('*').eq('owner_id', ownerId),
          client.from('courses').select('*').eq('owner_id', ownerId),
          client.from('course_topics').select('*, courses!inner(owner_id)').eq('courses.owner_id', ownerId),
          client.from('document_categories').select('*').eq('owner_id', ownerId),
          client.from('documents').select('*').eq('owner_id', ownerId),
          client.from('tasks').select('*').eq('owner_id', ownerId),
          client.from('exams').select('*').eq('owner_id', ownerId),
          client.from('study_sessions').select('*').eq('owner_id', ownerId),
          client.from('personal_notes').select('*').eq('owner_id', ownerId),
          client.from('user_preferences').select('*').eq('owner_id', ownerId).maybeSingle(),
        ])

      const snapshot = emptySnapshot()
      snapshot.courseCategories = unwrapRows(await client.from('course_categories').select('*').eq('owner_id', ownerId)).map(mapCourseCategory)
      snapshot.academicYears = unwrapRows(years).map(mapYear)
      snapshot.academicPeriods = unwrapRows(periods).map(mapPeriod)
      snapshot.courses = unwrapRows(courses).map(mapCourse)
      snapshot.topics = unwrapRows(topics).map(mapTopic)
      snapshot.documentCategories = unwrapRows(categories).map(mapCategory)
      snapshot.documents = unwrapRows(documents).map(mapDocument)
      snapshot.tasks = unwrapRows(tasks).map(mapTask)
      snapshot.exams = unwrapRows(exams).map(mapExam)
      snapshot.studySessions = unwrapRows(sessions).map(mapSession)
      snapshot.notes = unwrapRows(notes).map(mapNote)
      if (preference.error) throw new Error(preference.error.message)
      snapshot.preference = preference.data ? mapPreference(preference.data as Record<string, unknown>) : null
      return snapshot
    },

    async createAcademicYear(input, periods = []) {
      if (periods.length > 0) {
        const row = unwrapRow(await client.rpc('create_academic_year_with_periods', {
          year_data: {
            id: input.id, owner_id: input.ownerId, label: input.label,
            start_date: input.startDate, end_date: input.endDate,
            is_active: input.isActive, archived_at: input.archivedAt,
          },
          period_data: periods.map((p) => ({
            id: p.id, name: p.name, sort_order: p.order,
            start_date: p.startDate, end_date: p.endDate,
          })),
        }))
        return mapYear(row)
      }
      const row = unwrapRow(
        await client
          .from('academic_years')
          .insert({
            id: input.id,
            owner_id: input.ownerId,
            label: input.label,
            start_date: input.startDate,
            end_date: input.endDate,
            is_active: input.isActive,
            archived_at: input.archivedAt,
          })
          .select()
          .single(),
      )
      return mapYear(row)
    },
    async updateAcademicYear(id, patch) {
      const row = unwrapRow(
        await client
          .from('academic_years')
          .update({
            label: patch.label,
            start_date: patch.startDate,
            end_date: patch.endDate,
            is_active: patch.isActive,
            archived_at: patch.archivedAt,
          })
          .eq('id', id)
          .select()
          .single(),
      )
      return mapYear(row)
    },
    async deleteAcademicYear(id) {
      const { error } = await client.from('academic_years').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    async createAcademicPeriod(input) {
      const row = unwrapRow(
        await client
          .from('academic_periods')
          .insert({
            id: input.id,
            owner_id: input.ownerId,
            academic_year_id: input.academicYearId,
            name: input.name,
            start_date: input.startDate,
            end_date: input.endDate,
            sort_order: input.order,
          })
          .select()
          .single(),
      )
      return mapPeriod(row)
    },
    async updateAcademicPeriod(id, patch) {
      const row = unwrapRow(
        await client
          .from('academic_periods')
          .update({
            name: patch.name,
            start_date: patch.startDate,
            end_date: patch.endDate,
            sort_order: patch.order,
          })
          .eq('id', id)
          .select()
          .single(),
      )
      return mapPeriod(row)
    },
    async deleteAcademicPeriod(id) {
      const { error } = await client.from('academic_periods').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    async createCourseCategory(input) {
      return mapCourseCategory(unwrapRow(await client.from('course_categories').insert({
        id: input.id, owner_id: input.ownerId, academic_year_id: input.academicYearId,
        kind: input.kind, parent_id: input.parentId, name: input.name,
      }).select().single()))
    },
    async updateCourseCategory(id, patch) {
      return mapCourseCategory(unwrapRow(await client.from('course_categories').update({
        name: patch.name, parent_id: patch.parentId,
      }).eq('id', id).select().single()))
    },
    async deleteCourseCategory(id) {
      const { error } = await client.from('course_categories').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    async createCourse(input) {
      const row = unwrapRow(
        await client
          .from('courses')
          .insert({
            id: input.id,
            owner_id: input.ownerId,
            academic_year_id: input.academicYearId,
            period_ids: input.periodIds,
            category_id: input.categoryId,
            name: input.name,
            professors: input.professors,
            description: input.description,
            ects: input.ects,
            status: input.status,
            exam_modalities: input.examModalities,
          })
          .select()
          .single(),
      )
      return mapCourse(row)
    },
    async updateCourse(id, patch) {
      const payload: Record<string, unknown> = {}
      if (patch.academicYearId !== undefined) payload.academic_year_id = patch.academicYearId
      if (patch.periodIds !== undefined) payload.period_ids = patch.periodIds
      if (patch.categoryId !== undefined) payload.category_id = patch.categoryId
      if (patch.name !== undefined) payload.name = patch.name
      if (patch.professors !== undefined) payload.professors = patch.professors
      if (patch.description !== undefined) payload.description = patch.description
      if (patch.ects !== undefined) payload.ects = patch.ects
      if (patch.status !== undefined) payload.status = patch.status
      if (patch.examModalities !== undefined) payload.exam_modalities = patch.examModalities
      const row = unwrapRow(await client.from('courses').update(payload).eq('id', id).select().single())
      return mapCourse(row)
    },
    async deleteCourse(id) {
      const { error } = await client.from('courses').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    async createTopic(input) {
      const row = unwrapRow(
        await client
          .from('course_topics')
          .insert({
            id: input.id,
            course_id: input.courseId,
            title: input.title,
            description: input.description,
            status: input.status,
            sort_order: input.order,
            completed_at: input.completedAt,
          })
          .select()
          .single(),
      )
      return mapTopic(row)
    },
    async updateTopic(id, patch) {
      const payload: Record<string, unknown> = {}
      if (patch.title !== undefined) payload.title = patch.title
      if (patch.description !== undefined) payload.description = patch.description
      if (patch.status !== undefined) payload.status = patch.status
      if (patch.order !== undefined) payload.sort_order = patch.order
      if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt
      const row = unwrapRow(await client.from('course_topics').update(payload).eq('id', id).select().single())
      return mapTopic(row)
    },
    async deleteTopic(id) {
      const { error } = await client.from('course_topics').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    async createDocumentCategory(input) {
      const row = unwrapRow(
        await client
          .from('document_categories')
          .insert({ id: input.id, owner_id: input.ownerId, name: input.name, is_default: input.isDefault })
          .select()
          .single(),
      )
      return mapCategory(row)
    },
    async updateDocumentCategory(id, patch) {
      const row = unwrapRow(
        await client
          .from('document_categories')
          .update({ name: patch.name })
          .eq('id', id)
          .select()
          .single(),
      )
      return mapCategory(row)
    },
    async deleteDocumentCategory(id) {
      const { error } = await client.from('document_categories').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    async createDocument(input, file) {
      const storagePath = `${input.ownerId}/${input.courseId}/${input.id}-${input.fileName}`
      const upload = await client.storage.from(DOCUMENTS_BUCKET).upload(storagePath, file, {
        contentType: input.mimeType,
      })
      if (upload.error) throw new Error(upload.error.message)
      const row = unwrapRow(
        await client
          .from('documents')
          .insert({
            id: input.id,
            owner_id: input.ownerId,
            course_id: input.courseId,
            category_id: input.categoryId,
            display_name: input.displayName,
            file_name: input.fileName,
            mime_type: input.mimeType,
            size_bytes: input.size,
            storage_path: storagePath,
          })
          .select()
          .single(),
      )
      return mapDocument(row)
    },
    async updateDocument(id, patch) {
      const payload: Record<string, unknown> = {}
      if (patch.displayName !== undefined) payload.display_name = patch.displayName
      if (patch.categoryId !== undefined) payload.category_id = patch.categoryId
      const row = unwrapRow(await client.from('documents').update(payload).eq('id', id).select().single())
      return mapDocument(row)
    },
    async deleteDocument(id) {
      const existing = await client.from('documents').select('storage_path').eq('id', id).maybeSingle()
      if (existing.data) {
        await client.storage.from(DOCUMENTS_BUCKET).remove([(existing.data as { storage_path: string }).storage_path])
      }
      const { error } = await client.from('documents').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    async getDocumentBlob(storageRef) {
      const result = await client.storage.from(DOCUMENTS_BUCKET).download(storageRef)
      if (result.error) return null
      return result.data
    },

    async createTask(input) {
      const row = unwrapRow(
        await client
          .from('tasks')
          .insert({
            id: input.id,
            owner_id: input.ownerId,
            course_id: input.courseId,
            title: input.title,
            description: input.description,
            type: input.type,
            due_date: input.dueDate,
            priority: input.priority,
            status: input.status,
            completed_at: input.completedAt,
          })
          .select()
          .single(),
      )
      return mapTask(row)
    },
    async updateTask(id, patch) {
      const payload: Record<string, unknown> = {}
      if (patch.title !== undefined) payload.title = patch.title
      if (patch.description !== undefined) payload.description = patch.description
      if (patch.type !== undefined) payload.type = patch.type
      if (patch.dueDate !== undefined) payload.due_date = patch.dueDate
      if (patch.priority !== undefined) payload.priority = patch.priority
      if (patch.status !== undefined) payload.status = patch.status
      if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt
      const row = unwrapRow(await client.from('tasks').update(payload).eq('id', id).select().single())
      return mapTask(row)
    },
    async deleteTask(id) {
      const { error } = await client.from('tasks').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    async createExam(input) {
      const row = unwrapRow(
        await client
          .from('exams')
          .insert({
            id: input.id,
            owner_id: input.ownerId,
            course_id: input.courseId,
            title: input.title,
            exam_date: input.date,
            type: input.type,
            modalities: input.modalities,
            preparation_status: input.preparationStatus,
            result: input.result,
          })
          .select()
          .single(),
      )
      return mapExam(row)
    },
    async updateExam(id, patch) {
      const payload: Record<string, unknown> = {}
      if (patch.result !== undefined) payload.result = patch.result
      if (patch.courseId !== undefined) payload.course_id = patch.courseId
      if (patch.title !== undefined) payload.title = patch.title
      if (patch.date !== undefined) payload.exam_date = patch.date
      if (patch.type !== undefined) payload.type = patch.type
      if (patch.modalities !== undefined) payload.modalities = patch.modalities
      if (patch.preparationStatus !== undefined) payload.preparation_status = patch.preparationStatus
      const row = unwrapRow(await client.from('exams').update(payload).eq('id', id).select().single())
      return mapExam(row)
    },
    async deleteExam(id) {
      const { error } = await client.from('exams').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    async createStudySession(input) {
      const row = unwrapRow(
        await client
          .from('study_sessions')
          .insert({
            id: input.id,
            owner_id: input.ownerId,
            course_id: input.courseId,
            session_date: input.date,
            start_time: input.startTime,
            duration_minutes: input.durationMinutes,
            source: input.source,
            notes: input.notes,
          })
          .select()
          .single(),
      )
      return mapSession(row)
    },
    async updateStudySession(id, patch) {
      const payload: Record<string, unknown> = {}
      if (patch.courseId !== undefined) payload.course_id = patch.courseId
      if (patch.date !== undefined) payload.session_date = patch.date
      if (patch.startTime !== undefined) payload.start_time = patch.startTime
      if (patch.durationMinutes !== undefined) payload.duration_minutes = patch.durationMinutes
      if (patch.notes !== undefined) payload.notes = patch.notes
      const row = unwrapRow(await client.from('study_sessions').update(payload).eq('id', id).select().single())
      return mapSession(row)
    },
    async deleteStudySession(id) {
      const { error } = await client.from('study_sessions').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    async createNote(input) {
      const row = unwrapRow(
        await client
          .from('personal_notes')
          .insert({
            id: input.id,
            owner_id: input.ownerId,
            course_id: input.courseId,
            title: input.title,
            content: input.content,
          })
          .select()
          .single(),
      )
      return mapNote(row)
    },
    async updateNote(id, patch) {
      const payload: Record<string, unknown> = {}
      if (patch.title !== undefined) payload.title = patch.title
      if (patch.content !== undefined) payload.content = patch.content
      if (patch.courseId !== undefined) payload.course_id = patch.courseId
      const row = unwrapRow(await client.from('personal_notes').update(payload).eq('id', id).select().single())
      return mapNote(row)
    },
    async deleteNote(id) {
      const { error } = await client.from('personal_notes').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    async savePreference(pref) {
      const row = unwrapRow(
        await client
          .from('user_preferences')
          .upsert({
            owner_id: pref.ownerId,
            theme: pref.theme,
            focus_work_minutes: pref.focusWorkMinutes,
            focus_break_minutes: pref.focusBreakMinutes,
          })
          .select()
          .single(),
      )
      return mapPreference(row)
    },
  }
}
