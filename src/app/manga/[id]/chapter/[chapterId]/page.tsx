"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Loader2, Settings, MessageSquare } from "lucide-react";
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

  useEffect(() => {
    async function loadData() {
      // Fetch chapter details
      const { data: cData } = await supabase.from("chapters").select("*").eq("id", chapterId).single();
      if (cData) setChapter(cData);

      // Fetch images for this chapter
      const { data: pData } = await supabase
        .from("pages")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("page_number", { ascending: true });
      if (pData) setPages(pData);

      setLoading(false);
    }

    if (chapterId) loadData();
  }, [chapterId, supabase]);

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
            {chapter.title && <p className="text-xs text-[#a7a7b1]">{chapter.title}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="icon-btn hover:bg-white/10 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button className="icon-btn hover:bg-white/10 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Reader Container */}
      <div className="max-w-3xl mx-auto flex flex-col items-center">
        {pages.length === 0 ? (
          <div className="p-12 text-center text-[#777782] w-full">
            <p>Aún no se han subido las imágenes de este capítulo.</p>
          </div>
        ) : (
          pages.map((page) => (
            <img 
              key={page.id}
              src={page.image_url} 
              alt={`Página ${page.page_number}`}
              loading="lazy"
              className="w-full h-auto block select-none pointer-events-none"
            />
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-[#0a0a0c] border-t border-white/5 py-6 px-4 mt-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href={`/manga/${manhwaId}`} className="btn glass border border-white/10 hover:bg-white/5">
            <ArrowLeft className="w-4 h-4 mr-2 inline" /> Volver a Capítulos
          </Link>
          
          <div className="text-center">
            <p className="text-sm font-semibold text-white">¿Te gustó el capítulo?</p>
            <p className="text-xs text-[#a7a7b1]">¡No olvides dejar un comentario!</p>
          </div>
          
          <button className="btn btn-primary" onClick={() => alert("Siguiente capítulo no disponible aún.")}>
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
