import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download, FileText, Pencil, Search, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataBoundary } from '@/components/layout/DataBoundary'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select } from '@/components/ui/form'
import { useDataStore, useSnapshot } from '@/data/DataProvider'
import type { CourseDocument } from '@/types/domain'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function DocumentsPage() {
  const store = useDataStore()
  const navigate = useNavigate()
  const { documents, documentCategories, courses } = useSnapshot()
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [deleting, setDeleting] = useState<CourseDocument | null>(null)

  const courseName = (id: string) => courses.find((c) => c.id === id)?.name ?? 'Cours supprimé'
  const categoryName = (id: string) => documentCategories.find((c) => c.id === id)?.name ?? 'Autre'

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return documents
      .filter((d) => courseFilter === 'all' || d.courseId === courseFilter)
      .filter((d) => categoryFilter === 'all' || d.categoryId === categoryFilter)
      .filter((d) => !term || d.displayName.toLowerCase().includes(term))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [documents, courseFilter, categoryFilter, search])

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
    <div>
      <PageHeader title="Documents" description="Tous vos fichiers, tous cours confondus. Pour en ajouter, ouvrez la fiche d'un cours." />
      <DataBoundary>
        {documents.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title="Aucun document"
            description="Ouvrez la fiche d'un cours pour téléverser vos premiers documents."
          />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un document…"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <Select className="w-auto" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
                <option value="all">Tous les cours</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select className="w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">Toutes les catégories</option>
                {documentCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <Card>
              <CardBody className="p-0">
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{doc.displayName}</p>
                        <p className="text-xs text-slate-400">
                          <Link to={`/courses/${doc.courseId}`} className="text-accent-600 hover:underline">
                            {courseName(doc.courseId)}
                          </Link>
                          {' · '}
                          {categoryName(doc.categoryId)} · {formatSize(doc.size)} ·{' '}
                          {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge tone="neutral">{doc.mimeType.split('/')[1]?.toUpperCase() ?? 'Fichier'}</Badge>
                        <Button size="sm" variant="ghost" icon={<Download size={14} />} onClick={() => void handleDownload(doc)} />
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Pencil size={14} />}
                          onClick={() => navigate(`/courses/${doc.courseId}`)}
                        />
                        <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setDeleting(doc)} />
                      </div>
                    </li>
                  ))}
                  {filtered.length === 0 && (
                    <li className="px-4 py-6 text-center text-sm text-slate-400">Aucun document ne correspond aux filtres.</li>
                  )}
                </ul>
              </CardBody>
            </Card>
          </>
        )}
      </DataBoundary>

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
