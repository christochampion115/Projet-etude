import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Select, TextInput } from '@/components/ui/form'
import { useDataStore, useSnapshot } from '@/data/DataProvider'
import { domainesForYear } from '@/lib/selectors'
import { COURSE_CATEGORY_KINDS, type CourseCategory, type CourseCategoryKind } from '@/types/domain'

const NAME_PLACEHOLDERS: Record<CourseCategoryKind, string> = {
  domaine: 'Informatique',
  option: 'Sécurité',
  autre: 'Alternance',
}

export function CourseCategoryFormModal({ yearId, category, onClose }: {
  yearId: string
  category?: CourseCategory
  onClose: () => void
}) {
  const store = useDataStore()
  const { courseCategories, courses } = useSnapshot()
  const [kind, setKind] = useState<CourseCategoryKind>(category?.kind ?? 'domaine')
  const [name, setName] = useState(category?.name ?? '')
  const [parentId, setParentId] = useState(category?.parentId ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const domaines = domainesForYear(courseCategories, yearId).filter((d) => d.id !== category?.id)
  const occupied = category && (
    courses.some((c) => c.categoryId === category.id) ||
    courseCategories.some((c) => c.parentId === category.id)
  )

  async function save(deleting = false) {
    setSaving(true)
    setError('')
    try {
      if (deleting && category) {
        await store.deleteCourseCategory(category.id)
      } else if (category) {
        await store.updateCourseCategory(category.id, { name, parentId: kind === 'option' ? parentId || null : null })
      } else {
        await store.createCourseCategory({ academicYearId: yearId, kind, name, parentId: kind === 'option' ? parentId || null : null })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer la catégorie.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void save() }}>
        <Field label="Type de catégorie" hint={category ? 'Le type ne peut plus être modifié après la création.' : undefined}>
          <Select value={kind} disabled={!!category} onChange={(e) => setKind(e.target.value as CourseCategoryKind)}>
            {COURSE_CATEGORY_KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </Select>
        </Field>

        {kind === 'option' && (
          <Field label="Domaine parent">
            <Select required value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">Choisissez un domaine…</option>
              {domaines.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            {domaines.length === 0 && <p className="mt-1 text-xs text-amber-600">Créez d'abord un domaine.</p>}
          </Field>
        )}

        <Field label="Nom">
          <TextInput
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={NAME_PLACEHOLDERS[kind]}
          />
        </Field>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {occupied && (
          <p className="text-xs text-slate-500">Déplacez les cours et options avant de supprimer cette catégorie.</p>
        )}

        <div className="flex justify-end gap-2">
          {category && (
            <Button type="button" variant="danger" disabled={saving || !!occupied} onClick={() => void save(true)}>
              Supprimer
            </Button>
          )}
          <Button type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="primary" disabled={saving || (kind === 'option' && domaines.length === 0)}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
