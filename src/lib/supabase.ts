import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL_DEFAULT = 'https://nfuvrtlhkvprjpzeepim.supabase.co'
export const SUPABASE_ANON_KEY_DEFAULT = 'sb_publishable_D9l3Eiua6vsGynEcFvH4_A_yahuuJNR'

let browserClient: SupabaseClient | undefined

export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_DEFAULT
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_DEFAULT

  if (typeof window === 'undefined') {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  return browserClient
}
