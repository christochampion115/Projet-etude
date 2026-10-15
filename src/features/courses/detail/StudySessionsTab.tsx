import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { useDataStore } from '@/data/DataProvider'
import { formatMinutes, sumStudyMinutes } from '@/lib/selectors'
import { StudySessionFormModal } from '@/features/calendar/StudySessionFormModal'
import type { StudySession } from '@/types/domain'

export function StudySessionsTab({ courseId, sessions }: { courseId: string; sessions: StudySession[] }) {
  const store = useDataStore()
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<StudySession | null>(null)
  const sorted = [...sessions].sort((a, b) => b.startTime.localeCompare(a.startTime))
  const total = sumStudyMinutes(sessions)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Temps total consacré à ce cours : <span className="font-semibold">{formatMinutes(total)}</span>
        </p>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setFormOpen(true)}>
          Ajouter une séance
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="Aucune séance enregistrée" actionLabel="Ajouter une séance" onAction={() => setFormOpen(true)} />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {sorted.map((session) => (
            <li key={session.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {new Date(session.startTime).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                {session.notes && <p className="text-xs text-slate-400">{session.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={session.source === 'timer' ? 'accent' : 'neutral'}>
                  {session.source === 'timer' ? 'Minuteur' : 'Manuelle'}
                </Badge>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatMinutes(session.durationMinutes)}</span>
                <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setDeleting(session)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {formOpen && <StudySessionFormModal defaultCourseId={courseId} onClose={() => setFormOpen(false)} />}
      <ConfirmDialog
        open={deleting !== null}
        title="Supprimer cette séance ?"
        description="Cette séance d'étude sera définitivement supprimée."
        confirmLabel="Supprimer"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void store.deleteStudySession(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}
