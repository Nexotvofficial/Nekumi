import ClientPage from './ClientPage';
import { createClient } from "@supabase/supabase-js";

// Necesitamos un cliente de supabase del lado del servidor limpio (sin auth) solo para metadatos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: manhwa } = await supabase
    .from("manhwas")
    .select("title, description, cover_url")
    .eq("id", id)
    .single();

  if (!manhwa) return { title: 'No encontrado | Nekutton' };

  const description = (manhwa.description || `Descubre ${manhwa.title} en Nekutton.`).slice(0, 150);
  const images = manhwa.cover_url ? [manhwa.cover_url] : undefined;

  return {
    title: `${manhwa.title} - Leer Online | Nekutton`,
    description,
    openGraph: {
      title: `${manhwa.title} - Leer Online | Nekutton`,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${manhwa.title} | Nekutton`,
      description,
      ...(images ? { images } : {}),
    }
  };
}

export default async function MangaDetailServer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // SSR pasa el control al cliente para todo el estado dinámico
  return <ClientPage />;
}
