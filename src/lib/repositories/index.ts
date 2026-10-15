import { createDemoRepository } from './demoRepository'
import { createSupabaseRepository } from './supabaseRepository'
import { getSupabaseClient, isBackendConfigured } from '@/lib/supabase/client'
import type { Repository } from './types'

let cached: Repository | null = null

/** Retourne le repository actif (Supabase si configuré, sinon démo locale), mis en cache. */
export function getRepository(): Repository {
  if (cached) return cached
  const client = getSupabaseClient()
  cached = client ? createSupabaseRepository(client) : createDemoRepository()
  return cached
}

export { isBackendConfigured }
export type { Repository, RepositorySnapshot } from './types'
