"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Star, Heart, BookOpen, Clock, List, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Manhwa {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  score: number;
  genre: string;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  created_at: string;
}

export default function MangaDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  const [manhwa, setManhwa] = useState<Manhwa | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Fetch Manhwa details
      const { data: mData } = await supabase.from("manhwas").select("*").eq("id", id).single();
      if (mData) setManhwa(mData);

      // Fetch Chapters
      const { data: cData } = await supabase
        .from("chapters")
        .select("*")
        .eq("manhwa_id", id)
        .order("chapter_number", { ascending: false });
      if (cData) setChapters(cData);

      // Check if favorite
      if (session?.user && mData) {
        const { data: fData } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("manhwa_id", id)
          .single();
        if (fData) setIsFavorite(true);
      }

      setLoading(false);
    }

    if (id) loadData();
  }, [id, supabase]);

  const toggleFavorite = async () => {
    if (!user) {
      alert("Inicia sesión para guardar en favoritos.");
      return;
    }

    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("manhwa_id", id);
      setIsFavorite(false);
    } else {
      await supabase.from("favorites").insert([{ user_id: user.id, manhwa_id: id }]);
      setIsFavorite(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#a855f7]" />
      </div>
    );
  }

  if (!manhwa) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold mb-4">Manhwa no encontrado</h1>
          <Link href="/" className="btn btn-primary inline-flex">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Dynamic Background Banner */}
      <div className="relative w-full h-[400px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110"
          style={{ backgroundImage: `url(${manhwa.cover_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent" />
        
        <div className="absolute top-8 left-4 sm:left-8 z-10">
          <Link href="/" className="icon-btn bg-black/40 hover:bg-black/60 text-white backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-48 relative z-20">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Cover Image */}
          <div className="flex-shrink-0 mx-auto md:mx-0 w-[240px] md:w-[300px]">
            <img 
              src={manhwa.cover_url} 
              alt={manhwa.title} 
              className="w-full h-auto rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-white/10"
            />
            
            <div className="mt-6 flex gap-3">
              <button 
                className="btn btn-primary flex-1 py-3 text-sm flex justify-center items-center gap-2"
                onClick={() => {
                  if (chapters.length > 0) {
                    router.push(`/manga/${id}/chapter/${chapters[chapters.length - 1].id}`);
                  } else {
                    alert("Aún no hay capítulos disponibles.");
                  }
                }}
              >
                <BookOpen className="w-4 h-4" /> 
                {chapters.length > 0 ? "Leer Capítulo 1" : "Próximamente"}
              </button>
              
              <button 
                onClick={toggleFavorite}
                className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
                  isFavorite 
                    ? "bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/50" 
                    : "glass text-white/70 hover:text-white"
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          {/* Manhwa Info */}
          <div className="flex-1 pt-4 md:pt-16 text-center md:text-left">
            <div className="inline-block px-3 py-1 rounded-full border border-[#a855f7]/30 bg-[#a855f7]/10 text-[#c084fc] text-xs font-bold tracking-wide uppercase mb-4">
              {manhwa.genre}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              {manhwa.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-[#a7a7b1] mb-8 font-medium">
              <div className="flex items-center gap-1.5 text-white">
                <Star className="w-4 h-4 text-[#fbbf24] fill-[#fbbf24]" />
                <span className="font-bold text-[15px]">{manhwa.score}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-1.5">
                <List className="w-4 h-4" />
                {chapters.length} Capítulos
              </div>
            </div>

            <div className="glass rounded-2xl p-6 mb-8 text-left">
              <h3 className="text-lg font-bold text-white mb-3">Sinopsis</h3>
              <p className="text-[#a7a7b1] leading-relaxed text-sm md:text-base">
                {manhwa.description || "Sin descripción disponible."}
              </p>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <List className="w-6 h-6 text-[#a855f7]" />
            <h2 className="text-2xl font-bold">Capítulos</h2>
          </div>

          <div className="glass rounded-[22px] overflow-hidden">
            {chapters.length === 0 ? (
              <div className="p-12 text-center text-[#777782]">
                Aún no hay capítulos publicados para este manhwa.
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {chapters.map((chapter) => (
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
                          <p className="text-xs text-[#777782] flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(chapter.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
