import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Field, TextInput } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { useDataStore } from '@/data/DataProvider'
import { academicPeriodSchema, type AcademicPeriodFormValues } from '@/lib/validation'
import type { AcademicPeriod } from '@/types/domain'

export function PeriodFormModal({
  yearId,
  period,
  onClose,
}: {
  yearId: string
  period?: AcademicPeriod
  onClose: () => void
}) {
  const store = useDataStore()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcademicPeriodFormValues>({
    resolver: zodResolver(academicPeriodSchema),
    defaultValues: {
      name: period?.name ?? '',
      startDate: period?.startDate ?? '',
      endDate: period?.endDate ?? '',
    },
  })

  async function onSubmit(values: AcademicPeriodFormValues) {
    const payload = { name: values.name, startDate: values.startDate || null, endDate: values.endDate || null }
    if (period) await store.updateAcademicPeriod(period.id, payload)
    else await store.createAcademicPeriod({ academicYearId: yearId, ...payload })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={period ? 'Modifier la période' : 'Nouvelle période'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Nom de la période" error={errors.name?.message}>
          <TextInput placeholder="Quadrimestre 1" hasError={!!errors.name} {...register('name')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date de début (facultatif)">
            <TextInput type="date" {...register('startDate')} />
          </Field>
          <Field label="Date de fin (facultatif)">
            <TextInput type="date" {...register('endDate')} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {period ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
