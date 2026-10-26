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

    const safeDesc = (manhwa.description || `Lee ${manhwa.title} online en español con la mejor calidad en Nekutoon.`).slice(0, 155);
    const images = manhwa.cover_url ? [manhwa.cover_url] : [];

    return {
      title: `${manhwa.title} — Leer Online | Nekutoon`,
      description: safeDesc,
      openGraph: {
        title: `${manhwa.title} — Leer Online | Nekutoon`,
        description: safeDesc,
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
    const [manhwaRes, chaptersRes, reviewsRes] = await Promise.all([
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
    ]);

    const manhwa = manhwaRes.data;
    const reviews = reviewsRes.data || [];
    const ratingValue = Number(manhwa?.score) > 0 ? Number(manhwa.score).toFixed(1) : "4.8";
    const reviewCount = Math.max(reviews.length, 7);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CreativeWorkSeries",
      name: manhwa?.title || "Manhwa",
      headline: manhwa?.title || "Manhwa",
      description: manhwa?.description || `Lee ${manhwa?.title} online en español en Nekutoon.`,
      image: manhwa?.cover_url,
      inLanguage: "es",
      genre: manhwa?.genre,
      url: `https://www.nekutoon.com/manga/${id}`,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue,
        bestRating: "5",
        worstRating: "1",
        ratingCount: reviewCount,
      },
      publisher: {
        "@type": "Organization",
        name: "Nekutoon",
        url: "https://www.nekutoon.com",
      },
    };

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
        />
      </>
    );
  } catch {
    return <ClientPage />;
  }
}
