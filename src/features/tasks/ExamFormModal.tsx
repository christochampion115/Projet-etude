import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Field, TextInput, Textarea, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { useDataStore, useSnapshot } from '@/data/DataProvider'
import { examSchema, type ExamFormValues } from '@/lib/validation'
import { EXAM_TYPES } from '@/types/domain'
import type { Exam } from '@/types/domain'

export function ExamFormModal({
  exam,
  defaultCourseId,
  onClose,
}: {
  exam?: Exam
  defaultCourseId?: string
  onClose: () => void
}) {
  const store = useDataStore()
  const { courses } = useSnapshot()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: exam?.title ?? '',
      courseId: exam?.courseId ?? defaultCourseId ?? courses[0]?.id ?? '',
      date: exam?.date?.slice(0, 10) ?? '',
      type: exam?.type ?? 'written',
      modalities: exam?.modalities ?? '',
    },
  })

  async function onSubmit(values: ExamFormValues) {
    const payload = {
      title: values.title,
      courseId: values.courseId,
      date: values.date || null,
      type: values.type,
      modalities: values.modalities || null,
    }
    if (exam) await store.updateExam(exam.id, payload)
    else await store.createExam(payload)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={exam ? "Modifier l'examen" : 'Nouvel examen'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Titre" error={errors.title?.message}>
          <TextInput hasError={!!errors.title} {...register('title')} />
        </Field>
        <Field label="Cours" error={errors.courseId?.message}>
          <Select {...register('courseId')}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select {...register('type')}>
              {EXAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date (facultative)">
            <TextInput type="date" {...register('date')} />
          </Field>
        </div>
        <Field label="Modalités (facultatives)">
          <Textarea rows={3} {...register('modalities')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || courses.length === 0}>
            {exam ? 'Enregistrer' : "Créer l'examen"}
          </Button>
        </div>
        {courses.length === 0 && <p className="text-xs text-amber-600">Créez d'abord un cours.</p>}
      </form>
    </Modal>
  )
}
