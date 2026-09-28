import re

with open("src/app/ClientHome.tsx", "r") as f:
    content = f.read()

# Replace export default function Home()
content = content.replace(
    "export default function Home() {", 
    "export default function Home({ initialManhwas = [], initialTrending = [], initialReviews = [] }: any) {"
)

# Replace initial states
content = content.replace(
    "const [manhwas, setManhwas] = useState<Manhwa[]>([]);",
    "const [manhwas, setManhwas] = useState<Manhwa[]>(initialManhwas);"
)
content = content.replace(
    "const [trending, setTrending] = useState<Manhwa[]>([]);",
    "const [trending, setTrending] = useState<Manhwa[]>(initialTrending);"
)
content = content.replace(
    "const [recentReviews, setRecentReviews] = useState<any[]>([]);",
    "const [recentReviews, setRecentReviews] = useState<any[]>(initialReviews);"
)
content = content.replace(
    "const [isLoading, setIsLoading] = useState(true);",
    "const [isLoading, setIsLoading] = useState(initialManhwas.length === 0);"
)

with open("src/app/ClientHome.tsx", "w") as f:
    f.write(content)

# Create new Server Component page.tsx
server_page = """import ClientHome from './ClientHome';
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
"""

with open("src/app/page.tsx", "w") as f:
    f.write(server_page)

print("Homepage Server Component Refactor applied!")
