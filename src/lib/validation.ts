import { z } from 'zod'

export const academicYearSchema = z.object({
  label: z.string().trim().min(1, "Le libellé de l'année est obligatoire").max(50),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
})
export type AcademicYearFormValues = z.infer<typeof academicYearSchema>

export const academicPeriodSchema = z.object({
  name: z.string().trim().min(1, 'Le nom de la période est obligatoire').max(60),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
})
export type AcademicPeriodFormValues = z.infer<typeof academicPeriodSchema>

export const courseSchema = z.object({
  name: z.string().trim().min(1, 'Le nom du cours est obligatoire').max(120),
  academicYearId: z.string().min(1, "Choisissez l'année académique"),
  periodIds: z.array(z.string()).min(1, 'Choisissez au moins une période'),
  categoryId: z.string(),
  professors: z.string().max(300).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  ects: z
    .string()
    .optional()
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 120), {
      message: 'ECTS invalides (0 à 120)',
    }),
  examModalities: z.string().max(1000).optional().or(z.literal('')),
})
export type CourseFormValues = z.infer<typeof courseSchema>

export const topicSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est obligatoire').max(150),
  description: z.string().max(1000).optional().or(z.literal('')),
})
export type TopicFormValues = z.infer<typeof topicSchema>

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est obligatoire').max(150),
  description: z.string().max(2000).optional().or(z.literal('')),
  courseId: z.string().min(1, 'Choisissez un cours'),
  type: z.enum(['assignment', 'reading', 'revision', 'project', 'other']),
  dueDate: z.string().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high']),
})
export type TaskFormValues = z.infer<typeof taskSchema>

export const examSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est obligatoire').max(150),
  courseId: z.string().min(1, 'Choisissez un cours'),
  date: z.string().optional().or(z.literal('')),
  type: z.enum(['written', 'oral', 'practical', 'project', 'other']),
  modalities: z.string().max(1000).optional().or(z.literal('')),
})
export type ExamFormValues = z.infer<typeof examSchema>

export const noteSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est obligatoire').max(150),
  content: z.string().max(10000).optional().or(z.literal('')),
  courseId: z.string().optional().or(z.literal('')),
})
export type NoteFormValues = z.infer<typeof noteSchema>

export const documentCategorySchema = z.object({
  name: z.string().trim().min(1, 'Le nom de la catégorie est obligatoire').max(60),
})
export type DocumentCategoryFormValues = z.infer<typeof documentCategorySchema>

export const documentUploadSchema = z.object({
  displayName: z.string().trim().min(1, "Le nom d'affichage est obligatoire").max(150),
  categoryId: z.string().min(1, 'Choisissez une catégorie'),
})
export type DocumentUploadFormValues = z.infer<typeof documentUploadSchema>

export const studySessionSchema = z.object({
  courseId: z.string().optional().or(z.literal('')),
  date: z.string().min(1, 'La date est obligatoire'),
  startTime: z.string().min(1, "L'heure de début est obligatoire"),
  durationMinutes: z
    .string()
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 5 && Number(v) <= 600, {
      message: 'Durée invalide (5 à 600 minutes)',
    }),
  notes: z.string().max(1000).optional().or(z.literal('')),
})
export type StudySessionFormValues = z.infer<typeof studySessionSchema>

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
]

export const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024 // 25 Mo

export function isAllowedDocumentFile(file: File): boolean {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  return ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)
}
