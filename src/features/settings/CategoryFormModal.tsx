import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Field, TextInput } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { useDataStore } from '@/data/DataProvider'
import { documentCategorySchema, type DocumentCategoryFormValues } from '@/lib/validation'
import type { DocumentCategory } from '@/types/domain'

export function CategoryFormModal({ category, onClose }: { category?: DocumentCategory; onClose: () => void }) {
  const store = useDataStore()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DocumentCategoryFormValues>({
    resolver: zodResolver(documentCategorySchema),
    defaultValues: { name: category?.name ?? '' },
  })

  async function onSubmit(values: DocumentCategoryFormValues) {
    if (category) await store.renameDocumentCategory(category.id, values.name)
    else await store.createDocumentCategory(values.name)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={category ? 'Renommer la catégorie' : 'Nouvelle catégorie de documents'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Nom de la catégorie" error={errors.name?.message}>
          <TextInput placeholder="Notes de cours" hasError={!!errors.name} {...register('name')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {category ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
