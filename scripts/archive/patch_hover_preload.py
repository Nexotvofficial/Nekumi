import re

with open("src/app/manga/[id]/page.tsx", "r") as f:
    content = f.read()

# Add preload function
preload_fn = """
  // 🚀 Telepathic Preload: Cargar datos e imágenes antes de que el usuario haga clic
  const handlePrefetch = async (chapterId: string) => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(`nekumi_chap_${chapterId}`)) return; // Ya está en caché

    // Buscar páginas silenciosamente
    const { data } = await supabase
      .from("pages")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("page_number", { ascending: true });
      
    if (data && data.length > 0) {
      // Guardar en RAM/Session
      sessionStorage.setItem(`nekumi_chap_${chapterId}`, JSON.stringify(data));
      // Forzar descarga de las primeras 3 imágenes al disco duro
      data.slice(0, 3).forEach(p => {
        const img = new Image();
        img.src = p.image_url;
      });
    }
  };
"""

content = content.replace("const [reviews, setReviews] = useState<Review[]>([]);", "const [reviews, setReviews] = useState<Review[]>([]);\n" + preload_fn)

# Inject onMouseEnter and onTouchStart
content = content.replace('<Link \n                        key={chapter.id}', '<Link \n                        key={chapter.id}\n                        onMouseEnter={() => handlePrefetch(chapter.id)}\n                        onTouchStart={() => handlePrefetch(chapter.id)}')

with open("src/app/manga/[id]/page.tsx", "w") as f:
    f.write(content)

print("Patched page.tsx for preloading")

# Now patch chapter/[chapterId]/page.tsx to use sessionStorage
with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "r") as f:
    content2 = f.read()

cache_logic = """
      // 🚀 Telepathic Cache: Leer de la RAM instantáneamente si existe
      const cached = sessionStorage.getItem(`nekumi_chap_${chapterId}`);
      if (cached) {
        setPages(JSON.parse(cached));
        setLoading(false); // Render instantáneo
      }

      const { data: pData } = await supabase
"""

content2 = content2.replace('const { data: pData } = await supabase', cache_logic)

with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "w") as f:
    f.write(content2)

print("Patched chapter reader to use preloaded cache")
