import ClientHome from "./ClientHome";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 60;

export const metadata = {
  title: "Nekumi — Leer Manhwas y Webtoons Online",
  description: "Lee tus manhwas, webtoons y mangas favoritos en línea con la mejor calidad y velocidad en español.",
};

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return <ClientHome initialManhwas={[]} initialTrending={[]} initialReviews={[]} />;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const [manhwasRes, trendingRes, reviewsRes] = await Promise.all([
      supabase.from("manhwas").select("*").order("created_at", { ascending: false }),
      supabase.from("manhwas").select("*").order("score", { ascending: false }).limit(6),
      supabase.from("reviews").select("*, manhwas(title, cover_url)").order("created_at", { ascending: false }).limit(5),
    ]);

    return (
      <ClientHome
        initialManhwas={manhwasRes.data || []}
        initialTrending={trendingRes.data || []}
        initialReviews={reviewsRes.data || []}
      />
    );
  } catch {
    return <ClientHome initialManhwas={[]} initialTrending={[]} initialReviews={[]} />;
  }
}
