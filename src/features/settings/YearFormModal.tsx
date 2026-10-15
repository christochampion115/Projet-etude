import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Field, TextInput } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { useDataStore } from '@/data/DataProvider'
import { academicYearSchema, type AcademicYearFormValues } from '@/lib/validation'
import type { AcademicYear } from '@/types/domain'

export function YearFormModal({ year, onClose }: { year?: AcademicYear; onClose: () => void }) {
  const store = useDataStore()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      label: year?.label ?? '',
      startDate: year?.startDate ?? '',
      endDate: year?.endDate ?? '',
    },
  })

  async function onSubmit(values: AcademicYearFormValues) {
    const payload = {
      label: values.label,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    }
    if (year) await store.updateAcademicYear(year.id, payload)
    else await store.createAcademicYear(payload)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={year ? "Modifier l'année académique" : 'Nouvelle année académique'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Libellé" error={errors.label?.message}>
          <TextInput placeholder="2026-2027" hasError={!!errors.label} {...register('label')} />
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
            {year ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
