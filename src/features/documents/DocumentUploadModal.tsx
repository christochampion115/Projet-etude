import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Upload } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Field, TextInput, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { useDataStore, useSnapshot } from '@/data/DataProvider'
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_SIZE_BYTES,
  documentUploadSchema,
  isAllowedDocumentFile,
  type DocumentUploadFormValues,
} from '@/lib/validation'

export function DocumentUploadModal({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const store = useDataStore()
  const { documentCategories } = useSnapshot()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: { displayName: '', categoryId: documentCategories[0]?.id ?? '' },
  })

  function handleFileChange(selected: File | null) {
    setFileError(null)
    if (!selected) {
      setFile(null)
      return
    }
    if (!isAllowedDocumentFile(selected)) {
      setFileError(`Format non pris en charge. Formats acceptés : ${ALLOWED_DOCUMENT_EXTENSIONS.join(', ')}`)
      setFile(null)
      return
    }
    if (selected.size > MAX_DOCUMENT_SIZE_BYTES) {
      setFileError(`Fichier trop volumineux (max ${Math.round(MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024))} Mo).`)
      setFile(null)
      return
    }
    setFile(selected)
    setValue('displayName', selected.name.replace(/\.[^.]+$/, ''), { shouldValidate: true })
  }

  async function onSubmit(values: DocumentUploadFormValues) {
    if (!file) {
      setFileError('Sélectionnez un fichier à téléverser.')
      return
    }
    setUploading(true)
    try {
      await store.createDocument({ courseId, categoryId: values.categoryId, displayName: values.displayName }, file)
      onClose()
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Échec du téléversement")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Ajouter un document">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Fichier</span>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 hover:border-accent-400 dark:border-slate-700">
            <Upload size={20} />
            {file ? file.name : 'Cliquez pour choisir un fichier'}
            <input
              type="file"
              className="hidden"
              accept={ALLOWED_DOCUMENT_EXTENSIONS.join(',')}
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
          {fileError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fileError}</p>}
          {!fileError && (
            <p className="mt-1 text-xs text-slate-400">
              Formats acceptés : PDF, Word, PowerPoint, Excel, texte, images. Max{' '}
              {Math.round(MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024))} Mo.
            </p>
          )}
        </div>

        <Field label="Nom d'affichage" error={errors.displayName?.message}>
          <TextInput hasError={!!errors.displayName} {...register('displayName')} />
        </Field>

        <Field label="Catégorie" error={errors.categoryId?.message}>
          <Select {...register('categoryId')}>
            {documentCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        {uploading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-accent-600" />
            </div>
            Envoi en cours…
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={uploading}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={uploading || documentCategories.length === 0}>
            {uploading ? 'Envoi…' : 'Téléverser'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
