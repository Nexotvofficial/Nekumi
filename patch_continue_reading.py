import re

with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "r") as f:
    chapter_content = f.read()

# Add saving logic to chapter reader
bookmark_logic = """
      if (cData) {
        setChapter(cData);
        // 🚀 Auto-Bookmark: Guardar progreso automáticamente
        if (typeof window !== 'undefined') {
          localStorage.setItem(`nekumi_last_read_${manhwaId}`, chapterId);
          localStorage.setItem(`nekumi_last_read_num_${manhwaId}`, cData.chapter_number.toString());
        }
      }
"""
chapter_content = chapter_content.replace('if (cData) setChapter(cData);', bookmark_logic)

with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "w") as f:
    f.write(chapter_content)


with open("src/app/manga/[id]/ClientPage.tsx", "r") as f:
    client_content = f.read()

# Add reading logic to ClientPage
state_logic = "const [lastReadChapter, setLastReadChapter] = useState<{id: string, num: string} | null>(null);"
client_content = client_content.replace("const [isFavorite, setIsFavorite] = useState(false);", "const [isFavorite, setIsFavorite] = useState(false);\n  " + state_logic)

effect_logic = """
    // Cargar bookmark
    if (typeof window !== 'undefined') {
      const lastId = localStorage.getItem(`nekumi_last_read_${id}`);
      const lastNum = localStorage.getItem(`nekumi_last_read_num_${id}`);
      if (lastId && lastNum) {
        setLastReadChapter({ id: lastId, num: lastNum });
      }
    }
"""
client_content = client_content.replace('if (id) loadData();', effect_logic + '\n    if (id) loadData();')

# Add the UI button above the chapter list
button_ui = """
              {/* Botón Continuar Leyendo */}
              {lastReadChapter && (
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#a855f7]/10 to-transparent">
                  <Link href={`/manga/${id}/chapter/${lastReadChapter.id}`} className="flex items-center justify-between bg-[#a855f7] text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-[1.02] transition-transform">
                    <span className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Continuar Leyendo (Cap. {lastReadChapter.num})</span>
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              )}
"""
client_content = client_content.replace('<div className="p-6 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">', button_ui + '\n              <div className="p-6 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">')

with open("src/app/manga/[id]/ClientPage.tsx", "w") as f:
    f.write(client_content)

print("Continuar Leyendo feature applied!")
