import re

# 1. Patch src/app/page.tsx
with open('src/app/page.tsx', 'r') as f:
    content = f.read()

# Add loading state
if "const [isLoading, setIsLoading] = useState(true);" not in content:
    content = content.replace("const [manhwas, setManhwas] = useState<Manhwa[]>([]);", "const [manhwas, setManhwas] = useState<Manhwa[]>([]);\n  const [isLoading, setIsLoading] = useState(true);")

# Update useEffect to set loading to false
fetch_block_old = """    // Fetch real manhwas
    supabase.from('manhwas').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setManhwas(data);
    });"""
fetch_block_new = """    // Fetch real manhwas
    supabase.from('manhwas').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setManhwas(data);
      setIsLoading(false);
    });"""
content = content.replace(fetch_block_old, fetch_block_new)

# Update the manhwas rendering
render_old = """                {manhwas.length === 0 && (
                  <p className="text-white/40 col-span-3 text-center py-8">No hay manhwas disponibles aún.</p>
                )}"""
render_new = """                {isLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={`skel-${i}`} className="animate-pulse bg-white/5 rounded-xl h-64 border border-white/5"></div>
                  ))
                ) : manhwas.length === 0 ? (
                  <p className="text-white/40 col-span-3 text-center py-8">No hay manhwas disponibles aún.</p>
                ) : null}"""
content = content.replace(render_old, render_new)

with open('src/app/page.tsx', 'w') as f:
    f.write(content)

# 2. Patch src/app/manga/[id]/page.tsx
with open('src/app/manga/[id]/page.tsx', 'r') as f:
    content2 = f.read()

chapters_render_old = """            {chapters.length === 0 ? (
              <div className="p-12 text-center text-[#777782]">
                Aún no hay capítulos publicados para este manhwa.
              </div>
            ) : ("""
chapters_render_new = """            {loading ? (
              <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-[#a855f7] animate-spin" /></div>
            ) : chapters.length === 0 ? (
              <div className="p-12 text-center text-[#777782]">
                Aún no hay capítulos publicados para este manhwa.
              </div>
            ) : ("""
content2 = content2.replace(chapters_render_old, chapters_render_new)

with open('src/app/manga/[id]/page.tsx', 'w') as f:
    f.write(content2)

print("Patched correctly.")
