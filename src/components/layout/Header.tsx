import { Menu, Timer } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useFocusTimer } from '@/context/FocusTimerContext'
import { useSnapshot } from '@/data/DataProvider'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/Badge'

const TITLES: Record<string, string> = {
  '/dashboard': "Vue d'ensemble",
  '/courses': 'Mes cours',
  '/calendar': 'Calendrier',
  '/tasks': 'Tâches et examens',
  '/documents': 'Documents',
  '/notes': 'Notes',
  '/statistics': 'Statistiques',
  '/settings': 'Paramètres',
  '/focus': 'Minuteur de concentration',
}

function pageTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname]
  if (pathname.startsWith('/courses/')) return 'Fiche de cours'
  return 'Suivi d\u2019études'
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const location = useLocation()
  const { user } = useAuth()
  const { state, remainingMs } = useFocusTimer()
  const { courses } = useSnapshot()
  const activeCourse = courses.find((c) => c.id === state.courseId)

  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{pageTitle(location.pathname)}</h1>
      </div>
      <div className="flex items-center gap-3">
        {user?.isDemo && (
          <Badge tone="warning">Mode démonstration — données stockées uniquement sur cet appareil</Badge>
        )}
        <Link
          to="/focus"
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            state.status !== 'idle'
              ? 'border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-800 dark:bg-accent-900/40 dark:text-accent-200'
              : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Timer size={16} />
          {state.status === 'idle' ? (
            'Minuteur'
          ) : (
            <span>
              {formatCountdown(remainingMs)} · {state.phase === 'work' ? 'Travail' : 'Pause'}
              {activeCourse ? ` · ${activeCourse.name}` : ''}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
