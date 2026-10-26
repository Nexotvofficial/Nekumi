import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL_DEFAULT = 'https://nfuvrtlhkvprjpzeepim.supabase.co'
export const SUPABASE_ANON_KEY_DEFAULT = 'sb_publishable_beZGsE6z0k_E-9SRi2jDmw_gExM4Oh_'

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

export function getChapterShardId(chapterId: string): number {
  const cleanHex = chapterId.replace(/-/g, '').slice(0, 6)
  const num = parseInt(cleanHex, 16)
  if (Number.isNaN(num)) return 1000
  return 1000 + (num % 1024)
}

export interface PageRow {
  id: string
  page_number: number
  image_url: string
}

/**
 * Fetches chapter pages in ~100ms using the B-Tree primary key shard in `site_config`
 * (avoiding a 970k-row sequential scan on `pages`), with automatic fallback to `pages`.
 */
export async function fetchChapterPagesFast(
  supabase: SupabaseClient,
  chapterId: string
): Promise<PageRow[]> {
  try {
    const shardId = getChapterShardId(chapterId)
    const { data: shardRow } = await supabase
      .from('site_config')
      .select(`entry:category_images->${chapterId}`)
      .eq('id', shardId)
      .maybeSingle()

    const entry = (shardRow as any)?.entry
    if (entry && Array.isArray(entry.p) && entry.p.length > 0) {
      const base = typeof entry.b === 'string' ? entry.b : ''
      return entry.p.map((suffix: string, idx: number) => ({
        id: `${chapterId}_${idx + 1}`,
        page_number: idx + 1,
        image_url: base + suffix,
      }))
    }
  } catch {}

  // Fallback for chapters not yet in shard index
  const { data } = await supabase
    .from('pages')
    .select('id, page_number, image_url')
    .eq('chapter_id', chapterId)
    .limit(300)

  if (data && data.length > 0) {
    return [...data].sort((a, b) => (a.page_number || 0) - (b.page_number || 0))
  }

  return []
}

/**
 * Updates the fast B-Tree shard in `site_config` when new pages are added in /admin.
 */
export async function saveChapterPagesToShard(
  supabase: SupabaseClient,
  chapterId: string,
  imageUrls: string[]
): Promise<void> {
  if (!chapterId || imageUrls.length === 0) return
  try {
    const shardId = getChapterShardId(chapterId)
    const { data: existing } = await supabase
      .from('site_config')
      .select('category_images')
      .eq('id', shardId)
      .maybeSingle()

    const currentMap =
      existing?.category_images && typeof existing.category_images === 'object'
        ? { ...(existing.category_images as Record<string, any>) }
        : {}

    const firstSlash = imageUrls[0].lastIndexOf('/')
    let b = ''
    let p = imageUrls
    if (firstSlash !== -1) {
      const candidate = imageUrls[0].slice(0, firstSlash + 1)
      if (imageUrls.every((u) => u.startsWith(candidate))) {
        b = candidate
        p = imageUrls.map((u) => u.slice(candidate.length))
      }
    }

    currentMap[chapterId] = { b, p }
    await supabase.from('site_config').upsert({ id: shardId, category_images: currentMap })
  } catch {}
}
