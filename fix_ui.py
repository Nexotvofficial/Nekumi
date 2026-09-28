import re

with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "r") as f:
    content = f.read()

# Make sure autoScroll works on the main window by using requestAnimationFrame for smoother scrolling
new_effect = """
  // 🍿 Auto-Scroll Suave y Preciso
  useEffect(() => {
    if (!autoScroll || readMode === 'paged') return;
    
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const scrollLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      // Scroll speed: 1 = ~60px/s, 2 = ~120px/s, 3 = ~180px/s
      const pixelsToScroll = (scrollSpeed * 60 * deltaTime) / 1000;
      
      window.scrollBy({ top: pixelsToScroll, left: 0, behavior: 'instant' });
      lastTime = currentTime;
      animationFrameId = requestAnimationFrame(scrollLoop);
    };
    
    animationFrameId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [autoScroll, scrollSpeed, readMode]);
"""

old_effect = re.search(r'// 🍿 Auto-Scroll[\s\S]*?}, \[autoScroll, scrollSpeed, readMode\]\);', content)
if old_effect:
    content = content.replace(old_effect.group(0), new_effect.strip())


# Fix the UI of the Settings Dropdown to match Nekumi Glassmorphism
old_dropdown = re.search(r'\{/\* Settings Dropdown \*/\}[\s\S]*?</div>\n          \)}', content)

new_dropdown = """
          {/* Settings Dropdown - Nekumi Glassmorphism */}
          {showSettings && (
            <div className="absolute right-0 top-14 mt-2 w-64 bg-[#0a0a0c]/95 backdrop-blur-2xl border border-[#a855f7]/30 rounded-2xl shadow-[0_10px_40px_rgba(168,85,247,0.15)] overflow-hidden z-50 transform origin-top-right transition-all">
              <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-transparent to-[#a855f7]/5">
                <p className="text-[11px] font-black text-[#a855f7] uppercase tracking-widest">Modo de Lectura</p>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => toggleReadMode("cascade")}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left rounded-xl transition-all duration-300 ${readMode === 'cascade' ? 'bg-[#a855f7]/20 text-white font-bold shadow-inner' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                  <MonitorDown className={`w-4 h-4 ${readMode === 'cascade' ? 'text-[#a855f7]' : 'text-white/50'}`} /> Cascada (Webtoon)
                </button>
                <button 
                  onClick={() => toggleReadMode("paged")}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left rounded-xl transition-all duration-300 ${readMode === 'paged' ? 'bg-[#a855f7]/20 text-white font-bold shadow-inner' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                  <BookOpen className={`w-4 h-4 ${readMode === 'paged' ? 'text-[#a855f7]' : 'text-white/50'}`} /> Paginado (Manga)
                </button>
              </div>

              <div className="px-5 py-4 border-t border-white/5 bg-gradient-to-r from-transparent to-[#a855f7]/5">
                <p className="text-[11px] font-black text-[#a855f7] uppercase tracking-widest mb-3">Manos Libres</p>
                {readMode === 'paged' ? (
                  <p className="text-xs text-white/40 italic">Auto-scroll solo funciona en modo Cascada.</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setAutoScroll(!autoScroll)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${autoScroll ? 'bg-gradient-to-r from-[#a855f7] to-[#c084fc] text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-[1.02]' : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10'}`}
                    >
                      {autoScroll ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      {autoScroll ? 'Pausar' : 'Iniciar'}
                    </button>
                    {autoScroll && (
                      <button 
                        onClick={() => setScrollSpeed(s => s >= 3 ? 1 : s + 1)}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-[#a855f7]/30 border border-[#a855f7]/30 text-white text-sm font-black flex items-center gap-1 transition-colors shadow-inner"
                      >
                        <FastForward className="w-4 h-4 text-[#a855f7]" /> x{scrollSpeed}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
"""
if old_dropdown:
    content = content.replace(old_dropdown.group(0), new_dropdown.strip())

with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "w") as f:
    f.write(content)

print("UI Fixed!")
