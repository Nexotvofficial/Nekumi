import re

with open('src/app/manga/[id]/page.tsx', 'r') as f:
    content = f.read()

# 1. Add pagination state
if "const [chapterPage, setChapterPage] = useState(1);" not in content:
    content = content.replace("const [sortDesc, setSortDesc] = useState(true);", "const [sortDesc, setSortDesc] = useState(true);\n  const [chapterPage, setChapterPage] = useState(1);\n  const chaptersPerPage = 50;")

# 2. Reset page when sorting changes
content = content.replace("onClick={() => setSortDesc(!sortDesc)}", "onClick={() => { setSortDesc(!sortDesc); setChapterPage(1); }}")

# 3. Modify chapter rendering to use slice and add pagination controls
render_old = """              <ul className="divide-y divide-white/5">
                {[...chapters].sort((a, b) => sortDesc ? b.chapter_number - a.chapter_number : a.chapter_number - b.chapter_number).map((chapter) => ("""

render_new = """              <div className="flex flex-col">
                <ul className="divide-y divide-white/5">
                  {[...chapters]
                    .sort((a, b) => sortDesc ? b.chapter_number - a.chapter_number : a.chapter_number - b.chapter_number)
                    .slice((chapterPage - 1) * chaptersPerPage, chapterPage * chaptersPerPage)
                    .map((chapter) => ("""

content = content.replace(render_old, render_new)

# Add pagination controls after the list
controls_old = """                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#a855f7] transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>"""

controls_new = """                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#a855f7] transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
              
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
        </div>"""

content = content.replace(controls_old, controls_new)

with open('src/app/manga/[id]/page.tsx', 'w') as f:
    f.write(content)
print("Patched pagination.")
