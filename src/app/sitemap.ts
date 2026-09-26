import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600 // Actualiza el sitemap cada 1 hora en caché

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.nekutoon.com'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Obtener manhwas (límite alto para SEO)
  const { data: manhwas } = await supabase
    .from('manhwas')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(5000)

  const mangaUrls: MetadataRoute.Sitemap = (manhwas || []).map((manga) => ({
    url: `${baseUrl}/manga/${manga.id}`,
    lastModified: new Date(manga.created_at),
    changeFrequency: 'daily',
    priority: 0.9,
  }))

  // Obtener capítulos más recientes para que Google indexe los capítulos nuevos rápido
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, manhwa_id, created_at')
    .order('created_at', { ascending: false })
    .limit(40000)

  const chapterUrls: MetadataRoute.Sitemap = (chapters || []).map((chapter) => ({
    url: `${baseUrl}/manga/${chapter.manhwa_id}/chapter/${chapter.id}`,
    lastModified: new Date(chapter.created_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    ...mangaUrls,
    ...chapterUrls,
  ]
}
