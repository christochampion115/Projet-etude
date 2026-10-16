import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Field, TextInput, Textarea, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { useDataStore, useSnapshot } from '@/data/DataProvider'
import { courseSchema, type CourseFormValues } from '@/lib/validation'
import { autresCategoriesForYear, domainesForYear, optionsForDomaine, periodsForYear } from '@/lib/selectors'
import type { Course } from '@/types/domain'

export function CourseFormModal({
  course,
  defaultYearId,
  defaultPeriodId,
  onClose,
}: {
  course?: Course
  defaultYearId?: string
  defaultPeriodId?: string
  onClose: () => void
}) {
  const store = useDataStore()
  const { academicYears, academicPeriods, courseCategories } = useSnapshot()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: course?.name ?? '',
      academicYearId: course?.academicYearId ?? defaultYearId ?? academicYears[0]?.id ?? '',
      periodIds: course?.periodIds ?? (defaultPeriodId ? [defaultPeriodId] : []),
      categoryId: course?.categoryId ?? '',
      professors: course?.professors.join(', ') ?? '',
      description: course?.description ?? '',
      ects: course?.ects != null ? String(course.ects) : '',
      examModalities: course?.examModalities ?? '',
    },
  })

  const selectedYearId = watch('academicYearId')
  const periods = periodsForYear(academicPeriods, selectedYearId)
  const domaines = domainesForYear(courseCategories, selectedYearId)
  const autresCategories = autresCategoriesForYear(courseCategories, selectedYearId)

  async function onSubmit(values: CourseFormValues) {
    const payload = {
      academicYearId: values.academicYearId,
      periodIds: values.periodIds,
      categoryId: values.categoryId || null,
      name: values.name,
      professors: values.professors
        ? values.professors.split(',').map((p) => p.trim()).filter(Boolean)
        : [],
      description: values.description || null,
      ects: values.ects === '' || values.ects === undefined ? null : Number(values.ects),
      examModalities: values.examModalities || null,
    }
    try {
      if (course) await store.updateCourse(course.id, payload)
      else await store.createCourse(payload)
      onClose()
    } catch (error) {
      setError('root', { message: error instanceof Error ? error.message : "Impossible d'enregistrer le cours." })
    }
  }

  return (
    <Modal open onClose={onClose} title={course ? 'Modifier le cours' : 'Ajouter un cours'} widthClassName="max-w-xl">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Nom du cours" error={errors.name?.message}>
          <TextInput placeholder="Analyse mathématique" hasError={!!errors.name} {...register('name')} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Année académique" error={errors.academicYearId?.message}>
            <Select {...register('academicYearId', { onChange: () => {
              setValue('periodIds', [])
              setValue('categoryId', '')
            } })}>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Professeur(s)" hint="Séparés par des virgules">
            <TextInput placeholder="Jean Dupont, Marie Durand" {...register('professors')} />
          </Field>
        </div>

        <Field
          label="Catégorisation"
          hint="Un cours appartient au tronc commun, à un domaine, à une option d'un domaine, ou à une autre catégorie."
        >
          <Select {...register('categoryId')}>
            <option value="">Tronc commun</option>
            {domaines.length > 0 && (
              <optgroup label="Domaines">
                {domaines.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </optgroup>
            )}
            {domaines.map((domaine) => {
              const options = optionsForDomaine(courseCategories, domaine.id)
              if (options.length === 0) return null
              return (
                <optgroup key={domaine.id} label={`Options · ${domaine.name}`}>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </optgroup>
              )
            })}
            {autresCategories.length > 0 && (
              <optgroup label="Autres catégories">
                {autresCategories.map((autre) => (
                  <option key={autre.id} value={autre.id}>{autre.name}</option>
                ))}
              </optgroup>
            )}
          </Select>
        </Field>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">Périodes</legend>
          {periods.length === 0 ? (
            <p className="text-xs text-slate-400">
              Aucune période pour cette année. Ajoutez-en depuis Mes cours ou les paramètres.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {periods.map((period) => (
                <label
                  key={period.id}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 has-[:checked]:border-accent-400 has-[:checked]:bg-accent-50 has-[:checked]:text-accent-700 dark:border-slate-700 dark:text-slate-300"
                >
                  <input type="checkbox" value={period.id} className="accent-accent-600" {...register('periodIds')} />
                  {period.name}
                </label>
              ))}
            </div>
          )}
          {errors.periodIds && <p role="alert" className="mt-1 text-xs text-red-600">{errors.periodIds.message}</p>}
          <p className="mt-1 text-xs text-slate-400">Sélectionnez toutes les périodes du cours (Q1, Q2, TA…).</p>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <Field label="ECTS (facultatif)" error={errors.ects?.message}>
            <TextInput type="number" min={0} max={120} {...register('ects')} />
          </Field>
        </div>

        <Field label="Description (facultative)">
          <Textarea rows={2} {...register('description')} />
        </Field>

        <Field label="Modalités d'examen (facultatives)">
          <Textarea rows={2} {...register('examModalities')} />
        </Field>

        {errors.root && <p role="alert" className="text-sm text-red-600">{errors.root.message}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {course ? 'Enregistrer' : 'Créer le cours'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
