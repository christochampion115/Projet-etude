import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** `true` si les variables d'environnement Supabase sont renseignées. */
export const isBackendConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let client: SupabaseClient | null = null

/**
 * Retourne le client Supabase partagé, ou `null` si le backend n'est pas
 * configuré (mode démonstration locale).
 *
 * Seule la clé publique "anon" est utilisée côté frontend : la sécurité
 * réelle repose sur les politiques Row Level Security définies côté base de
 * données (voir `supabase/migrations`).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isBackendConfigured) return null
  if (!client) {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string)
  }
  return client
}
