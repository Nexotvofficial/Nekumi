import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL_DEFAULT, SUPABASE_ANON_KEY_DEFAULT } from "@/lib/supabase";

export const revalidate = 3600; // Actualiza el sitemap cada 1 hora en caché

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.nekutoon.com";

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_DEFAULT,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_DEFAULT
    );

    // Obtener todas las obras del catálogo
    const { data: manhwas } = await supabase
      .from("manhwas")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    const mangaUrls: MetadataRoute.Sitemap = (manhwas || []).map((manga) => ({
      url: `${baseUrl}/manga/${manga.id}`,
      lastModified: manga.created_at ? new Date(manga.created_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    }));

    // PostgREST limita cada consulta individual a 1000 filas; paginamos en bloques paralelos
    // para indexar los ~30,000+ capítulos reales sin quedarnos truncados en 1,000.
    const pageSize = 1000;
    const maxBatches = 45; // Hasta 45,000 capítulos (< límite de 50,000 URLs por sitemap de Google)
    const allChapters: { id: string; manhwa_id: string; created_at: string }[] = [];

    for (let groupStart = 0; groupStart < maxBatches; groupStart += 10) {
      const batchIndexes = Array.from({ length: Math.min(10, maxBatches - groupStart) }, (_, i) => groupStart + i);
      const results = await Promise.all(
        batchIndexes.map((idx) =>
          supabase
            .from("chapters")
            .select("id, manhwa_id, created_at")
            .not("manhwa_id", "is", null)
            .order("created_at", { ascending: false })
            .range(idx * pageSize, idx * pageSize + pageSize - 1)
        )
      );

      let reachedEnd = false;
      for (const res of results) {
        if (res.data && res.data.length > 0) {
          allChapters.push(...res.data);
          if (res.data.length < pageSize) reachedEnd = true;
        } else {
          reachedEnd = true;
        }
      }
      if (reachedEnd) break;
    }

    const chapterUrls: MetadataRoute.Sitemap = allChapters.map((chapter) => ({
      url: `${baseUrl}/manga/${chapter.manhwa_id}/chapter/${chapter.id}`,
      lastModified: chapter.created_at ? new Date(chapter.created_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1.0,
      },
      ...mangaUrls,
      ...chapterUrls,
    ];
  } catch {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1.0,
      },
    ];
  }
}
