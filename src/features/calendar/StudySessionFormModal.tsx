import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Field, TextInput, Textarea, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { useDataStore, useSnapshot } from '@/data/DataProvider'
import { studySessionSchema, type StudySessionFormValues } from '@/lib/validation'
import type { StudySession } from '@/types/domain'

export function StudySessionFormModal({
  session,
  defaultCourseId,
  defaultDate,
  onClose,
}: {
  session?: StudySession
  defaultCourseId?: string | null
  defaultDate?: string
  onClose: () => void
}) {
  const store = useDataStore()
  const { courses } = useSnapshot()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudySessionFormValues>({
    resolver: zodResolver(studySessionSchema),
    defaultValues: {
      courseId: session?.courseId ?? defaultCourseId ?? '',
      date: session?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10),
      startTime: session?.startTime?.slice(11, 16) ?? '18:00',
      durationMinutes: String(session?.durationMinutes ?? 60),
      notes: session?.notes ?? '',
    },
  })

  async function onSubmit(values: StudySessionFormValues) {
    const startTime = new Date(`${values.date}T${values.startTime}:00`).toISOString()
    const payload = {
      courseId: values.courseId || null,
      date: values.date,
      startTime,
      durationMinutes: Number(values.durationMinutes),
      source: 'manual' as const,
      notes: values.notes || null,
    }
    if (session) await store.updateStudySession(session.id, payload)
    else await store.createStudySession(payload)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={session ? 'Modifier la séance' : "Nouvelle séance d'étude"}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Cours (facultatif)">
          <Select {...register('courseId')}>
            <option value="">Sans cours associé</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Date" error={errors.date?.message}>
            <TextInput type="date" hasError={!!errors.date} {...register('date')} />
          </Field>
          <Field label="Heure de début" error={errors.startTime?.message}>
            <TextInput type="time" hasError={!!errors.startTime} {...register('startTime')} />
          </Field>
          <Field label="Durée (min)" error={errors.durationMinutes?.message}>
            <TextInput type="number" min={5} max={600} hasError={!!errors.durationMinutes} {...register('durationMinutes')} />
          </Field>
        </div>
        <Field label="Notes (facultatives)">
          <Textarea rows={2} {...register('notes')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {session ? 'Enregistrer' : 'Ajouter la séance'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
