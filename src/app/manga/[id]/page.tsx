import ClientPage from "./ClientPage";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL_DEFAULT, SUPABASE_ANON_KEY_DEFAULT } from "@/lib/supabase";

export const revalidate = 30;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function slugifyTitle(t: string): string {
  return (t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolveManhwaRecord(supabase: any, idOrSlug: string) {
  const decoded = decodeURIComponent(idOrSlug || "").trim();
  const maybeUuid = decoded.slice(0, 36);
  if (UUID_RE.test(maybeUuid)) {
    const { data } = await supabase.from("manhwas").select("*").eq("id", maybeUuid).maybeSingle();
    if (data) return data;
  }
  const targetSlug = slugifyTitle(decoded);
  if (!targetSlug) return null;
  const { data: list } = await supabase.from("manhwas").select("*").limit(1500);
  if (!list) return null;
  return (
    list.find((m: any) => slugifyTitle(m.title) === targetSlug) ||
    list.find((m: any) => slugifyTitle(m.title).includes(targetSlug)) ||
    null
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_DEFAULT;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_DEFAULT;

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const manhwa = await resolveManhwaRecord(supabase, id);

    if (!manhwa) return { title: "Obra no encontrada | Nekutoon" };

    const canonicalId = manhwa.id;
    const safeDesc = (
      manhwa.description || `Lee ${manhwa.title} online en español con la mejor calidad en Nekutoon.`
    ).slice(0, 155);
    const images = manhwa.cover_url ? [manhwa.cover_url] : [];

    return {
      title: `${manhwa.title} — Leer Online | Nekutoon`,
      description: safeDesc,
      alternates: {
        canonical: `https://www.nekutoon.com/manga/${canonicalId}`,
      },
      openGraph: {
        title: `${manhwa.title} — Leer Online | Nekutoon`,
        description: safeDesc,
        url: `https://www.nekutoon.com/manga/${canonicalId}`,
        images,
      },
      twitter: {
        card: "summary_large_image",
        title: `${manhwa.title} | Nekutoon`,
        description: safeDesc,
        images,
      },
    };
  } catch {
    return { title: "Leer Online | Nekutoon" };
  }
}

export default async function MangaDetailServer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_DEFAULT;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_DEFAULT;

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const resolvedManhwa = await resolveManhwaRecord(supabase, id);
    const realId = resolvedManhwa?.id || id;

    const [chaptersRes, reviewsRes, candidatesRes] = await Promise.all([
      supabase
        .from("chapters")
        .select("id, chapter_number, title, created_at")
        .eq("manhwa_id", realId)
        .order("chapter_number", { ascending: false })
        .limit(1000),
      supabase
        .from("reviews")
        .select("*")
        .eq("manhwa_id", realId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("manhwas")
        .select("id, title, cover_url, genre, score, status")
        .neq("id", realId)
        .order("score", { ascending: false })
        .limit(80),
    ]);

    const manhwa = resolvedManhwa;
    const reviews = reviewsRes.data || [];

    // Calcular hasta 6 obras similares por coincidencia de géneros (respetando filtro +18)
    const targetGenres = (manhwa?.genre || "")
      .split(",")
      .map((g: string) => g.trim().toLowerCase())
      .filter(Boolean);
    const isTargetAdult = targetGenres.includes("+18");

    const relatedManhwas = (candidatesRes.data || [])
      .filter((c: any) => {
        const cGenres = (c.genre || "").toLowerCase();
        if (!isTargetAdult && cGenres.includes("+18")) return false;
        return true;
      })
      .map((c: any) => {
        const cGenres = (c.genre || "")
          .split(",")
          .map((g: string) => g.trim().toLowerCase())
          .filter(Boolean);
        const overlap = cGenres.filter((g: string) => targetGenres.includes(g)).length;
        return { item: c, rankScore: overlap * 10 + (Number(c.score) || 0) };
      })
      .sort((a, b) => b.rankScore - a.rankScore)
      .slice(0, 6)
      .map((x) => x.item);

    const ratingValue = Number(manhwa?.score) > 0 ? Number(manhwa.score).toFixed(1) : "4.8";
    const reviewCount = Math.max(reviews.length, 1);

    const jsonLd: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "CreativeWorkSeries",
      name: manhwa?.title || "Manhwa",
      headline: manhwa?.title || "Manhwa",
      description: manhwa?.description || `Lee ${manhwa?.title} online en español en Nekutoon.`,
      image: manhwa?.cover_url,
      inLanguage: "es",
      genre: manhwa?.genre,
      url: `https://www.nekutoon.com/manga/${id}`,
      publisher: {
        "@type": "Organization",
        name: "Nekutoon",
        url: "https://www.nekutoon.com",
      },
    };

    if (Number(manhwa?.score) > 0 || reviews.length > 0) {
      jsonLd.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue,
        bestRating: "5",
        worstRating: "1",
        ratingCount: reviewCount,
      };
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ClientPage
          initialManhwa={manhwa || null}
          initialChapters={chaptersRes.data || []}
          initialReviews={reviewsRes.data || []}
          initialRelated={relatedManhwas}
        />
      </>
    );
  } catch {
    return <ClientPage />;
  }
}
