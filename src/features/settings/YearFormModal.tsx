import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Field, TextInput } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { useDataStore } from '@/data/DataProvider'
import { academicYearSchema } from '@/lib/validation'
import type { AcademicYear } from '@/types/domain'

const yearWithPeriodsSchema = academicYearSchema.extend({
  periods: z.array(z.object({ name: z.string().trim().min(1, 'Nommez la période').max(60) }))
    .refine((periods) => new Set(periods.map((p) => p.name.toLocaleLowerCase('fr'))).size === periods.length,
      'Les noms des périodes doivent être distincts.'),
})

export function YearFormModal({ year, onClose, onCreated }: { year?: AcademicYear; onClose: () => void; onCreated?: (year: AcademicYear) => void }) {
  const store = useDataStore()
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof yearWithPeriodsSchema>>({
    resolver: zodResolver(yearWithPeriodsSchema),
    defaultValues: {
      label: year?.label ?? '',
      startDate: year?.startDate ?? '',
      endDate: year?.endDate ?? '',
      periods: year ? [] : [{ name: 'Q1' }, { name: 'Q2' }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'periods' })

  async function onSubmit(values: z.infer<typeof yearWithPeriodsSchema>) {
    const payload = {
      label: values.label,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    }
    try {
      if (year) await store.updateAcademicYear(year.id, payload)
      else {
        const created = await store.createAcademicYear({ ...payload, periodNames: values.periods.map((p) => p.name) })
        onCreated?.(created)
      }
      onClose()
    } catch (error) {
      setError('root', { message: error instanceof Error ? error.message : "Impossible d'enregistrer l'année." })
    }
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
        {!year && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Périodes de l'année</legend>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <Field label={`Période ${index + 1}`} error={errors.periods?.[index]?.name?.message}>
                  <TextInput placeholder="Q1, Q2, TA…" {...register(`periods.${index}.name`)} />
                </Field>
                <Button type="button" onClick={() => remove(index)} aria-label={`Retirer la période ${index + 1}`}>Retirer</Button>
              </div>
            ))}
            {errors.periods?.root?.message && <p role="alert" className="text-sm text-red-600">{errors.periods.root.message}</p>}
            <Button type="button" onClick={() => append({ name: '' })}>Ajouter une période</Button>
          </fieldset>
        )}
        {errors.root && <p role="alert" className="text-sm text-red-600">{errors.root.message}</p>}
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
