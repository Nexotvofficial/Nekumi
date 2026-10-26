import os

with open("src/app/manga/[id]/ClientPage.tsx", "r") as f:
    content = f.read()

# Make sure it's a default export
content = content.replace("export default function MangaDetail(", "export default function ClientPage(")

with open("src/app/manga/[id]/ClientPage.tsx", "w") as f:
    f.write(content)

# Create the Server Component page.tsx
server_page = """import ClientPage from './ClientPage';
import { createClient } from "@supabase/supabase-js";

// Necesitamos un cliente de supabase del lado del servidor limpio (sin auth) solo para metadatos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: manhwa } = await supabase
    .from("manhwas")
    .select("title, description, cover_url")
    .eq("id", params.id)
    .single();

  if (!manhwa) return { title: 'No encontrado | Nekutoon' };

  return {
    title: `${manhwa.title} - Leer Online | Nekutoon`,
    description: manhwa.description.slice(0, 150) + '...',
    openGraph: {
      title: `${manhwa.title} - Leer Online | Nekutoon`,
      description: manhwa.description.slice(0, 150) + '...',
      images: [manhwa.cover_url],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${manhwa.title} | Nekutoon`,
      description: manhwa.description.slice(0, 150) + '...',
      images: [manhwa.cover_url],
    }
  };
}

export default function MangaDetailServer({ params }: { params: { id: string } }) {
  // SSR pasa el control al cliente para todo el estado dinámico
  return <ClientPage />;
}
"""

with open("src/app/manga/[id]/page.tsx", "w") as f:
    f.write(server_page)

print("SEO Refactor applied!")
