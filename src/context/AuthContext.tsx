import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getSupabaseClient, isBackendConfigured } from '@/lib/supabase/client'
import type { AppUser } from '@/types/domain'

const DEMO_USER_KEY = 'etudes-suivi.demo-user-id'

function getOrCreateDemoUserId(): string {
  const existing = localStorage.getItem(DEMO_USER_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DEMO_USER_KEY, id)
  return id
}

interface AuthContextValue {
  user: AppUser | null
  isLoading: boolean
  isBackendConfigured: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isBackendConfigured) {
      setUser({ id: getOrCreateDemoUserId(), email: null, displayName: 'Utilisateur de démonstration', isDemo: true })
      setIsLoading(false)
      return
    }

    const client = getSupabaseClient()
    if (!client) {
      setIsLoading(false)
      return
    }

    client.auth.getSession().then(({ data }) => {
      const session = data.session
      setUser(
        session
          ? { id: session.user.id, email: session.user.email ?? null, displayName: session.user.email ?? null, isDemo: false }
          : null,
      )
      setIsLoading(false)
    })

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setUser(
        session
          ? { id: session.user.id, email: session.user.email ?? null, displayName: session.user.email ?? null, isDemo: false }
          : null,
      )
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isBackendConfigured,
      async signInWithPassword(email, password) {
        const client = getSupabaseClient()
        if (!client) return { error: 'Backend non configuré' }
        const { error } = await client.auth.signInWithPassword({ email, password })
        return { error: error?.message ?? null }
      },
      async signUpWithPassword(email, password) {
        const client = getSupabaseClient()
        if (!client) return { error: 'Backend non configuré' }
        const { error } = await client.auth.signUp({ email, password })
        return { error: error?.message ?? null }
      },
      async signOut() {
        const client = getSupabaseClient()
        if (client) await client.auth.signOut()
      },
    }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}
