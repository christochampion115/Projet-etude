import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Field, TextInput, Textarea } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { useDataStore } from '@/data/DataProvider'
import { topicSchema, type TopicFormValues } from '@/lib/validation'
import type { CourseTopic } from '@/types/domain'

export function TopicFormModal({
  courseId,
  topic,
  onClose,
}: {
  courseId: string
  topic?: CourseTopic
  onClose: () => void
}) {
  const store = useDataStore()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: { title: topic?.title ?? '', description: topic?.description ?? '' },
  })

  async function onSubmit(values: TopicFormValues) {
    const payload = { title: values.title, description: values.description || null }
    if (topic) await store.updateTopic(topic.id, payload)
    else await store.createTopic({ courseId, ...payload })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={topic ? 'Modifier le chapitre' : 'Nouveau chapitre'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Titre" error={errors.title?.message}>
          <TextInput placeholder="Chapitre 1 — Introduction" hasError={!!errors.title} {...register('title')} />
        </Field>
        <Field label="Description (facultative)">
          <Textarea rows={3} {...register('description')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {topic ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
