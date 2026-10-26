"use client";

import NekuLoading from "@/components/NekuLoading";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient, fetchChapterPagesFast } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  Settings,
  MonitorDown,
  BookOpen,
  Play,
  Pause,
  FastForward,
  MessageCircle,
  Send,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { getAvatarSvg } from "@/lib/avatars";

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
  const [retryCount, setRetryCount] = useState(0);

  // Navigation
  const [nextChapter, setNextChapter] = useState<Chapter | null>(null);
  const [prevChapter, setPrevChapter] = useState<Chapter | null>(null);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);

  // Reader Settings
  const [readMode, setReadMode] = useState<"cascade" | "paged">("cascade");
  const [readerWidth, setReaderWidth] = useState<"compact" | "normal" | "wide">("normal");
  const [brightness, setBrightness] = useState<number>(100);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showReaderHeader, setShowReaderHeader] = useState(true);

  // Chapter Reactions & In-Chapter Comments
  const [voterId, setVoterId] = useState("");
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("hunter");
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [chapterComments, setChapterComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved readMode & voter identity once
  useEffect(() => {
    let vid = "";
    try {
      const savedMode = localStorage.getItem("nekutoon:readMode");
      if (savedMode === "paged" || savedMode === "cascade") {
        setReadMode(savedMode);
      }
      vid = localStorage.getItem("nekumi_voter_id") || "";
      if (!vid) {
        vid = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem("nekumi_voter_id", vid);
      }
      setVoterId(vid);
      const savedNick = localStorage.getItem("nekumi_reader_nick") || "";
      if (savedNick) setUserName(savedNick);
    } catch {}

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setVoterId(session.user.id);
        setUserName(session.user.email?.split("@")[0] || "Lector");
        supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.username) setUserName(data.username);
            if (data?.avatar_url) setUserAvatar(data.avatar_url);
          });
      }
    });
  }, []);

  // Load chapter reactions & comments
  useEffect(() => {
    if (!chapterId) return;
    const activeVoter = voterId || (typeof window !== "undefined" ? localStorage.getItem("nekumi_voter_id") || "" : "");
    fetch(
      `/api/community?type=chapter_social&chapterId=${encodeURIComponent(chapterId)}&voterId=${encodeURIComponent(activeVoter)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setReactionCounts(data.counts || {});
          setUserReactions(Array.isArray(data.userReactions) ? data.userReactions : []);
          setChapterComments(Array.isArray(data.comments) ? data.comments : []);
        }
      })
      .catch(() => {});
  }, [chapterId, voterId]);

  const handleToggleReaction = async (key: string) => {
    const activeVoter = voterId || `anon_${Date.now()}`;
    const alreadyActive = userReactions.includes(key);
    const nextUserReactions = alreadyActive
      ? userReactions.filter((r) => r !== key)
      : [...userReactions, key];
    setUserReactions(nextUserReactions);
    setReactionCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) + (alreadyActive ? -1 : 1)),
    }));

    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "react_chapter",
          chapterId,
          reactionKey: key,
          voterId: activeVoter,
        }),
      });
      const data = await res.json();
      if (data?.counts) {
        setReactionCounts(data.counts);
        setUserReactions(data.userReactions || []);
      }
    } catch {}
  };

  const handlePostChapterComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setCommentSubmitting(true);
    const finalName = userName.trim() || "Cazador";
    try {
      localStorage.setItem("nekumi_reader_nick", finalName);
    } catch {}

    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment_chapter",
          chapterId,
          authorName: finalName,
          avatarKey: userAvatar,
          content: commentInput.trim(),
        }),
      });
      const data = await res.json();
      if (Array.isArray(data?.comments)) {
        setChapterComments(data.comments);
        setCommentInput("");
      }
    } catch {}
    setCommentSubmitting(false);
  };

  // Fetch chapter, pages, neighbors, and record reading history
  useEffect(() => {
    if (!chapterId) return;
    let isCancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    setPrevChapter(null);
    setNextChapter(null);
    setCurrentPageIndex(0);

    async function loadData() {
      // 1. Instant RAM cache check (0ms!)
      let usedCache = false;
      let cachedChapsList: Chapter[] | null = null;
      try {
        const rawChapsList = sessionStorage.getItem(`nekumi_manhwa_chaps_${manhwaId}`);
        if (rawChapsList) {
          const parsedList = JSON.parse(rawChapsList);
          if (Array.isArray(parsedList) && parsedList.length > 0) {
            cachedChapsList = parsedList;
          }
        }

        const cachedPages = sessionStorage.getItem(`nekumi_chap_${chapterId}`);
        const cachedMeta =
          sessionStorage.getItem(`nekumi_chap_meta_${chapterId}`) ||
          (cachedChapsList ? JSON.stringify(cachedChapsList.find((c) => c.id === chapterId)) : null);

        if (cachedPages && cachedMeta) {
          const parsedPages = JSON.parse(cachedPages);
          const parsedMeta = JSON.parse(cachedMeta);
          if (Array.isArray(parsedPages) && parsedPages.length > 0 && parsedMeta) {
            setPages(parsedPages);
            setChapter(parsedMeta);
            setLoading(false);
            usedCache = true;
          }
        }
      } catch {}

      // 2. Fetch chapter metadata (if not in cached list) and fast B-Tree sharded pages in parallel (~120ms!)
      const localChapMeta = cachedChapsList?.find((c) => c.id === chapterId) || null;
      const [cRes, pData] = await Promise.all([
        localChapMeta
          ? Promise.resolve({ data: localChapMeta })
          : supabase.from("chapters").select("*").eq("id", chapterId).single(),
        fetchChapterPagesFast(supabase, chapterId),
      ]);

      if (isCancelled) return;

      const cData = cRes.data;
      if (cData) {
        setChapter(cData);

        // Save bookmark & reading history
        try {
          localStorage.setItem(`nekumi_last_read_${manhwaId}`, chapterId);
          localStorage.setItem(`nekumi_last_read_num_${manhwaId}`, String(cData.chapter_number));
        } catch {}

        // Resolve prev & next chapters immediately from cached list if available
        if (cachedChapsList && cachedChapsList.length > 0) {
          const sortedAsc = [...cachedChapsList].sort((a, b) => a.chapter_number - b.chapter_number);
          setAllChapters(sortedAsc);
          const idx = sortedAsc.findIndex((c) => c.id === chapterId || c.chapter_number === cData.chapter_number);
          const prevC = idx > 0 ? sortedAsc[idx - 1] : null;
          const nextC = idx >= 0 && idx < sortedAsc.length - 1 ? sortedAsc[idx + 1] : null;
          setPrevChapter(prevC);
          setNextChapter(nextC);

          // Prefetch next chapter pages in background for 0ms transitions!
          if (nextC) {
            fetchChapterPagesFast(supabase, nextC.id).then((nextPages) => {
              if (nextPages.length > 0) {
                try {
                  sessionStorage.setItem(`nekumi_chap_${nextC.id}`, JSON.stringify(nextPages));
                  sessionStorage.setItem(`nekumi_chap_meta_${nextC.id}`, JSON.stringify(nextC));
                } catch {}
              }
            });
          }
        } else {
          const [prevRes, nextRes] = await Promise.all([
            supabase
              .from("chapters")
              .select("*")
              .eq("manhwa_id", manhwaId)
              .lt("chapter_number", cData.chapter_number)
              .order("chapter_number", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("chapters")
              .select("*")
              .eq("manhwa_id", manhwaId)
              .gt("chapter_number", cData.chapter_number)
              .order("chapter_number", { ascending: true })
              .limit(1)
              .maybeSingle(),
          ]);
          if (!isCancelled) {
            setPrevChapter(prevRes.data || null);
            setNextChapter(nextRes.data || null);
            if (nextRes.data) {
              fetchChapterPagesFast(supabase, nextRes.data.id).then((nextPages) => {
                if (nextPages.length > 0) {
                  try {
                    sessionStorage.setItem(`nekumi_chap_${nextRes.data.id}`, JSON.stringify(nextPages));
                    sessionStorage.setItem(`nekumi_chap_meta_${nextRes.data.id}`, JSON.stringify(nextRes.data));
                  } catch {}
                }
              });
            }
          }
        }

        // Update reading history in background
        let cachedManhwa: any = null;
        try {
          const rawM =
            sessionStorage.getItem(`nekumi_manhwa_${manhwaId}`) ||
            sessionStorage.getItem(`nekumi_manhwa_full_${manhwaId}`);
          if (rawM) cachedManhwa = JSON.parse(rawM);
        } catch {}

        const manhwaPromise = cachedManhwa
          ? Promise.resolve({ data: cachedManhwa })
          : supabase.from("manhwas").select("id, title, cover_url").eq("id", manhwaId).maybeSingle();

        manhwaPromise.then(({ data: mInfo }) => {
          if (mInfo && !isCancelled) {
            try {
              const historyRaw = localStorage.getItem("nekumi_reading_history") || "[]";
              const historyList = Array.isArray(JSON.parse(historyRaw)) ? JSON.parse(historyRaw) : [];
              const filtered = historyList.filter((h: any) => h.manhwaId !== manhwaId);
              const updated = [
                {
                  manhwaId,
                  manhwaTitle: mInfo.title,
                  coverUrl: mInfo.cover_url,
                  chapterId,
                  chapterNumber: cData.chapter_number,
                  updatedAt: Date.now(),
                },
                ...filtered,
              ].slice(0, 10);
              localStorage.setItem("nekumi_reading_history", JSON.stringify(updated));
            } catch {}
          }
        });
      }

      if (pData && pData.length > 0) {
        setPages(pData);
        setLoading(false);
        try {
          sessionStorage.setItem(`nekumi_chap_${chapterId}`, JSON.stringify(pData));
        } catch {}
      } else if (!usedCache) {
        if (retryCount < 2) {
          retryTimer = setTimeout(() => {
            if (!isCancelled) setRetryCount((prev) => prev + 1);
          }, 800);
        } else {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [chapterId, manhwaId, retryCount]);

  // 60fps Smooth Auto-Scroll for Cascade Mode
  useEffect(() => {
    if (!autoScroll || readMode !== "cascade") return;

    let animationFrameId: number;
    const step = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= maxScroll - 2) {
        setAutoScroll(false);
        return;
      }
      window.scrollBy(0, scrollSpeed * 1.35);
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [autoScroll, readMode, scrollSpeed]);

  // Image Preloader for Paged Mode
  useEffect(() => {
    if (readMode === "paged" && pages.length > 0) {
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

  const goNextPage = useCallback(() => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
      window.scrollTo({ top: 0 });
    } else if (nextChapter) {
      router.push(`/manga/${manhwaId}/chapter/${nextChapter.id}`);
    }
  }, [currentPageIndex, pages.length, nextChapter, router, manhwaId]);

  const goPrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
      window.scrollTo({ top: 0 });
    } else if (prevChapter) {
      router.push(`/manga/${manhwaId}/chapter/${prevChapter.id}`);
    }
  }, [currentPageIndex, prevChapter, router, manhwaId]);

  // Keyboard navigation in Paged Mode
  useEffect(() => {
    if (readMode !== "paged") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNextPage();
      else if (e.key === "ArrowLeft") goPrevPage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readMode, goNextPage, goPrevPage]);

  const toggleReadMode = (mode: "cascade" | "paged") => {
    setReadMode(mode);
    if (mode === "paged") setAutoScroll(false);
    try {
      localStorage.setItem("nekutoon:readMode", mode);
    } catch {}
    setShowSettings(false);
    setCurrentPageIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Scroll listener for Header visibility and Progress Bar
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (currentScrollY / totalScroll) * 100)));
      }

      if (currentScrollY <= 24 || currentScrollY < lastScrollY - 6) {
        setShowReaderHeader(true);
      } else if (currentScrollY > lastScrollY + 8) {
        setShowReaderHeader(false);
        setShowSettings(false);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleReaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readMode === "cascade") {
      setShowReaderHeader((prev) => !prev);
      setShowSettings(false);
      return;
    }

    setShowReaderHeader(true);
    const { clientX } = e;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickX = clientX - left;

    if (clickX > width / 2) {
      goNextPage();
    } else {
      goPrevPage();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (readMode !== "paged") return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (readMode !== "paged" || touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) goNextPage();
      else goPrevPage();
    }
    touchStartX.current = null;
  };

  if (loading) return <NekuLoading fullScreen={true} />;

  if (!chapter) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-center px-4">
        <div className="glass p-10 rounded-3xl max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Capítulo no encontrado</h1>
          <Link href={`/manga/${manhwaId}`} className="btn btn-primary inline-flex">
            Volver al Manhwa
          </Link>
        </div>
      </div>
    );
  }

  const activeProgress =
    readMode === "paged" && pages.length > 0
      ? ((currentPageIndex + 1) / pages.length) * 100
      : scrollProgress;

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Top Navigation Bar */}
      <div
        className={`sticky top-0 z-50 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/5 py-3.5 px-4 sm:px-6 flex items-center justify-between transition-transform duration-300 ${
          showReaderHeader ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Reading Progress Indicator */}
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] transition-all duration-150"
          style={{ width: `${activeProgress}%` }}
        />

        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href={`/manga/${manhwaId}`}
            className="icon-btn hover:bg-white/10 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Volver al detalle del manhwa"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0 flex items-center gap-2.5">
            {allChapters.length > 1 ? (
              <select
                aria-label="Cambiar de capítulo"
                value={chapter.id}
                onChange={(e) => router.push(`/manga/${manhwaId}/chapter/${e.target.value}`)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 font-bold text-white text-xs sm:text-sm outline-none focus:border-[#a855f7] cursor-pointer"
              >
                {allChapters.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0a0a0c] text-white">
                    Capítulo {c.chapter_number}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <h1 className="font-bold text-white leading-tight truncate text-sm sm:text-base">
                  Capítulo {chapter.chapter_number}
                </h1>
                {chapter.title &&
                  chapter.title.replace(/[íìîï]/gi, "i").trim().toLowerCase() !==
                    `capitulo ${chapter.chapter_number}` && (
                    <p className="text-xs text-[#a7a7b1] truncate">{chapter.title}</p>
                  )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 relative flex-shrink-0">
          {prevChapter && (
            <button
              type="button"
              onClick={() => router.push(`/manga/${manhwaId}/chapter/${prevChapter.id}`)}
              className="flex icon-btn hover:bg-white/10 text-white rounded-full w-10 h-10 items-center justify-center transition-colors"
              title="Capítulo Anterior"
              aria-label="Capítulo Anterior"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {nextChapter && (
            <button
              type="button"
              onClick={() => router.push(`/manga/${manhwaId}/chapter/${nextChapter.id}`)}
              className="flex icon-btn hover:bg-white/10 text-white rounded-full w-10 h-10 items-center justify-center transition-colors"
              title="Siguiente Capítulo"
              aria-label="Siguiente Capítulo"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Configuración de lectura"
            className={`icon-btn text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors ${
              showSettings ? "bg-white/10" : "hover:bg-white/10"
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Settings Dropdown */}
          {showSettings && (
            <div className="absolute right-0 top-14 mt-2 w-64 bg-[#0a0a0c]/95 backdrop-blur-2xl border border-[#a855f7]/30 rounded-2xl shadow-[0_10px_40px_rgba(168,85,247,0.15)] overflow-hidden z-50 transform origin-top-right transition-all">
              <div className="px-5 py-3.5 border-b border-white/5 bg-gradient-to-r from-transparent to-[#a855f7]/5">
                <p className="text-[11px] font-black text-[#a855f7] uppercase tracking-widest">Modo de Lectura</p>
              </div>
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => toggleReadMode("cascade")}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left rounded-xl transition-all duration-300 ${
                    readMode === "cascade"
                      ? "bg-[#a855f7]/20 text-white font-bold shadow-inner"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <MonitorDown className={`w-4 h-4 ${readMode === "cascade" ? "text-[#a855f7]" : "text-white/50"}`} />{" "}
                  Cascada (Webtoon)
                </button>
                <button
                  type="button"
                  onClick={() => toggleReadMode("paged")}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left rounded-xl transition-all duration-300 ${
                    readMode === "paged"
                      ? "bg-[#a855f7]/20 text-white font-bold shadow-inner"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <BookOpen className={`w-4 h-4 ${readMode === "paged" ? "text-[#a855f7]" : "text-white/50"}`} />{" "}
                  Paginado (Manga)
                </button>
              </div>

              <div className="px-5 py-4 border-t border-white/5 bg-gradient-to-r from-transparent to-[#a855f7]/5">
                <p className="text-[11px] font-black text-[#a855f7] uppercase tracking-widest mb-3">
                  Auto-Scroll (Manos Libres)
                </p>
                {readMode === "paged" ? (
                  <p className="text-xs text-white/40 italic">Disponible únicamente en modo Cascada.</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAutoScroll(!autoScroll)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                        autoScroll
                          ? "bg-gradient-to-r from-[#a855f7] to-[#c084fc] text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                          : "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10"
                      }`}
                    >
                      {autoScroll ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      {autoScroll ? "Pausar" : "Iniciar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScrollSpeed((s) => (s >= 3 ? 1 : s + 1))}
                      className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-[#a855f7]/30 border border-[#a855f7]/30 text-white text-sm font-black flex items-center gap-1 transition-colors"
                      title="Cambiar velocidad"
                    >
                      <FastForward className="w-4 h-4 text-[#a855f7]" /> x{scrollSpeed}
                    </button>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-white/5 bg-gradient-to-r from-transparent to-[#a855f7]/5">
                <p className="text-[11px] font-black text-[#a855f7] uppercase tracking-widest mb-2.5">
                  Ancho de Página
                </p>
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {[
                    { id: "compact", label: "Compacto" },
                    { id: "normal", label: "Normal" },
                    { id: "wide", label: "Amplio" },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setReaderWidth(w.id as any)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        readerWidth === w.id
                          ? "bg-[#a855f7]/25 border-[#a855f7] text-white"
                          : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black text-[#a855f7] uppercase tracking-widest">
                    Brillo Nocturno
                  </span>
                  <span className="text-xs font-bold text-white/80">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min={45}
                  max={100}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  aria-label="Brillo de lectura"
                  className="w-full accent-[#a855f7] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Auto-Scroll Pause Pill when Header is Hidden */}
      {autoScroll && !showReaderHeader && (
        <button
          type="button"
          onClick={() => setAutoScroll(false)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#a855f7]/90 hover:bg-[#a855f7] text-white backdrop-blur-md px-5 py-2.5 rounded-full text-xs font-bold shadow-[0_0_25px_rgba(168,85,247,0.5)] flex items-center gap-2"
        >
          <Pause className="w-3.5 h-3.5 fill-current" /> Pausar Auto-Scroll (x{scrollSpeed})
        </button>
      )}

      {/* Reader Container */}
      <div
        ref={containerRef}
        style={{ filter: brightness < 100 ? `brightness(${brightness}%)` : undefined }}
        className={`${
          readerWidth === "compact" ? "max-w-xl" : readerWidth === "wide" ? "max-w-5xl" : "max-w-3xl"
        } mx-auto flex flex-col items-center transition-all duration-200 ${
          readMode === "paged" ? "cursor-pointer relative min-h-[75vh] select-none" : "cursor-pointer"
        }`}
        onClick={handleReaderClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {pages.length === 0 ? (
          <div className="p-16 text-center text-[#9b9ba6] w-full">
            <p className="text-base font-medium mb-4">Aún no se han subido las páginas de este capítulo.</p>
            <Link href={`/manga/${manhwaId}`} className="btn btn-secondary">
              Volver a la lista de capítulos
            </Link>
          </div>
        ) : readMode === "cascade" ? (
          pages.map((page, index) => (
            <img
              referrerPolicy="no-referrer"
              key={page.id}
              src={page.image_url}
              alt={`Página ${page.page_number}`}
              className="w-full h-auto block select-none"
              fetchPriority={index < 3 ? "high" : "auto"}
              loading={index < 3 ? "eager" : "lazy"}
              decoding="async"
            />
          ))
        ) : (
          <div className="w-full relative group">
            <img
              referrerPolicy="no-referrer"
              key={pages[currentPageIndex]?.id}
              src={pages[currentPageIndex]?.image_url}
              alt={`Página ${pages[currentPageIndex]?.page_number}`}
              className="w-full h-auto block select-none"
              fetchPriority="high"
            />

            {/* Navigation Guides Overlay */}
            <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-black/60 text-white p-2.5 rounded-r-xl backdrop-blur-sm">
                <ArrowLeft className="w-6 h-6" />
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-black/60 text-white p-2.5 rounded-l-xl backdrop-blur-sm">
                <ArrowRight className="w-6 h-6" />
              </div>
            </div>

            {/* Page Counter Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-white tracking-widest shadow-xl border border-white/10">
              {currentPageIndex + 1} / {pages.length}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation + Reactions + Chapter Comments */}
      <div className="bg-[#0a0a0c] border-t border-white/5 py-10 px-4 mt-8">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-white/5">
            <div className="flex gap-2.5 w-full sm:w-auto justify-between">
              <Link
                href={`/manga/${manhwaId}`}
                className="btn glass border border-white/10 hover:bg-white/5 flex-1 sm:flex-none"
              >
                Lista de Capítulos
              </Link>

              {prevChapter ? (
                <button
                  type="button"
                  onClick={() => router.push(`/manga/${manhwaId}/chapter/${prevChapter.id}`)}
                  className="btn glass border border-white/10 hover:bg-white/5 flex-1 sm:flex-none"
                >
                  <ArrowLeft className="w-4 h-4" /> Cap. {prevChapter.chapter_number}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="btn glass border border-white/10 opacity-40 cursor-not-allowed flex-1 sm:flex-none"
                >
                  Primer Cap.
                </button>
              )}
            </div>

            <div className="text-center hidden sm:block">
              <p className="text-sm font-semibold text-white">Fin del Capítulo {chapter.chapter_number}</p>
            </div>

            <div className="w-full sm:w-auto">
              {nextChapter ? (
                <button
                  type="button"
                  onClick={() => router.push(`/manga/${manhwaId}/chapter/${nextChapter.id}`)}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  Siguiente: Cap. {nextChapter.chapter_number} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href={`/manga/${manhwaId}`}
                  className="btn btn-secondary w-full sm:w-auto text-center"
                >
                  Al día — Volver a la Obra
                </Link>
              )}
            </div>
          </div>

          {/* Reacciones Rápidas Animadas */}
          <div className="glass rounded-3xl p-6 text-center border border-white/10">
            <h3 className="text-base sm:text-lg font-extrabold text-white mb-1">
              ¿Qué te pareció el Capítulo {chapter.chapter_number}?
            </h3>
            <p className="text-xs text-white/50 mb-5">Deja tu reacción rápida para la comunidad</p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
              {[
                { key: "epic", emoji: "🔥", label: "Épico" },
                { key: "shock", emoji: "😱", label: "Qué tensión" },
                { key: "love", emoji: "❤️", label: "Me encantó" },
                { key: "sad", emoji: "😭", label: "Triste" },
                { key: "rage", emoji: "🤬", label: "Cliffhanger" },
              ].map((r) => {
                const isSelected = userReactions.includes(r.key);
                const count = reactionCounts[r.key] || 0;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => handleToggleReaction(r.key)}
                    className={`group flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-[#a855f7]/30 to-[#ec4899]/30 border-[#a855f7] text-white scale-105 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                        : "bg-white/5 border-white/10 text-white/80 hover:border-[#a855f7]/50 hover:bg-white/10 hover:scale-105"
                    }`}
                  >
                    <span className="text-lg group-hover:scale-125 transition-transform inline-block">{r.emoji}</span>
                    <span>{r.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                        isSelected ? "bg-[#a855f7] text-white" : "bg-black/40 text-white/60"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sección de Comentarios del Capítulo */}
          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-2.5 mb-5">
              <MessageCircle className="w-5 h-5 text-[#a855f7]" />
              <h3 className="text-lg font-extrabold text-white">
                Comentarios del Capítulo {chapter.chapter_number} ({chapterComments.length})
              </h3>
            </div>

            <form onSubmit={handlePostChapterComment} className="space-y-3 mb-6">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Tu apodo (ej. SungJinWoo)"
                  maxLength={30}
                  className="sm:w-52 h-10 rounded-xl bg-black/40 border border-white/10 px-3.5 text-xs sm:text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#a855f7]"
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Escribe tu opinión sobre este capítulo..."
                    maxLength={500}
                    className="flex-1 h-10 rounded-xl bg-black/40 border border-white/10 px-3.5 text-xs sm:text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#a855f7]"
                  />
                  <button
                    type="submit"
                    disabled={commentSubmitting || !commentInput.trim()}
                    className="btn btn-primary px-4 h-10 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {commentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Enviar
                  </button>
                </div>
              </div>
            </form>

            {chapterComments.length === 0 ? (
              <p className="text-center text-xs sm:text-sm text-white/45 py-6">
                Sé el primero en comentar este capítulo.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {chapterComments.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/30 border border-white/5"
                  >
                    <div
                      className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 bg-black/50"
                      dangerouslySetInnerHTML={{ __html: getAvatarSvg(c.avatarKey || "hunter") }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-[#c084fc] truncate">{c.authorName || "Lector"}</span>
                        <span className="text-[11px] text-white/35">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Hoy"}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-white/85 leading-relaxed break-words">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
