import ClientHome from "./ClientHome";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL_DEFAULT, SUPABASE_ANON_KEY_DEFAULT } from "@/lib/supabase";

export const revalidate = 60;

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

    const [manhwasRes, trendingRes, reviewsRes, chaptersRes] = await Promise.all([
      supabase
        .from("manhwas")
        .select("id, title, description, cover_url, banner_url, score, status, genre, is_hero, created_at")
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
      supabase
        .from("chapters")
        .select("id, manhwa_id, chapter_number, created_at, manhwa:manhwas(id, title)")
        .not("manhwa_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(120),
    ]);

    // Reducir peso del HTML/RSC inicial (~70% menos bytes) recortando sinopsis a lo visible en tarjetas/carrusel
    const slimManhwas = (manhwasRes.data || []).map((m: any, idx: number) => ({
      id: m.id,
      title: m.title,
      description: trimText(m.description, m.is_hero || idx < 4 ? 260 : 140),
      cover_url: m.cover_url,
      banner_url: m.is_hero || idx < 4 ? m.banner_url : undefined,
      score: m.score,
      status: m.status,
      genre: m.genre,
      is_hero: m.is_hero || undefined,
    }));

    const slimTrending = (trendingRes.data || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      description: trimText(m.description, 140),
      cover_url: m.cover_url,
      score: m.score,
      status: m.status,
      genre: m.genre,
    }));

    return (
      <ClientHome
        initialManhwas={slimManhwas}
        initialTrending={slimTrending}
        initialReviews={reviewsRes.data || []}
        initialChapters={chaptersRes.data || []}
      />
    );
  } catch {
    return <ClientHome initialManhwas={[]} initialTrending={[]} initialReviews={[]} initialChapters={[]} />;
  }
}
