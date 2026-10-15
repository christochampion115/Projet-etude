import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AppDataStore, type DataStatus } from './store'
import type { RepositorySnapshot } from '@/lib/repositories/types'

const DataStoreContext = createContext<AppDataStore | null>(null)

/**
 * Charge les données de l'utilisateur courant dans le store applicatif et le
 * rend disponible à toute l'application via le contexte React.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [store] = useState(() => new AppDataStore())

  useEffect(() => {
    if (user) void store.load(user.id)
  }, [user, store])

  return <DataStoreContext.Provider value={store}>{children}</DataStoreContext.Provider>
}

export function useDataStore(): AppDataStore {
  const store = useContext(DataStoreContext)
  if (!store) throw new Error('useDataStore doit être utilisé dans un DataProvider')
  return store
}

/** Sélectionne une tranche réactive de l'état du store (re-render à chaque changement). */
export function useStoreSelector<T>(selector: (store: AppDataStore) => T): T {
  const store = useDataStore()
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store),
    () => selector(store),
  )
}

/** Instantané complet et réactif des données chargées. */
export function useSnapshot(): RepositorySnapshot {
  return useStoreSelector((store) => store.getSnapshot())
}

/** État de chargement réactif (`idle` | `loading` | `ready` | `error`). */
export function useDataStatus(): { status: DataStatus; error: string | null } {
  const store = useDataStore()
  const status = useSyncExternalStore(store.subscribe, () => store.getStatus(), () => store.getStatus())
  const error = useSyncExternalStore(store.subscribe, () => store.getError(), () => store.getError())
  return { status, error }
}
