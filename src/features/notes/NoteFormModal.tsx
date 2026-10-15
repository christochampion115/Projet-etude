import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Field, TextInput, Textarea, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { useDataStore, useSnapshot } from '@/data/DataProvider'
import { noteSchema, type NoteFormValues } from '@/lib/validation'
import type { PersonalNote } from '@/types/domain'

export function NoteFormModal({
  note,
  defaultCourseId,
  onClose,
}: {
  note?: PersonalNote
  defaultCourseId?: string | null
  onClose: () => void
}) {
  const store = useDataStore()
  const { courses } = useSnapshot()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: note?.title ?? '',
      content: note?.content ?? '',
      courseId: note?.courseId ?? defaultCourseId ?? '',
    },
  })

  async function onSubmit(values: NoteFormValues) {
    const payload = { title: values.title, content: values.content ?? '', courseId: values.courseId || null }
    if (note) await store.updateNote(note.id, payload)
    else await store.createNote(payload)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={note ? 'Modifier la note' : 'Nouvelle note'} widthClassName="max-w-xl">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Titre" error={errors.title?.message}>
          <TextInput hasError={!!errors.title} {...register('title')} />
        </Field>
        <Field label="Cours associé (facultatif)">
          <Select {...register('courseId')}>
            <option value="">Note générale (aucun cours)</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Contenu">
          <Textarea rows={8} {...register('content')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {note ? 'Enregistrer' : 'Créer la note'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
