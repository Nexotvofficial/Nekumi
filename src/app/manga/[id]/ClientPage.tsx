"use client";

import NekuLoading from "@/components/NekuLoading";
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient, fetchChapterPagesFast } from "@/lib/supabase";
import Link from "next/link";
import {
  Heart,
  Star,
  BookOpen,
  List,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
  Play,
  Search,
  Share2,
} from "lucide-react";
import { getAvatarSvg } from "@/lib/avatars";
import AvatarPicker from "@/components/AvatarPicker";

interface Manhwa {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  banner_url?: string;
  score: number;
  status?: string;
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

export default function ClientPage({
  initialManhwa = null,
  initialChapters = [],
  initialReviews = [],
}: {
  initialManhwa?: Manhwa | null;
  initialChapters?: Chapter[];
  initialReviews?: Review[];
}) {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  const [manhwa, setManhwa] = useState<Manhwa | null>(initialManhwa);
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  const [loading, setLoading] = useState(!initialManhwa);
  const [chaptersLoading, setChaptersLoading] = useState(initialChapters.length === 0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [lastReadChapter, setLastReadChapter] = useState<{ id: string; num: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sortDesc, setSortDesc] = useState(true);
  const [chapterPage, setChapterPage] = useState(1);
  const [chapterSearch, setChapterSearch] = useState("");
  const chaptersPerPage = 100;

  // Review form state
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("hunter");

  // Toast state
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 2200);
  };

  // Preload chapter pages on hover/touch using the 100ms B-Tree shard index
  const handlePrefetch = async (chapter: Chapter) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(`nekumi_chap_meta_${chapter.id}`, JSON.stringify(chapter));
      if (sessionStorage.getItem(`nekumi_chap_${chapter.id}`)) return;
    } catch {
      return;
    }

    const data = await fetchChapterPagesFast(supabase, chapter.id);

    if (data && data.length > 0) {
      try {
        sessionStorage.setItem(`nekumi_chap_${chapter.id}`, JSON.stringify(data));
      } catch {}
      data.slice(0, 3).forEach((p) => {
        const img = new window.Image();
        img.src = p.image_url;
      });
    }
  };

  useEffect(() => {
    if (!id) return;

    // Load local bookmark, favorite status, and cached manhwa/chapters immediately (0ms!)
    try {
      const lastId = localStorage.getItem(`nekumi_last_read_${id}`);
      const lastNum = localStorage.getItem(`nekumi_last_read_num_${id}`);
      if (lastId && lastNum) {
        setLastReadChapter({ id: lastId, num: lastNum });
      }
      const savedFavs = new Set<string>(JSON.parse(localStorage.getItem("nekutoon:favorites") || "[]"));
      if (savedFavs.has(String(id))) {
        setIsFavorite(true);
      }
      if (!manhwa) {
        const cachedFull = sessionStorage.getItem(`nekumi_manhwa_full_${id}`);
        if (cachedFull) {
          setManhwa(JSON.parse(cachedFull));
          setLoading(false);
        }
      }
      if (chapters.length === 0) {
        const cachedChaps = sessionStorage.getItem(`nekumi_manhwa_chaps_${id}`);
        if (cachedChaps) {
          const parsed = JSON.parse(cachedChaps);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChapters(parsed);
            setChaptersLoading(false);
          }
        }
      } else {
        sessionStorage.setItem(`nekumi_manhwa_chaps_${id}`, JSON.stringify(chapters));
      }
    } catch {}

    async function loadData() {
      // Deduplicate visit logging per session
      try {
        if (!sessionStorage.getItem("nekumi_visit_logged")) {
          sessionStorage.setItem("nekumi_visit_logged", "1");
          supabase.from("visits").insert([{}]).then();
        }
      } catch {}

      // Fetch Manhwa, Chapters, Reviews, and Session in parallel (no waterfall!)
      const [sessionRes, manhwaRes, chaptersRes, reviewsRes] = await Promise.all([
        supabase.auth.getSession(),
        initialManhwa
          ? Promise.resolve({ data: initialManhwa })
          : supabase.from("manhwas").select("*").eq("id", id).single(),
        initialChapters.length > 0
          ? Promise.resolve({ data: initialChapters })
          : supabase
              .from("chapters")
              .select("id, chapter_number, title, created_at")
              .eq("manhwa_id", id)
              .order("chapter_number", { ascending: false })
              .limit(1000),
        initialReviews.length > 0
          ? Promise.resolve({ data: initialReviews })
          : supabase.from("reviews").select("*").eq("manhwa_id", id).order("created_at", { ascending: false }).limit(50),
      ]);

      const sessionUser = sessionRes.data?.session?.user ?? null;
      setUser(sessionUser);

      if (manhwaRes.data) {
        setManhwa(manhwaRes.data);
        try {
          sessionStorage.setItem(
            `nekumi_manhwa_${id}`,
            JSON.stringify({
              id: manhwaRes.data.id,
              title: manhwaRes.data.title,
              cover_url: manhwaRes.data.cover_url,
            })
          );
          sessionStorage.setItem(`nekumi_manhwa_full_${id}`, JSON.stringify(manhwaRes.data));
        } catch {}
      }

      if (chaptersRes.data) {
        setChapters(chaptersRes.data);
        try {
          sessionStorage.setItem(`nekumi_manhwa_chaps_${id}`, JSON.stringify(chaptersRes.data));
        } catch {}
        // Prefetch first chapter and last-read chapter automatically in background
        const sortedAsc = [...chaptersRes.data].sort((a, b) => a.chapter_number - b.chapter_number);
        if (sortedAsc[0]) handlePrefetch(sortedAsc[0]);
      }
      if (reviewsRes.data) setReviews(reviewsRes.data);

      setLoading(false);
      setChaptersLoading(false);

      if (sessionUser) {
        const [profRes, favRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", sessionUser.id).single(),
          supabase.from("favorites").select("id").eq("user_id", sessionUser.id).eq("manhwa_id", id).maybeSingle(),
        ]);

        if (profRes.data) {
          setSelectedAvatar(profRes.data.avatar_url || "hunter");
        }
        if (favRes.data) {
          setIsFavorite(true);
          try {
            const savedFavs = new Set<string>(JSON.parse(localStorage.getItem("nekutoon:favorites") || "[]"));
            savedFavs.add(String(id));
            localStorage.setItem("nekutoon:favorites", JSON.stringify([...savedFavs]));
          } catch {}
        }
      }
    }

    loadData();
  }, [id]);

  const toggleFavorite = async () => {
    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      const savedFavs = new Set<string>(JSON.parse(localStorage.getItem("nekutoon:favorites") || "[]"));
      if (nextState) {
        savedFavs.add(String(id));
        triggerToast("Añadido a tus favoritos");
      } else {
        savedFavs.delete(String(id));
        triggerToast("Eliminado de tus favoritos");
      }
      localStorage.setItem("nekutoon:favorites", JSON.stringify([...savedFavs]));
    } catch {}

    if (user) {
      if (nextState) {
        await supabase.from("favorites").insert([{ user_id: user.id, manhwa_id: id }]);
      } else {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("manhwa_id", id);
      }
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      triggerToast("Inicia sesión para dejar una reseña");
      return;
    }

    setReviewLoading(true);
    const reviewPayload: Record<string, any> = {
      manhwa_id: id,
      user_id: user.id,
      user_email: user.email,
      avatar_key: selectedAvatar,
      rating: newRating,
      content: newReview.trim() || "Excelente obra",
    };

    let { data, error } = await supabase.from("reviews").insert([reviewPayload]).select();

    // Fallback in case avatar_key column isn't present in an older DB schema
    if (error && error.message?.includes("avatar_key")) {
      const { avatar_key, ...fallbackPayload } = reviewPayload;
      const retry = await supabase.from("reviews").insert([fallbackPayload]).select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      triggerToast("Error al publicar: " + error.message);
      setReviewLoading(false);
    } else {
      setNewReview("");
      setNewRating(5);

      if (data && data[0]) {
        const inserted = { ...data[0], avatar_key: selectedAvatar };
        const updatedReviews = [inserted, ...reviews];
        setReviews(updatedReviews);

        const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = parseFloat((sum / updatedReviews.length).toFixed(1));
        supabase.from("manhwas").update({ score: avg }).eq("id", id).then();
        if (manhwa) setManhwa({ ...manhwa, score: avg });
      }
      triggerToast("¡Reseña publicada con éxito!");
      setReviewLoading(false);
    }
  };

  const sortedChapters = useMemo(() => {
    const q = chapterSearch.trim().toLowerCase();
    const filtered = q
      ? chapters.filter(
          (c) =>
            String(c.chapter_number).includes(q) ||
            (c.title || "").toLowerCase().includes(q)
        )
      : chapters;
    return [...filtered].sort((a, b) =>
      sortDesc ? b.chapter_number - a.chapter_number : a.chapter_number - b.chapter_number
    );
  }, [chapters, sortDesc, chapterSearch]);

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${manhwa?.title || "Manhwa"} — Nekumi`,
          text: `Lee ${manhwa?.title || "este manhwa"} en español en Nekumi`,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      triggerToast("¡Enlace copiado al portapapeles!");
    } catch {
      triggerToast("No se pudo copiar el enlace");
    }
  };

  const firstChapter = useMemo(() => {
    if (chapters.length === 0) return null;
    return [...chapters].sort((a, b) => a.chapter_number - b.chapter_number)[0];
  }, [chapters]);

  if (loading) return <NekuLoading fullScreen={true} />;

  if (!manhwa) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div className="glass p-10 rounded-3xl max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Obra no encontrada</h1>
          <p className="text-sm text-[#9b9ba6] mb-6">
            El manhwa que buscas no existe o fue trasladado del catálogo.
          </p>
          <Link href="/" className="btn btn-primary inline-flex">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Dynamic Background Banner */}
      <div className="relative w-full h-[380px] sm:h-[420px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110"
          style={{ backgroundImage: `url(${manhwa.banner_url || manhwa.cover_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent" />

        <div className="absolute top-6 left-4 sm:left-8 z-10">
          <Link
            href="/"
            className="icon-btn bg-black/50 hover:bg-black/70 text-white backdrop-blur-md rounded-full w-11 h-11 flex items-center justify-center transition-colors border border-white/10"
            aria-label="Volver al catálogo"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-48 relative z-20">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover Image & Actions */}
          <div className="flex-shrink-0 mx-auto md:mx-0 w-[230px] sm:w-[260px] md:w-[290px]">
            <img
              referrerPolicy="no-referrer"
              src={manhwa.cover_url}
              alt={manhwa.title}
              className="w-full aspect-[2/3] object-cover rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-2 border-white/10"
            />

            <div className="mt-5 flex flex-col gap-2.5">
              <div className="flex gap-2.5">
                <button
                  type="button"
                  className="btn btn-primary flex-1 py-3 text-sm flex justify-center items-center gap-2"
                  onClick={() => {
                    if (firstChapter) {
                      router.push(`/manga/${id}/chapter/${firstChapter.id}`);
                    } else {
                      triggerToast("Aún no hay capítulos disponibles");
                    }
                  }}
                >
                  <BookOpen className="w-4 h-4" />
                  {firstChapter ? `Leer Cap. ${firstChapter.chapter_number}` : "Próximamente"}
                </button>

                <button
                  type="button"
                  onClick={toggleFavorite}
                  aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                  className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all flex-shrink-0 ${
                    isFavorite
                      ? "bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/50 shadow-[0_0_20px_rgba(236,72,153,0.25)]"
                      : "glass text-white/70 hover:text-white"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Compartir manhwa"
                  title="Compartir enlace"
                  className="flex items-center justify-center w-12 h-12 rounded-2xl glass text-white/70 hover:text-[#c084fc] transition-all flex-shrink-0"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {lastReadChapter && (
                <Link
                  href={`/manga/${id}/chapter/${lastReadChapter.id}`}
                  className="btn btn-secondary w-full py-3 text-sm flex justify-center items-center gap-2 border-[#a855f7]/40 text-[#d8b4fe] hover:bg-[#a855f7]/15"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Continuar Cap. {lastReadChapter.num}
                </Link>
              )}
            </div>
          </div>

          {/* Manhwa Info */}
          <div className="flex-1 pt-2 md:pt-14 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
              <span className="inline-block px-3.5 py-1 rounded-full border border-[#a855f7]/30 bg-[#a855f7]/15 text-[#c084fc] text-xs font-bold tracking-wide uppercase">
                {manhwa.genre}
              </span>
              {manhwa.status && (
                <span className="inline-block px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/80 text-xs font-semibold">
                  {manhwa.status}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              {manhwa.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-[#a7a7b1] mb-8 font-medium">
              <button
                type="button"
                onClick={() => document.getElementById("reseñas-section")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-1.5 text-white hover:text-[#fbbf24] transition-colors cursor-pointer"
                title="Calificar este manhwa"
              >
                <Star className="w-4 h-4 text-[#fbbf24] fill-[#fbbf24]" />
                <span className="font-bold text-[15px]">{manhwa.score}</span>
                <span className="text-xs text-white/50">({reviews.length} reseñas)</span>
              </button>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-1.5">
                <List className="w-4 h-4 text-[#c084fc]" />
                <span>{chapters.length} Capítulos</span>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 mb-8 text-left">
              <h2 className="text-base font-bold text-white mb-2.5 uppercase tracking-wider text-[#c084fc]">
                Sinopsis
              </h2>
              <p className="text-[#dedee6] leading-relaxed text-sm md:text-base">
                {manhwa.description || "Sin descripción disponible por el momento."}
              </p>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="mt-14 detail-chapters">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <List className="w-6 h-6 text-[#a855f7]" />
              <h2 className="text-2xl font-bold">Capítulos ({sortedChapters.length})</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={chapterSearch}
                  onChange={(e) => {
                    setChapterSearch(e.target.value);
                    setChapterPage(1);
                  }}
                  placeholder="Ir al capítulo... (ej. 25)"
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#a855f7]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSortDesc(!sortDesc);
                  setChapterPage(1);
                }}
                className="btn glass border border-white/10 hover:bg-white/5 text-xs sm:text-sm h-10 px-4"
              >
                {sortDesc ? "↓ Recientes" : "↑ Desde Cap. 1"}
              </button>
            </div>
          </div>

          {lastReadChapter && chapters.length > 0 && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#a855f7]/10 border border-[#a855f7]/25 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white/90">
                <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse" />
                <span>
                  Tu progreso: <strong className="text-[#d8b4fe]">Capítulo {lastReadChapter.num}</strong> de{" "}
                  {chapters.length}
                </span>
              </div>
              <Link
                href={`/manga/${id}/chapter/${lastReadChapter.id}`}
                className="text-xs font-bold text-[#c084fc] hover:text-white transition-colors"
              >
                Reanudar lectura →
              </Link>
            </div>
          )}

          <div className="glass rounded-[22px] overflow-hidden">
            {chapters.length === 0 ? (
              <div className="p-12 text-center text-[#9b9ba6]">
                Aún no hay capítulos publicados para este manhwa.
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {sortedChapters
                    .slice((chapterPage - 1) * chaptersPerPage, chapterPage * chaptersPerPage)
                    .map((chapter) => {
                      const isLastRead = lastReadChapter?.id === chapter.id;
                      const isReadBefore =
                        !isLastRead &&
                        lastReadChapter &&
                        !Number.isNaN(Number(lastReadChapter.num)) &&
                        chapter.chapter_number <= Number(lastReadChapter.num);
                      return (
                        <Link
                          key={chapter.id}
                          onMouseEnter={() => handlePrefetch(chapter)}
                          onTouchStart={() => handlePrefetch(chapter)}
                          href={`/manga/${id}/chapter/${chapter.id}`}
                          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all group ${
                            isLastRead
                              ? "bg-[#a855f7]/20 border-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                              : isReadBefore
                              ? "bg-white/[0.02] border-white/5 opacity-65 hover:opacity-100 hover:border-[#a855f7]/40"
                              : "bg-white/5 border-white/10 hover:border-[#a855f7]/50 hover:bg-[#a855f7]/10"
                          }`}
                        >
                          <span className="font-bold text-sm text-white group-hover:text-[#d8b4fe] transition-colors flex items-center gap-1.5">
                            Cap. {chapter.chapter_number}
                            {isLastRead && (
                              <span className="text-[10px] bg-[#a855f7] text-white px-1.5 py-0.5 rounded-full font-extrabold">
                                Actual
                              </span>
                            )}
                            {isReadBefore && (
                              <span className="text-[10px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded-full font-semibold">
                                Visto
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-white/45 mt-1">
                            {new Date(chapter.created_at).toLocaleDateString()}
                          </span>
                        </Link>
                      );
                    })}
                </div>

                {chapters.length > chaptersPerPage && (
                  <div className="flex items-center justify-between p-5 border-t border-white/5 bg-[#0a0a0c]">
                    <button
                      type="button"
                      onClick={() => setChapterPage((p) => Math.max(1, p - 1))}
                      disabled={chapterPage === 1}
                      className="px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <span className="text-white/70 text-sm font-medium">
                      Página {chapterPage} de {Math.ceil(chapters.length / chaptersPerPage)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setChapterPage((p) => Math.min(Math.ceil(chapters.length / chaptersPerPage), p + 1))
                      }
                      disabled={chapterPage === Math.ceil(chapters.length / chaptersPerPage)}
                      className="px-4 py-2 rounded-xl bg-[#a855f7]/20 text-[#c084fc] hover:bg-[#a855f7]/30 disabled:opacity-30 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reseñas-section" className="mt-16 border-t border-white/10 pt-14 detail-reviews">
          <div className="flex items-center gap-3 mb-8">
            <MessageCircle className="w-6 h-6 text-[#a855f7]" />
            <h2 className="text-2xl font-bold">Comentarios y Reseñas ({reviews.length})</h2>
          </div>

          {user ? (
            <form onSubmit={submitReview} className="glass rounded-[22px] p-6 mb-12">
              <h3 className="text-lg font-bold mb-4">Deja tu opinión sobre {manhwa.title}</h3>

              <div className="flex items-center gap-4 mb-4 p-3 rounded-xl border border-white/10 bg-white/5">
                <div
                  className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer border-2 border-[#a855f7]/50"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  dangerouslySetInnerHTML={{ __html: getAvatarSvg(selectedAvatar) }}
                />
                <div>
                  <p className="text-xs text-white/50">Comentando como</p>
                  <p className="text-sm font-semibold text-white">{user.email?.split("@")[0]}</p>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="text-xs text-[#c084fc] hover:text-white transition-colors"
                  >
                    {showAvatarPicker ? "Cerrar selector" : "Cambiar avatar →"}
                  </button>
                </div>
              </div>

              {showAvatarPicker && (
                <div className="mb-4 p-4 rounded-xl border border-[#a855f7]/20 bg-[#a855f7]/5">
                  <AvatarPicker
                    selected={selectedAvatar}
                    onChange={(k) => {
                      setSelectedAvatar(k);
                      setShowAvatarPicker(false);
                    }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-white/70">Tu calificación:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Calificar con ${star} estrellas`}
                      onClick={() => setNewRating(star)}
                      className={`p-1 transition-colors ${star <= newRating ? "text-[#fbbf24]" : "text-white/20"}`}
                    >
                      <Star className={`w-6 h-6 ${star <= newRating ? "fill-current" : ""}`} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="¿Qué te pareció este manhwa? Comparte tu reseña sin spoilers..."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-black/30 text-white p-4 text-sm resize-none mb-4 focus:outline-none focus:border-[#a855f7]/60"
              />
              <button
                type="submit"
                disabled={reviewLoading}
                className="btn btn-primary px-6 py-2.5 rounded-xl transition-all flex items-center gap-2"
              >
                {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publicar Reseña
              </button>
            </form>
          ) : (
            <div className="glass rounded-[22px] p-8 text-center mb-12">
              <p className="text-white/80 mb-3 text-sm">Inicia sesión en Nekumi para calificar y dejar tu reseña.</p>
              <Link href="/" className="btn btn-secondary text-xs">
                Ir a Iniciar Sesión
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-center text-white/50 py-8 text-sm">
                No hay comentarios aún. ¡Sé el primero en opinar!
              </p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="glass rounded-2xl p-5 border border-white/5">
                  <div className="flex items-start gap-4 mb-2.5">
                    <div
                      className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 bg-black/40"
                      dangerouslySetInnerHTML={{ __html: getAvatarSvg(review.avatar_key || "hunter") }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-white text-sm">{review.user_email?.split("@")[0] || "Lector"}</p>
                          <p className="text-xs text-white/45">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-0.5 text-[#fbbf24]">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-current" : "opacity-20"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap sm:pl-[60px]">
                    {review.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={`toast ${showToast ? "show" : ""}`} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </div>
  );
}
