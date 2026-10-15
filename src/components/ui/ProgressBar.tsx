export function ProgressBar({
  percent,
  tone = 'accent',
  emptyLabel = 'Programme non défini',
}: {
  percent: number | null
  tone?: 'accent' | 'success' | 'warning'
  emptyLabel?: string
}) {
  const toneClass = {
    accent: 'bg-accent-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
  }[tone]

  if (percent === null) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800" />
        <span className="shrink-0 text-xs text-slate-400">{emptyLabel}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-medium text-slate-500 dark:text-slate-400">{percent}%</span>
    </div>
  )
}
