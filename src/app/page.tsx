import ClientHome from "./ClientHome";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL_DEFAULT, SUPABASE_ANON_KEY_DEFAULT, normalizeCdnUrl } from "@/lib/supabase";

export const revalidate = 30;

export const metadata = {
  title: "Nekutoon — Leer Manhwas y Webtoons Online en Español",
  description:
    "Lee tus manhwas, webtoons y mangas favoritos en línea con la mejor calidad y velocidad en español en Nekutoon.",
};

function trimText(str: string | null | undefined, maxLen: number): string {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + "…";
}

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_DEFAULT;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_DEFAULT;

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const [manhwasRes, trendingRes, reviewsRes] = await Promise.all([
      supabase
        .from("manhwas")
        .select("id, title, description, cover_url, banner_url, score, status, genre, is_hero, created_at, chapters(id, chapter_number, created_at)")
        .order("chapter_number", { referencedTable: "chapters", ascending: false })
        .limit(2, { referencedTable: "chapters" })
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("manhwas")
        .select("id, title, description, cover_url, banner_url, score, status, genre, is_hero")
        .not("genre", "ilike", "%+18%")
        .order("score", { ascending: false })
        .limit(6),
      supabase
        .from("reviews")
        .select("id, manhwa_id, user_id, user_email, avatar_url, rating, content, created_at, manhwas(title, cover_url)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const validManhwas = (manhwasRes.data || []).filter(
      (m: any) => Array.isArray(m.chapters) && m.chapters.length > 0
    );

    // Extraer los 2 últimos capítulos de cada obra y ordenarlos por fecha real de publicación
    const distinctRecentChapters = validManhwas
      .flatMap((m: any) =>
        (m.chapters || []).map((ch: any) => ({
          id: ch.id,
          manhwa_id: m.id,
          chapter_number: ch.chapter_number,
          created_at: ch.created_at,
          manhwa: { id: m.id, title: m.title },
        }))
      )
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 60);

    // Reducir peso del HTML/RSC inicial (~70% menos bytes) recortando sinopsis a lo visible en tarjetas/carrusel
    const slimManhwas = validManhwas.map((m: any, idx: number) => ({
      id: m.id,
      title: m.title,
      description: trimText(m.description, m.is_hero || idx < 4 ? 260 : 140),
      cover_url: normalizeCdnUrl(m.cover_url),
      banner_url: m.is_hero || idx < 4 ? normalizeCdnUrl(m.banner_url) : undefined,
      score: m.score,
      status: m.status,
      genre: m.genre,
      is_hero: m.is_hero || undefined,
      latest_chapter: Number(m.chapters?.[0]?.chapter_number),
    }));

    const slimTrending = (trendingRes.data || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      description: trimText(m.description, 140),
      cover_url: normalizeCdnUrl(m.cover_url),
      score: m.score,
      status: m.status,
      genre: m.genre,
    }));

    return (
      <ClientHome
        initialManhwas={slimManhwas}
        initialTrending={slimTrending}
        initialReviews={reviewsRes.data || []}
        initialChapters={distinctRecentChapters}
      />
    );
  } catch {
    return <ClientHome initialManhwas={[]} initialTrending={[]} initialReviews={[]} initialChapters={[]} />;
  }
}
