import ClientPage from "./ClientPage";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL_DEFAULT, SUPABASE_ANON_KEY_DEFAULT } from "@/lib/supabase";

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

    if (!manhwa) return { title: "Obra no encontrada | Nekumi" };

    const safeDesc = (manhwa.description || `Lee ${manhwa.title} online en español con la mejor calidad en Nekumi.`).slice(0, 155);
    const images = manhwa.cover_url ? [manhwa.cover_url] : [];

    return {
      title: `${manhwa.title} — Leer Online | Nekumi`,
      description: safeDesc,
      openGraph: {
        title: `${manhwa.title} — Leer Online | Nekumi`,
        description: safeDesc,
        images,
      },
      twitter: {
        card: "summary_large_image",
        title: `${manhwa.title} | Nekumi`,
        description: safeDesc,
        images,
      },
    };
  } catch {
    return { title: "Leer Online | Nekumi" };
  }
}

export default async function MangaDetailServer({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return <ClientPage />;
}
