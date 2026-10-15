import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/** Protège les routes applicatives : redirige vers `/login` en mode backend si non authentifié. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading, isBackendConfigured } = useAuth()

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-sm text-slate-400">Chargement…</div>
  }

  if (!user && isBackendConfigured) return <Navigate to="/login" replace />

  return <>{children}</>
}
