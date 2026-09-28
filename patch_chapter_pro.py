with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "r") as f:
    content = f.read()

# Add Lucide icons for AutoScroll
content = content.replace('MonitorDown, BookOpen } from "lucide-react";', 'MonitorDown, BookOpen, Play, Pause, FastForward } from "lucide-react";')

# Add AutoScroll state
state_code = """
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const touchStartX = useRef(0);
"""
content = content.replace('const [readMode, setReadMode] = useState<"cascade" | "paged">("cascade");', 'const [readMode, setReadMode] = useState<"cascade" | "paged">("cascade");\n' + state_code)

# Add useEffects for AutoScroll and Keyboard
effect_code = """
  // 🍿 Auto-Scroll
  useEffect(() => {
    if (!autoScroll || readMode === 'paged') return;
    const scrollInterval = setInterval(() => {
      window.scrollBy({ top: scrollSpeed, left: 0, behavior: 'auto' });
    }, 16);
    return () => clearInterval(scrollInterval);
  }, [autoScroll, scrollSpeed, readMode]);

  // 🎮 Teclado Pro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd') {
        if (readMode === 'paged' && currentPageIndex < pages.length - 1) setCurrentPageIndex(p => p + 1);
        else if (nextChapter) router.push(`/manga/${manhwaId}/chapter/${nextChapter.id}`);
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (readMode === 'paged' && currentPageIndex > 0) setCurrentPageIndex(p => p - 1);
        else if (prevChapter) router.push(`/manga/${manhwaId}/chapter/${prevChapter.id}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextChapter, prevChapter, readMode, currentPageIndex, pages.length]);
"""
content = content.replace('// Handlers', effect_code + '\n  // Handlers')

# Add touch handlers to main container
content = content.replace('<div className="min-h-screen bg-[#0a0a0f]">', '<div className="min-h-screen bg-[#0a0a0f]" onTouchStart={(e) => touchStartX.current = e.changedTouches[0].screenX} onTouchEnd={(e) => { const endX = e.changedTouches[0].screenX; if (touchStartX.current - endX > 100) { if (readMode==="paged" && currentPageIndex < pages.length-1) setCurrentPageIndex(p=>p+1); else if (nextChapter) router.push(`/manga/${manhwaId}/chapter/${nextChapter.id}`); } else if (touchStartX.current - endX < -100) { if (readMode==="paged" && currentPageIndex > 0) setCurrentPageIndex(p=>p-1); else if (prevChapter) router.push(`/manga/${manhwaId}/chapter/${prevChapter.id}`); } }}>')

# Add AutoScroll to Settings Dropdown
settings_ui = """
              <div className="px-4 py-3 border-t border-white/5">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Lectura Manos Libres</p>
                {readMode === 'paged' ? (
                  <p className="text-[10px] text-white/30">Auto-scroll solo funciona en modo Cascada.</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setAutoScroll(!autoScroll)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${autoScroll ? 'bg-[#ec4899] text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'bg-white/5 text-white hover:bg-white/10'}`}
                    >
                      {autoScroll ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {autoScroll ? 'Pausar' : 'Iniciar'}
                    </button>
                    {autoScroll && (
                      <button 
                        onClick={() => setScrollSpeed(s => s >= 3 ? 1 : s + 1)}
                        className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-bold flex items-center gap-1"
                      >
                        <FastForward className="w-4 h-4" /> x{scrollSpeed}
                      </button>
                    )}
                  </div>
                )}
              </div>
"""
content = content.replace('</button>\n            </div>\n          )}', '</button>\n' + settings_ui + '            </div>\n          )}')

with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "w") as f:
    f.write(content)

print("Pro controls applied!")
