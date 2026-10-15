import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useDataStatus } from '@/data/DataProvider'

/** Affiche un état de chargement / erreur tant que les données ne sont pas prêtes. */
export function DataBoundary({ children }: { children: ReactNode }) {
  const { status, error } = useDataStatus()

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-400">
        <Loader2 size={16} className="animate-spin" /> Chargement des données…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center text-sm text-red-600 dark:text-red-400">
        <AlertTriangle size={20} />
        <p>Impossible de charger vos données{error ? ` : ${error}` : '.'}</p>
      </div>
    )
  }

  return <>{children}</>
}
