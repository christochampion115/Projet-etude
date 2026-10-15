import { useState } from 'react'
import { Download, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Field, Select, TextInput } from '@/components/ui/form'
import { useDataStore, useSnapshot } from '@/data/DataProvider'
import { DocumentUploadModal } from '@/features/documents/DocumentUploadModal'
import type { CourseDocument } from '@/types/domain'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function DocumentsTab({ courseId, documents }: { courseId: string; documents: CourseDocument[] }) {
  const store = useDataStore()
  const { documentCategories } = useSnapshot()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editing, setEditing] = useState<CourseDocument | null>(null)
  const [deleting, setDeleting] = useState<CourseDocument | null>(null)

  const byCategory = documentCategories
    .map((category) => ({ category, docs: documents.filter((d) => d.categoryId === category.id) }))
    .filter((group) => group.docs.length > 0)

  async function handleDownload(doc: CourseDocument) {
    const blob = await store.getDocumentBlob(doc.storageRef)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setUploadOpen(true)}>
          Ajouter un document
        </Button>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title="Aucun document pour ce cours"
          description="Téléversez vos notes de cours, supports et exercices pour les retrouver facilement."
          actionLabel="Ajouter un document"
          onAction={() => setUploadOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {byCategory.map(({ category, docs }) => (
            <Card key={category.id}>
              <CardBody>
                <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{category.name}</h4>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {docs.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{doc.displayName}</p>
                        <p className="text-xs text-slate-400">
                          {formatSize(doc.size)} · {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge tone="neutral">{doc.mimeType.split('/')[1]?.toUpperCase() ?? 'Fichier'}</Badge>
                        <Button size="sm" variant="ghost" icon={<Download size={14} />} onClick={() => void handleDownload(doc)}>
                          Télécharger
                        </Button>
                        <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={() => setEditing(doc)} />
                        <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setDeleting(doc)} />
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {uploadOpen && <DocumentUploadModal courseId={courseId} onClose={() => setUploadOpen(false)} />}
      {editing && <EditDocumentModal doc={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={deleting !== null}
        title="Supprimer ce document ?"
        description={`"${deleting?.displayName}" sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void store.deleteDocument(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

function EditDocumentModal({ doc, onClose }: { doc: CourseDocument; onClose: () => void }) {
  const store = useDataStore()
  const { documentCategories } = useSnapshot()
  const [displayName, setDisplayName] = useState(doc.displayName)
  const [categoryId, setCategoryId] = useState(doc.categoryId)

  return (
    <Modal open onClose={onClose} title="Modifier le document">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          await store.updateDocument(doc.id, { displayName, categoryId })
          onClose()
        }}
      >
        <Field label="Nom d'affichage">
          <TextInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </Field>
        <Field label="Catégorie">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {documentCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary">
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
