import re

with open("src/app/manga/[id]/page.tsx", "r") as f:
    content = f.read()

# Fix the preload fn in page.tsx
old_preload = """
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

new_preload = """
  // 🚀 Telepathic Preload: Cargar datos e imágenes antes de que el usuario haga clic
  const handlePrefetch = async (chapter: any) => {
    if (typeof window === 'undefined') return;
    
    // Guardar la metadata del capitulo
    sessionStorage.setItem(`nekumi_chap_meta_${chapter.id}`, JSON.stringify(chapter));
    
    if (sessionStorage.getItem(`nekumi_chap_${chapter.id}`)) return; // Ya están las páginas en caché

    // Buscar páginas silenciosamente
    const { data } = await supabase
      .from("pages")
      .select("*")
      .eq("chapter_id", chapter.id)
      .order("page_number", { ascending: true });
      
    if (data && data.length > 0) {
      // Guardar en RAM/Session
      sessionStorage.setItem(`nekumi_chap_${chapter.id}`, JSON.stringify(data));
      // Forzar descarga de las primeras 3 imágenes al disco duro
      data.slice(0, 3).forEach(p => {
        const img = new Image();
        img.src = p.image_url;
      });
    }
  };
"""

content = content.replace(old_preload, new_preload)

# Update the handlers
content = content.replace('handlePrefetch(chapter.id)', 'handlePrefetch(chapter)')

with open("src/app/manga/[id]/page.tsx", "w") as f:
    f.write(content)


with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "r") as f:
    content2 = f.read()

# Fix cache logic in chapter reader
old_cache = """
      // 🚀 Telepathic Cache: Leer de la RAM instantáneamente si existe
      const cached = sessionStorage.getItem(`nekumi_chap_${chapterId}`);
      if (cached) {
        setPages(JSON.parse(cached));
        setLoading(false); // Render instantáneo
      }

      const { data: pData } = await supabase
"""

new_cache = """
      // 🚀 Telepathic Cache: Leer de la RAM instantáneamente si existe
      const cachedPages = sessionStorage.getItem(`nekumi_chap_${chapterId}`);
      const cachedMeta = sessionStorage.getItem(`nekumi_chap_meta_${chapterId}`);
      
      if (cachedPages && cachedMeta) {
        setPages(JSON.parse(cachedPages));
        setChapter(JSON.parse(cachedMeta));
        setLoading(false); // Render instantáneo absoluto sin esperar red
      }

      const { data: pData } = await supabase
"""

content2 = content2.replace(old_cache, new_cache)

with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "w") as f:
    f.write(content2)

print("Fixed cache to include chapter metadata")
