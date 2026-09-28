import ClientHome from './ClientHome';
import { createClient } from "@supabase/supabase-js";

// Necesitamos un cliente de supabase del lado del servidor limpio (sin auth)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }
});

export const metadata = {
  title: 'Nekutoon | Leer Manhwas Online',
  description: 'Lee tus manhwas favoritos en línea con la mejor calidad.',
};

export default async function HomePage() {
  // SSR: Extraer datos en el servidor instantáneamente antes de renderizar
  const [manhwasRes, trendingRes, reviewsRes] = await Promise.all([
    supabase.from("manhwas").select("*").order("created_at", { ascending: false }).limit(24),
    supabase.from("manhwas").select("*").order("views", { ascending: false }).limit(6),
    supabase.from("reviews").select("*, manhwas(title, cover_url)").order("created_at", { ascending: false }).limit(5)
  ]);

  return <ClientHome 
    initialManhwas={manhwasRes.data || []} 
    initialTrending={trendingRes.data || []} 
    initialReviews={reviewsRes.data || []} 
  />;
}
