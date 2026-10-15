import { NavLink } from 'react-router-dom'
import {
  BookOpen,
  CalendarDays,
  FileText,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Settings,
  BarChart3,
  GraduationCap,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', label: "Vue d'ensemble", icon: LayoutDashboard },
  { to: '/courses', label: 'Mes cours', icon: BookOpen },
  { to: '/calendar', label: 'Calendrier', icon: CalendarDays },
  { to: '/tasks', label: 'Tâches et examens', icon: ListChecks },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/statistics', label: 'Statistiques', icon: BarChart3 },
  { to: '/settings', label: 'Paramètres', icon: Settings },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-600 text-white">
          <GraduationCap size={18} />
        </span>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Suivi d'études</span>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-200'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
