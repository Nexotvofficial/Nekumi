import re

with open('src/app/manga/[id]/page.tsx', 'r') as f:
    content = f.read()

# Make it a Grid and increase pagination to 100 per page to match the new compact layout!
content = content.replace("const chaptersPerPage = 50;", "const chaptersPerPage = 100;")

render_old = """              <div className="flex flex-col">
                <ul className="divide-y divide-white/5">
                  {[...chapters]
                    .sort((a, b) => sortDesc ? b.chapter_number - a.chapter_number : a.chapter_number - b.chapter_number)
                    .slice((chapterPage - 1) * chaptersPerPage, chapterPage * chaptersPerPage)
                    .map((chapter) => (
                  <li key={chapter.id}>
                    <Link 
                      href={`/manga/${id}/chapter/${chapter.id}`}
                      className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#a855f7]/50 transition-colors">
                          <span className="font-bold text-white">{chapter.chapter_number}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-[#c084fc] transition-colors">
                            Capítulo {chapter.chapter_number}
                            {chapter.title && <span className="text-white/60 ml-2 font-normal">- {chapter.title}</span>}
                          </p>
                          <p className="text-white/40 text-sm flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(chapter.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#a855f7] transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>"""

render_new = """              <div className="flex flex-col">
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
                </div>"""

content = content.replace(render_old, render_new)

with open('src/app/manga/[id]/page.tsx', 'w') as f:
    f.write(content)
print("Patched grid.")
