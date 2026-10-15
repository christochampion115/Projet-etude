import { useState } from 'react'
import { GripVertical, ListTodo, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useDataStore } from '@/data/DataProvider'
import { computeProgramProgress } from '@/lib/selectors'
import { TopicFormModal } from '../TopicFormModal'
import type { CourseTopic } from '@/types/domain'

export function ProgramTab({ courseId, topics }: { courseId: string; topics: CourseTopic[] }) {
  const store = useDataStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CourseTopic | null>(null)
  const [deleting, setDeleting] = useState<CourseTopic | null>(null)
  const progress = computeProgramProgress(topics)
  const sorted = [...topics].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="max-w-xs flex-1">
          <ProgressBar percent={progress.percent} />
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setFormOpen(true)}>
          Ajouter un chapitre
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<ListTodo size={24} />}
          title="Programme non défini"
          description="Ajoutez les chapitres ou thèmes à étudier pour suivre votre progression."
          actionLabel="Ajouter un chapitre"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {sorted.map((topic) => (
            <li key={topic.id} className="flex items-center gap-3 px-4 py-3">
              <GripVertical size={14} className="text-slate-300" />
              <input
                type="checkbox"
                checked={topic.status === 'done'}
                onChange={(e) => void store.setTopicStatus(topic.id, e.target.checked ? 'done' : 'pending')}
                className="h-4 w-4 accent-accent-600"
              />
              <button className="flex-1 text-left" onClick={() => setEditing(topic)}>
                <p
                  className={`text-sm font-medium ${
                    topic.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {topic.title}
                </p>
                {topic.description && <p className="text-xs text-slate-400">{topic.description}</p>}
              </button>
              <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setDeleting(topic)} />
            </li>
          ))}
        </ul>
      )}

      {formOpen && <TopicFormModal courseId={courseId} onClose={() => setFormOpen(false)} />}
      {editing && <TopicFormModal courseId={courseId} topic={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={deleting !== null}
        title="Supprimer ce chapitre ?"
        description={`"${deleting?.title}" sera retiré du programme de ce cours.`}
        confirmLabel="Supprimer"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void store.deleteTopic(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}
