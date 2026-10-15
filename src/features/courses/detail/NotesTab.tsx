import { useState } from 'react'
import { NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDataStore } from '@/data/DataProvider'
import { NoteFormModal } from '@/features/notes/NoteFormModal'
import type { PersonalNote } from '@/types/domain'

export function NotesTab({ courseId, notes }: { courseId: string; notes: PersonalNote[] }) {
  const store = useDataStore()
  const [form, setForm] = useState<{ open: boolean; note?: PersonalNote } | null>(null)
  const [deleting, setDeleting] = useState<PersonalNote | null>(null)
  const sorted = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setForm({ open: true })}>
          Nouvelle note
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<NotebookPen size={24} />}
          title="Aucune note pour ce cours"
          actionLabel="Créer une note"
          onAction={() => setForm({ open: true })}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sorted.map((note) => (
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
                <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                  {note.content || 'Note vide.'}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Mis à jour le {new Date(note.updatedAt).toLocaleDateString('fr-FR')}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {form?.open && <NoteFormModal note={form.note} defaultCourseId={courseId} onClose={() => setForm(null)} />}
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
