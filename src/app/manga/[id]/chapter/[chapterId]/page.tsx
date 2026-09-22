"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, ArrowRight, Loader2, Settings, MessageSquare, MonitorDown, BookOpen } from "lucide-react";
import Link from "next/link";

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  manhwa_id: string;
}

interface Page {
  id: string;
  page_number: number;
  image_url: string;
}

export default function ChapterReader() {
  const params = useParams();
  const router = useRouter();
  const chapterId = params.chapterId as string;
  const manhwaId = params.id as string;
  const supabase = createClient();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation
  const [nextChapter, setNextChapter] = useState<Chapter | null>(null);
  const [prevChapter, setPrevChapter] = useState<Chapter | null>(null);

  // Reader Settings
  const [readMode, setReadMode] = useState<"cascade" | "paged">("cascade");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved settings
    const savedMode = localStorage.getItem("nekutoon:readMode");
    if (savedMode === "paged" || savedMode === "cascade") {
      setReadMode(savedMode);
    }

    async function loadData() {
      const { data: cData } = await supabase.from("chapters").select("*").eq("id", chapterId).single();
      if (cData) {
        setChapter(cData);
        
        const { data: prevData } = await supabase
          .from("chapters").select("*").eq("manhwa_id", manhwaId).lt("chapter_number", cData.chapter_number)
          .order("chapter_number", { ascending: false }).limit(1).single();
        if (prevData) setPrevChapter(prevData);

        const { data: nextData } = await supabase
          .from("chapters").select("*").eq("manhwa_id", manhwaId).gt("chapter_number", cData.chapter_number)
          .order("chapter_number", { ascending: true }).limit(1).single();
        if (nextData) setNextChapter(nextData);
      }

      const { data: pData } = await supabase
        .from("pages").select("*").eq("chapter_id", chapterId)
        .order("page_number", { ascending: true });
      if (pData) setPages(pData);

      setLoading(false);
    }
    if (chapterId) loadData();
  }, [chapterId, manhwaId, supabase]);

  // Image Preloader for Paged Mode
  useEffect(() => {
    if (readMode === "paged" && pages.length > 0) {
      // Preload next 3 images to eliminate waiting time
      const preloadCount = 3;
      for (let i = 1; i <= preloadCount; i++) {
        const nextIndex = currentPageIndex + i;
        if (nextIndex < pages.length) {
          const img = new window.Image();
          img.src = pages[nextIndex].image_url;
        }
      }
    }
  }, [currentPageIndex, pages, readMode]);

  const toggleReadMode = (mode: "cascade" | "paged") => {
    setReadMode(mode);
    localStorage.setItem("nekutoon:readMode", mode);
    setShowSettings(false);
    setCurrentPageIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readMode !== "paged") return;
    
    const { clientX } = e;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickX = clientX - left;
    
    // Click on right half -> Next page
    if (clickX > width / 2) {
      if (currentPageIndex < pages.length - 1) {
        setCurrentPageIndex(prev => prev + 1);
        window.scrollTo({ top: 0 });
      } else if (nextChapter) {
        router.push(`/manga/${manhwaId}/chapter/${nextChapter.id}`);
      }
    } 
    // Click on left half -> Prev page
    else {
      if (currentPageIndex > 0) {
        setCurrentPageIndex(prev => prev - 1);
        window.scrollTo({ top: 0 });
      } else if (prevChapter) {
        router.push(`/manga/${manhwaId}/chapter/${prevChapter.id}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#a855f7]" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold mb-4">Capítulo no encontrado</h1>
          <Link href={`/manga/${manhwaId}`} className="btn btn-primary inline-flex">Volver al Manhwa</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/5 py-4 px-4 sm:px-6 flex items-center justify-between transition-transform">
        <div className="flex items-center gap-4">
          <Link href={`/manga/${manhwaId}`} className="icon-btn hover:bg-white/10 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-white leading-tight">Capítulo {chapter.chapter_number}</h1>
            {chapter.title &&
              chapter.title.replace(/[íìîï]/gi, "i").trim().toLowerCase() !== `capitulo ${chapter.chapter_number}` &&
              <p className="text-xs text-[#a7a7b1]">{chapter.title}</p>
            }
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative">
          {prevChapter && (
            <button onClick={() => router.push(`/manga/${manhwaId}/chapter/${prevChapter.id}`)} className="hidden sm:flex icon-btn hover:bg-white/10 text-white rounded-full w-10 h-10 items-center justify-center transition-colors" title="Capítulo Anterior">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {nextChapter && (
            <button onClick={() => router.push(`/manga/${manhwaId}/chapter/${nextChapter.id}`)} className="hidden sm:flex icon-btn hover:bg-white/10 text-white rounded-full w-10 h-10 items-center justify-center transition-colors" title="Siguiente Capítulo">
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`icon-btn text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors ${showSettings ? 'bg-white/10' : 'hover:bg-white/10'}`}
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Settings Dropdown */}
          {showSettings && (
            <div className="absolute right-0 top-12 mt-2 w-56 bg-[#121214] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Modo de Lectura</p>
              </div>
              <button 
                onClick={() => toggleReadMode("cascade")}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${readMode === 'cascade' ? 'bg-[#a855f7]/10 text-[#c084fc]' : 'text-white hover:bg-white/5'}`}
              >
                <MonitorDown className="w-4 h-4" /> Cascada (Webtoon)
              </button>
              <button 
                onClick={() => toggleReadMode("paged")}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${readMode === 'paged' ? 'bg-[#a855f7]/10 text-[#c084fc]' : 'text-white hover:bg-white/5'}`}
              >
                <BookOpen className="w-4 h-4" /> Paginado (Manga)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reader Container */}
      <div 
        ref={containerRef}
        className={`max-w-3xl mx-auto flex flex-col items-center ${readMode === 'paged' ? 'cursor-pointer relative min-h-[70vh]' : ''}`}
        onClick={handlePageClick}
      >
        {pages.length === 0 ? (
          <div className="p-12 text-center text-[#777782] w-full">
            <p>Aún no se han subido las imágenes de este capítulo.</p>
          </div>
        ) : (
          readMode === "cascade" ? (
            // Modo Cascada
            pages.map((page) => (
              <img 
                key={page.id}
                src={page.image_url} 
                alt={`Página ${page.page_number}`}
                loading="lazy"
                className="w-full h-auto block select-none pointer-events-none"
              />
            ))
          ) : (
            // Modo Paginado
            <div className="w-full relative group">
              <img 
                key={pages[currentPageIndex].id}
                src={pages[currentPageIndex].image_url} 
                alt={`Página ${pages[currentPageIndex].page_number}`}
                className="w-full h-auto block select-none pointer-events-none"
              />
              
              {/* Navigation Guides Overlay */}
              <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/50 text-white p-2 rounded-r-xl backdrop-blur-sm -ml-2">
                  <ArrowLeft className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/50 text-white p-2 rounded-l-xl backdrop-blur-sm -mr-2">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>

              {/* Page Counter Overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-white tracking-widest shadow-xl">
                {currentPageIndex + 1} / {pages.length}
              </div>

              {/* Preloader Oculto para Carga Instantánea */}
              <div className="hidden">
                {pages.slice(currentPageIndex + 1, currentPageIndex + 4).map((p) => (
                  <img key={`preload-${p.id}`} src={p.image_url} alt="preload" />
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-[#0a0a0c] border-t border-white/5 py-6 px-4 mt-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-2 w-full sm:w-auto justify-between">
            <Link href={`/manga/${manhwaId}`} className="btn glass border border-white/10 hover:bg-white/5 flex-1 sm:flex-none">
              Menú
            </Link>
            
            {prevChapter ? (
              <button onClick={() => router.push(`/manga/${manhwaId}/chapter/${prevChapter.id}`)} className="btn glass border border-white/10 hover:bg-white/5 flex-1 sm:flex-none">
                <ArrowLeft className="w-4 h-4 mr-2 hidden sm:inline" /> Anterior
              </button>
            ) : (
              <button disabled className="btn glass border border-white/10 opacity-50 cursor-not-allowed flex-1 sm:flex-none">
                Anterior
              </button>
            )}
          </div>
          
          <div className="text-center hidden sm:block">
            <p className="text-sm font-semibold text-white">¿Te gustó el capítulo?</p>
            <p className="text-xs text-[#a7a7b1]">¡No olvides comentar!</p>
          </div>
          
          <div className="w-full sm:w-auto">
            {nextChapter ? (
              <button onClick={() => router.push(`/manga/${manhwaId}/chapter/${nextChapter.id}`)} className="btn btn-primary w-full sm:w-auto">
                Siguiente <ArrowRight className="w-4 h-4 ml-2 inline" />
              </button>
            ) : (
              <button disabled className="btn btn-primary opacity-50 cursor-not-allowed w-full sm:w-auto">
                No hay más caps
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
