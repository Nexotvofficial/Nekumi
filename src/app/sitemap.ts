import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.nekutoon.com'

  // Cliente Supabase básico para lectura pública
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Obtener todos los IDs de los manhwas
  const { data: manhwas } = await supabase
    .from('manhwas')
    .select('id, created_at')

  const mangaUrls: MetadataRoute.Sitemap = (manhwas || []).map((manga) => ({
    url: `${baseUrl}/manga/${manga.id}`,
    lastModified: new Date(manga.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...mangaUrls,
  ]
}
