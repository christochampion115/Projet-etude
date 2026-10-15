import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NotebookPen, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataBoundary } from '@/components/layout/DataBoundary'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDataStore, useSnapshot } from '@/data/DataProvider'
import { NoteFormModal } from './NoteFormModal'
import type { PersonalNote } from '@/types/domain'

export function NotesPage() {
  const store = useDataStore()
  const { notes, courses } = useSnapshot()
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<{ open: boolean; note?: PersonalNote } | null>(null)
  const [deleting, setDeleting] = useState<PersonalNote | null>(null)

  const courseName = (id: string | null) => (id ? courses.find((c) => c.id === id)?.name : null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return notes
      .filter((n) => !term || n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [notes, search])

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Notes personnelles générales ou associées à un cours."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setForm({ open: true })}>
            Nouvelle note
          </Button>
        }
      />
      <DataBoundary>
        {notes.length === 0 ? (
          <EmptyState
            icon={<NotebookPen size={24} />}
            title="Aucune note"
            description="Créez votre première note, générale ou liée à un cours."
            actionLabel="Créer une note"
            onAction={() => setForm({ open: true })}
          />
        ) : (
          <>
            <div className="relative mb-4 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher dans les notes…"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((note) => (
                <Card key={note.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-slate-800 dark:text-slate-100">{note.title}</h4>
                      <div className="flex shrink-0 gap-1">
                        <button onClick={() => setForm({ open: true, note })} aria-label="Modifier">
                          <Pencil size={14} className="text-slate-400 hover:text-accent-600" />
                        </button>
                        <button onClick={() => setDeleting(note)} aria-label="Supprimer">
                          <Trash2 size={14} className="text-slate-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                    {courseName(note.courseId) && (
                      <Link to={`/courses/${note.courseId}`} className="text-xs text-accent-600 hover:underline">
                        {courseName(note.courseId)}
                      </Link>
                    )}
                    <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                      {note.content || 'Note vide.'}
                    </p>
                  </CardBody>
                </Card>
              ))}
              {filtered.length === 0 && <p className="text-sm text-slate-400">Aucune note ne correspond à votre recherche.</p>}
            </div>
          </>
        )}
      </DataBoundary>

      {form?.open && <NoteFormModal note={form.note} onClose={() => setForm(null)} />}
      <ConfirmDialog
        open={deleting !== null}
        title="Supprimer cette note ?"
        description={`"${deleting?.title}" sera définitivement supprimée.`}
        confirmLabel="Supprimer"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void store.deleteNote(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}
