import re

with open('src/app/manga/[id]/page.tsx', 'r') as f:
    content = f.read()

# We need to replace everything from {loading ? ... to the end of the chapters list.
start_str = "            {loading ? ("
end_str = "        {/* Reviews Section */}"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

new_block = """            {loading ? (
              <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-[#a855f7] animate-spin" /></div>
            ) : chapters.length === 0 ? (
              <div className="p-12 text-center text-[#777782]">
                Aún no hay capítulos publicados para este manhwa.
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {[...chapters]
                    .sort((a, b) => sortDesc ? b.chapter_number - a.chapter_number : a.chapter_number - b.chapter_number)
                    .slice((chapterPage - 1) * chaptersPerPage, chapterPage * chaptersPerPage)
                    .map((chapter) => (
                      <Link 
                        key={chapter.id}
                        href={`/manga/${id}/chapter/${chapter.id}`}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#a855f7]/50 hover:bg-[#a855f7]/10 transition-all group"
                      >
                        <span className="font-bold text-white/90 group-hover:text-white transition-colors">
                          Cap. {chapter.chapter_number}
                        </span>
                        <span className="text-[10px] text-white/40 mt-1">
                          {new Date(chapter.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    ))}
                </div>
                
                {chapters.length > chaptersPerPage && (
                  <div className="flex items-center justify-between p-6 border-t border-white/5 bg-[#0a0a0a]">
                    <button 
                      onClick={() => setChapterPage(p => Math.max(1, p - 1))}
                      disabled={chapterPage === 1}
                      className="px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors font-medium flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <span className="text-white/60 text-sm font-medium">
                      Página {chapterPage} de {Math.ceil(chapters.length / chaptersPerPage)}
                    </span>
                    <button 
                      onClick={() => setChapterPage(p => Math.min(Math.ceil(chapters.length / chaptersPerPage), p + 1))}
                      disabled={chapterPage === Math.ceil(chapters.length / chaptersPerPage)}
                      className="px-4 py-2 rounded-lg bg-[#a855f7]/20 text-[#c084fc] hover:bg-[#a855f7]/30 disabled:opacity-30 transition-colors font-medium flex items-center gap-2"
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

"""

content = content[:start_idx] + new_block + content[end_idx:]

with open('src/app/manga/[id]/page.tsx', 'w') as f:
    f.write(content)

print("Fixed syntax error.")
