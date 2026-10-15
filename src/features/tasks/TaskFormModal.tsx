import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Field, TextInput, Textarea, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { useDataStore, useSnapshot } from '@/data/DataProvider'
import { taskSchema, type TaskFormValues } from '@/lib/validation'
import { TASK_PRIORITIES, TASK_TYPES } from '@/types/domain'
import type { Task } from '@/types/domain'

export function TaskFormModal({
  task,
  defaultCourseId,
  onClose,
}: {
  task?: Task
  defaultCourseId?: string
  onClose: () => void
}) {
  const store = useDataStore()
  const { courses } = useSnapshot()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      courseId: task?.courseId ?? defaultCourseId ?? courses[0]?.id ?? '',
      type: task?.type ?? 'assignment',
      dueDate: task?.dueDate?.slice(0, 10) ?? '',
      priority: task?.priority ?? 'medium',
    },
  })

  async function onSubmit(values: TaskFormValues) {
    const payload = {
      title: values.title,
      description: values.description || null,
      courseId: values.courseId,
      type: values.type,
      dueDate: values.dueDate || null,
      priority: values.priority,
    }
    if (task) await store.updateTask(task.id, payload)
    else await store.createTask(payload)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={task ? 'Modifier la tâche' : 'Nouvelle tâche'}>
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
        <div className="grid grid-cols-3 gap-3">
          <Field label="Type">
            <Select {...register('type')}>
              {TASK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priorité">
            <Select {...register('priority')}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Échéance">
            <TextInput type="date" {...register('dueDate')} />
          </Field>
        </div>
        <Field label="Description (facultative)">
          <Textarea rows={3} {...register('description')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || courses.length === 0}>
            {task ? 'Enregistrer' : 'Créer la tâche'}
          </Button>
        </div>
        {courses.length === 0 && <p className="text-xs text-amber-600">Créez d'abord un cours.</p>}
      </form>
    </Modal>
  )
}
