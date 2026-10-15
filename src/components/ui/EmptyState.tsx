import type { ReactNode } from 'react'
import { Button } from './Button'

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-700">
      {icon && <div className="text-slate-300 dark:text-slate-600">{icon}</div>}
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
