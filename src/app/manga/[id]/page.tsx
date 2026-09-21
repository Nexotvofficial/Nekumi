"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Heart, Star, BookOpen, Clock, List, ChevronRight, ArrowLeft, Loader2, MessageCircle, Send } from "lucide-react";
import { getAvatarSvg, AVATARS } from "@/lib/avatars";
import AvatarPicker from "@/components/AvatarPicker";

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

interface Review {
  id: string;
  user_email?: string;
  avatar_key?: string;
  rating: number;
  content: string;
  created_at: string;
}

export default function MangaDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  const [manhwa, setManhwa] = useState<Manhwa | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sortDesc, setSortDesc] = useState(true);

  // Review form state
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("hunter");

  useEffect(() => {
    async function loadData() {
      supabase.from('visits').insert([{}]).then();
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (prof) { setUserProfile(prof); setSelectedAvatar(prof.avatar_url || "hunter"); }
      }

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

      // Fetch Reviews
      const { data: rData } = await supabase
        .from("reviews")
        .select("*")
        .eq("manhwa_id", id)
        .order("created_at", { ascending: false });
      if (rData) setReviews(rData);

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

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Inicia sesión para calificar.");
      return;
    }

    setReviewLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .insert([
        {
          manhwa_id: id,
          user_id: user.id,
          user_email: user.email,
          avatar_key: selectedAvatar,
          rating: newRating,
          content: newReview || "Sin comentario",
        },
      ])
      .select();

    if (error) {
      alert("Error al calificar: " + error.message);
      setReviewLoading(false);
    } else {
      setNewReview("");
      setNewRating(5);
      
      if (data) {
        const updatedReviews = [data[0], ...reviews];
        setReviews(updatedReviews);
        
        // Calcular nuevo promedio y actualizar manhwa
        const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = parseFloat((sum / updatedReviews.length).toFixed(1));
        await supabase.from("manhwas").update({ score: avg }).eq("id", id);
        if (manhwa) setManhwa({ ...manhwa, score: avg });
      }
      setReviewLoading(false);
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
              <button 
                onClick={() => document.getElementById('reseñas-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1.5 text-white hover:text-[#fbbf24] transition-colors cursor-pointer"
                title="Calificar este manhwa"
              >
                <Star className="w-4 h-4 text-[#fbbf24] fill-[#fbbf24]" />
                <span className="font-bold text-[15px]">{manhwa.score}</span>
              </button>
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
          <div className="flex items-center justify-between mb-6"> <div className="flex items-center gap-3"> <List className="w-6 h-6 text-[#a855f7]" /> <h2 className="text-2xl font-bold">Capítulos</h2> </div> <button onClick={() => setSortDesc(!sortDesc)} className="btn glass border border-white/10 hover:bg-white/5 text-sm"> Ordenar: {sortDesc ? "Más recientes" : "Más antiguos"} </button> </div>

          <div className="glass rounded-[22px] overflow-hidden">
            {chapters.length === 0 ? (
              <div className="p-12 text-center text-[#777782]">
                Aún no hay capítulos publicados para este manhwa.
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {[...chapters].sort((a, b) => sortDesc ? b.chapter_number - a.chapter_number : a.chapter_number - b.chapter_number).map((chapter) => (
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

        {/* Reviews Section */}
        <div id="reseñas-section" className="mt-16 border-t border-white/10 pt-16">
          <div className="flex items-center gap-3 mb-8">
            <MessageCircle className="w-6 h-6 text-[#a855f7]" />
            <h2 className="text-2xl font-bold">Comentarios y Reseñas</h2>
          </div>

          {/* Add Review Form */}
          {user ? (
            <form onSubmit={submitReview} className="glass rounded-[22px] p-6 mb-12">
              <h3 className="text-lg font-bold mb-4">Deja tu opinión</h3>

              {/* Avatar selector row */}
              <div className="flex items-center gap-4 mb-4 p-3 rounded-xl border border-white/10 bg-white/5">
                <div
                  className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer border-2 border-[#a855f7]/50"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  dangerouslySetInnerHTML={{ __html: getAvatarSvg(selectedAvatar) }}
                />
                <div>
                  <p className="text-xs text-white/50">Comentando como</p>
                  <p className="text-sm font-semibold text-white">{user.email?.split('@')[0]}</p>
                  <button type="button" onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="text-xs text-[#c084fc] hover:text-white transition-colors">
                    {showAvatarPicker ? "Cerrar" : "Cambiar avatar →"}
                  </button>
                </div>
              </div>

              {showAvatarPicker && (
                <div className="mb-4 p-4 rounded-xl border border-[#a855f7]/20 bg-[#a855f7]/5">
                  <AvatarPicker selected={selectedAvatar} onChange={(k) => { setSelectedAvatar(k); setShowAvatarPicker(false); }} />
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-white/70">Tu calificación:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className={`p-1 transition-colors ${star <= newRating ? 'text-[#fbbf24]' : 'text-white/20'}`}
                    >
                      <Star className={`w-6 h-6 ${star <= newRating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="¿Qué te pareció este manhwa? (Opcional)"
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-black/20 text-white p-4 text-sm resize-none mb-4 focus:outline-none focus:border-[#a855f7]/50"
              />
              <button
                type="submit"
                disabled={reviewLoading}
                className="btn bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold px-6 py-2 rounded-xl transition-colors flex items-center gap-2"
              >
                {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publicar Reseña
              </button>
            </form>
          ) : (
            <div className="glass rounded-[22px] p-8 text-center mb-12">
              <p className="text-white/70 mb-4">Inicia sesión para dejar una reseña.</p>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-center text-white/50 py-8">No hay comentarios aún. ¡Sé el primero!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="glass rounded-xl p-5 border border-white/5">
                  <div className="flex items-start gap-4 mb-3">
                    <div
                      className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-white/10"
                      dangerouslySetInnerHTML={{ __html: getAvatarSvg(review.avatar_key || "hunter") }}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-white text-sm">{review.user_email?.split('@')[0] || "Usuario"}</p>
                          <p className="text-xs text-white/40">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-0.5 text-[#fbbf24]">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'opacity-20'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap pl-[60px]">{review.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



