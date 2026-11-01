import ClientPage from "./ClientPage";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL_DEFAULT, SUPABASE_ANON_KEY_DEFAULT } from "@/lib/supabase";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_DEFAULT;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_DEFAULT;

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: manhwa } = await supabase
      .from("manhwas")
      .select("title, description, cover_url")
      .eq("id", id)
      .single();

    if (!manhwa) return { title: "Obra no encontrada | Nekutoon" };

    const safeDesc = (
      manhwa.description || `Lee ${manhwa.title} online en español con la mejor calidad en Nekutoon.`
    ).slice(0, 155);
    const images = manhwa.cover_url ? [manhwa.cover_url] : [];

    return {
      title: `${manhwa.title} — Leer Online | Nekutoon`,
      description: safeDesc,
      alternates: {
        canonical: `https://www.nekutoon.com/manga/${id}`,
      },
      openGraph: {
        title: `${manhwa.title} — Leer Online | Nekutoon`,
        description: safeDesc,
        url: `https://www.nekutoon.com/manga/${id}`,
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
    const [manhwaRes, chaptersRes, reviewsRes, candidatesRes] = await Promise.all([
      supabase.from("manhwas").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("chapters")
        .select("id, chapter_number, title, created_at")
        .eq("manhwa_id", id)
        .order("chapter_number", { ascending: false })
        .limit(1000),
      supabase
        .from("reviews")
        .select("*")
        .eq("manhwa_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("manhwas")
        .select("id, title, cover_url, genre, score, status")
        .neq("id", id)
        .order("score", { ascending: false })
        .limit(80),
    ]);

    const manhwa = manhwaRes.data;
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
          initialManhwa={manhwaRes.data || null}
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
