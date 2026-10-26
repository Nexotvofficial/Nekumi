"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Bell,
  Heart,
  Menu,
  Star,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flame,
  User,
  LogOut,
  ArrowRight,
  MessagesSquare,
  Mail,
  MessageCircle,
  Camera,
  Video,
  Sparkles,
  Apple,
  Play,
  X as XIcon,
  Shield,
  Clock,
  Shuffle,
  SlidersHorizontal,
  Compass,
  Swords,
  Zap,
  Crown,
  Library,
  Trophy,
  Coins,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import { LegalModal } from "@/components/LegalModal";
import { AdsterraNative, AdsterraBanner300 } from "@/components/Adsterra";
import { getAvatarSvg } from "@/lib/avatars";
import { createClient } from "@/lib/supabase";
import { ReaderRankBadge, getLocalReaderStats, ReaderStats, getShopItemById } from "@/lib/readerRank";
import { syncReaderProgress, removeHistoryRemote } from "@/lib/readerSync";
import PublicListsSection from "@/components/PublicListsSection";
import GuildShopModal from "@/components/GuildShopModal";
import CommunityWallSection from "@/components/CommunityWallSection";

interface Manhwa {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  banner_url?: string;
  score: number;
  status?: string;
  genre: string;
  is_hero?: boolean;
  isNew?: boolean;
}

interface ReadingHistoryItem {
  manhwaId: string;
  manhwaTitle: string;
  coverUrl: string;
  chapterId: string;
  chapterNumber: number | string;
  updatedAt: number;
}

function formatRelativeDate(dateStr?: string) {
  if (!dateStr) return "Reciente";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Reciente";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 2) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays} d`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function Home({
  initialManhwas = [],
  initialTrending = [],
  initialReviews = [],
  initialChapters = [],
}: {
  initialManhwas?: Manhwa[];
  initialTrending?: Manhwa[];
  initialReviews?: any[];
  initialChapters?: any[];
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [showAdultModal, setShowAdultModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [realNotifications, setRealNotifications] = useState<any[]>(initialChapters.slice(0, 5));
  const [notificationsRead, setNotificationsRead] = useState(true);

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: any }>({ isOpen: false, type: "" });
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [manhwas, setManhwas] = useState<Manhwa[]>(initialManhwas);
  const [isLoading, setIsLoading] = useState(initialManhwas.length === 0);
  const [trending, setTrending] = useState<Manhwa[]>(initialTrending);
  const [recentReviews, setRecentReviews] = useState<any[]>(initialReviews);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "top" | "az" | "completed" | "ongoing">("recent");
  const [rankTab, setRankTab] = useState<"top" | "ongoing" | "completed">("top");
  const [activityTab, setActivityTab] = useState<"updates" | "history">("updates");
  const [recentChaptersRaw, setRecentChaptersRaw] = useState<any[]>(initialChapters);
  const [visibleCount, setVisibleCount] = useState<number>(36);
  const [readerStats, setReaderStats] = useState<ReaderStats | null>(null);
  const [showGuildShop, setShowGuildShop] = useState<boolean>(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSurpriseMe = () => {
    const pool = filteredManhwas.length > 0 ? filteredManhwas : manhwas;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    try {
      sessionStorage.setItem(`nekumi_manhwa_full_${pick.id}`, JSON.stringify(pick));
    } catch {}
    router.push(`/manga/${pick.id}`);
  };

  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 2200);
  };

  useEffect(() => {
    // Load local favorites & reading history
    try {
      const savedFavs = new Set<string>(JSON.parse(localStorage.getItem("nekutoon:favorites") || "[]"));
      setFavorites(savedFavs);
    } catch {}

    try {
      const savedHistory: ReadingHistoryItem[] = JSON.parse(localStorage.getItem("nekumi_reading_history") || "[]");
      if (Array.isArray(savedHistory)) {
        setReadingHistory(savedHistory.slice(0, 6));
      }
      setReaderStats(getLocalReaderStats());
    } catch {}

    try {
      if (sessionStorage.getItem("nekumi_adult_confirmed") === "1") {
        setIsAdultConfirmed(true);
      }
    } catch {}

    // Fallback client fetch ONLY if ISR initial props came back empty
    if (initialManhwas.length === 0) {
      supabase
        .from("manhwas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000)
        .then(({ data }) => {
          if (data && data.length > 0) setManhwas(data);
          setIsLoading(false);
        });
    }

    if (initialTrending.length === 0) {
      supabase
        .from("manhwas")
        .select("*")
        .order("score", { ascending: false })
        .limit(6)
        .then(({ data }) => {
          if (data && data.length > 0) setTrending(data);
        });
    }

    if (initialReviews.length === 0) {
      supabase
        .from("reviews")
        .select("*, manhwas(title, cover_url)")
        .order("created_at", { ascending: false })
        .limit(5)
        .then(({ data }) => {
          if (data) setRecentReviews(data);
        });
    }

    if (initialChapters.length > 0) {
      try {
        const lastReadId = localStorage.getItem("lastReadNotification");
        setNotificationsRead(lastReadId === initialChapters[0].id);
      } catch {
        setNotificationsRead(false);
      }
    } else {
      supabase
        .from("chapters")
        .select("id, manhwa_id, chapter_number, created_at, manhwa:manhwas(id, title)")
        .not("manhwa_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(120)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setRecentChaptersRaw(data);
            setRealNotifications(data.slice(0, 5));
            try {
              const lastReadId = localStorage.getItem("lastReadNotification");
              setNotificationsRead(lastReadId === data[0].id);
            } catch {
              setNotificationsRead(false);
            }
          }
        });
    }

    // Deduplicate visit tracking per browser session
    try {
      if (!sessionStorage.getItem("nekumi_visit_logged")) {
        sessionStorage.setItem("nekumi_visit_logged", "1");
        supabase.from("visits").insert([{}]).then();
      }
    } catch {}

    const syncUserAndFavorites = async (sessionUser: any) => {
      setUser(sessionUser);
      if (sessionUser) {
        const [profRes, favRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", sessionUser.id).single(),
          supabase.from("favorites").select("manhwa_id").eq("user_id", sessionUser.id),
        ]);
        if (profRes.data) setUserProfile(profRes.data);
        syncReaderProgress(supabase, sessionUser.id).then((ok) => {
          if (!ok) return;
          setReaderStats(getLocalReaderStats());
          try {
            const h = JSON.parse(localStorage.getItem("nekumi_reading_history") || "[]");
            if (Array.isArray(h)) setReadingHistory(h.slice(0, 6));
          } catch {}
        });
        if (favRes.data) {
          const dbFavIds = favRes.data.map((r: any) => String(r.manhwa_id));
          setFavorites((prev) => {
            const merged = new Set([...prev, ...dbFavIds]);
            try {
              localStorage.setItem("nekutoon:favorites", JSON.stringify([...merged]));
            } catch {}
            return merged;
          });
        }
      } else {
        setUserProfile(null);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUserAndFavorites(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUserAndFavorites(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleCategoryClick = (e: any, category: string) => {
    e?.preventDefault();
    if (category === "+18" && !isAdultConfirmed) {
      setPendingCategory("+18");
      setShowAdultModal(true);
    } else {
      setActiveCategory(category);
      setVisibleCount(36);
    }
  };

  const handleFavoritesFilterClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    const nextCat = activeCategory === "Favoritos" ? "" : "Favoritos";
    setActiveCategory(nextCat);
    setVisibleCount(36);
    document.getElementById("recomendados")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileMenu(false);
    showToastMessage("Sesión cerrada correctamente");
  };

  const toggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const next = new Set(favorites);
    const isRemoving = next.has(id);

    if (isRemoving) {
      next.delete(id);
      showToastMessage("Eliminado de tus favoritos");
    } else {
      next.add(id);
      showToastMessage("Añadido a tus favoritos");
    }

    setFavorites(next);
    try {
      localStorage.setItem("nekutoon:favorites", JSON.stringify([...next]));
    } catch {}

    if (user) {
      if (isRemoving) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("manhwa_id", id);
      } else {
        await supabase.from("favorites").insert([{ user_id: user.id, manhwa_id: id }]);
      }
    }
  };

  const removeHistoryItem = (manhwaId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = readingHistory.filter((item) => item.manhwaId !== manhwaId);
    setReadingHistory(updated);
    try {
      localStorage.setItem("nekumi_reading_history", JSON.stringify(updated));
    } catch {}
    removeHistoryRemote(supabase, user?.id, manhwaId);
  };

  const filteredManhwas = useMemo(() => {
    const norm = (s: string) =>
      (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const q = norm(searchQuery);
    const cat = norm(activeCategory);

    const list = manhwas.filter((m) => {
      const titleNorm = norm(m.title);
      const genreNorm = norm(m.genre);
      const matchesSearch = !q || titleNorm.includes(q) || genreNorm.includes(q);

      if (activeCategory === "Favoritos") {
        return matchesSearch && favorites.has(m.id);
      }

      if (!cat) {
        return matchesSearch;
      }

      if (activeCategory === "+18") {
        const isAdult =
          genreNorm.includes("+18") ||
          genreNorm.includes("+19") ||
          genreNorm.includes("sin censura") ||
          genreNorm.includes("maduro") ||
          genreNorm.includes("adulto") ||
          genreNorm.includes("ecchi") ||
          genreNorm.includes("smut") ||
          genreNorm.includes("hentai") ||
          genreNorm.includes("erotico");
        return matchesSearch && isAdult;
      }

      if (cat === "bl" || cat === "boys love") {
        const isBL =
          /\bbl\b/.test(genreNorm) ||
          genreNorm.includes("boys love") ||
          genreNorm.includes("yaoi") ||
          genreNorm.includes("shonen ai");
        return matchesSearch && isBL;
      }

      if (cat === "accion") {
        return (
          matchesSearch &&
          (genreNorm.includes("accion") || genreNorm.includes("action") || genreNorm.includes("artes marciales"))
        );
      }

      if (cat === "fantasia") {
        return (
          matchesSearch &&
          (genreNorm.includes("fantasia") || genreNorm.includes("fantasy") || genreNorm.includes("magia"))
        );
      }

      if (cat === "isekai") {
        return (
          matchesSearch &&
          (genreNorm.includes("isekai") ||
            genreNorm.includes("reencarnacion") ||
            genreNorm.includes("transmigracion") ||
            genreNorm.includes("regresion"))
        );
      }

      return matchesSearch && genreNorm.includes(cat);
    });

    if (sortBy === "completed") {
      return list.filter((m) => m.status === "Finalizado");
    }
    if (sortBy === "ongoing") {
      return list.filter((m) => m.status !== "Finalizado");
    }
    if (sortBy === "top") {
      return [...list].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    }
    if (sortBy === "az") {
      return [...list].sort((a, b) => (a.title || "").localeCompare(b.title || "", "es"));
    }
    return list;
  }, [manhwas, searchQuery, activeCategory, favorites, sortBy]);

  const handleAvatarClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const displayHeroes = useMemo(() => {
    const heroManhwas = manhwas.filter((m) => m.is_hero);
    return heroManhwas.length > 0 ? heroManhwas : manhwas.slice(0, 4);
  }, [manhwas]);

  // Olympus Scanlation style: group recent chapters by manhwa (up to 2 latest chapters per series)
  const { recentUpdatedManhwas, latestChapByManhwa } = useMemo(() => {
    const manhwaMap = new Map<string, Manhwa>();
    for (const m of manhwas) {
      manhwaMap.set(m.id, m);
    }

    const grouped = new Map<string, { manhwa: Manhwa; chapters: { id: string; chapter_number: number; created_at: string }[] }>();
    const latestSingle = new Map<string, number>();

    for (const ch of recentChaptersRaw) {
      const mid = ch.manhwa_id || ch.manhwa?.id;
      if (!mid) continue;
      const mObj = manhwaMap.get(mid);
      if (!mObj) continue;

      if (!latestSingle.has(mid) || Number(ch.chapter_number) > (latestSingle.get(mid) || 0)) {
        latestSingle.set(mid, Number(ch.chapter_number));
      }

      if (!grouped.has(mid)) {
        grouped.set(mid, { manhwa: mObj, chapters: [] });
      }
      const entry = grouped.get(mid)!;
      if (!entry.chapters.some((c) => c.chapter_number === ch.chapter_number)) {
        entry.chapters.push({
          id: ch.id,
          chapter_number: ch.chapter_number,
          created_at: ch.created_at,
        });
      }
    }

    const list = Array.from(grouped.values()).map((entry) => ({
      manhwa: entry.manhwa,
      chapters: entry.chapters
        .sort((a, b) => Number(b.chapter_number) - Number(a.chapter_number))
        .slice(0, 2),
    }));

    const maxEven = list.length >= 8 ? 8 : list.length >= 6 ? 6 : list.length >= 4 ? 4 : list.length;

    return {
      recentUpdatedManhwas: list.slice(0, maxEven),
      latestChapByManhwa: latestSingle,
    };
  }, [manhwas, recentChaptersRaw]);

  const sidebarRanked = useMemo(() => {
    const base = manhwas.length > 0 ? manhwas : trending;
    if (rankTab === "ongoing") {
      return base.filter((m) => m.status !== "Finalizado").slice(0, 5);
    }
    if (rankTab === "completed") {
      return base.filter((m) => m.status === "Finalizado").slice(0, 5);
    }
    return [...base]
      .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
      .slice(0, 5);
  }, [manhwas, trending, rankTab]);

  useEffect(() => {
    if (displayHeroes.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % displayHeroes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [displayHeroes.length]);

  return (
    <>
      <header className="site-header">
        <div className="shell">
          <div className="header-inner">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveCategory("");
                setSearchQuery("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="brand group"
              aria-label="Nekutoon, inicio"
            >
              <svg
                className="brand-mark w-10 h-10 drop-shadow-[0_6px_20px_rgba(168,85,247,0.45)] transition-transform group-hover:scale-105 duration-300"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="nk-bg-hdr" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1d1138" />
                    <stop offset="55%" stopColor="#0f091d" />
                    <stop offset="100%" stopColor="#07050e" />
                  </linearGradient>
                  <linearGradient id="nk-rim-hdr" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#e879f9" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f472b6" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="nk-left-hdr" x1="14" y1="10" x2="14" y2="38" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#e9d5ff" />
                    <stop offset="45%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#5b21b6" />
                  </linearGradient>
                  <linearGradient id="nk-right-hdr" x1="34" y1="10" x2="34" y2="38" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f5d0fe" />
                    <stop offset="55%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                  <linearGradient id="nk-slash-hdr" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="48%" stopColor="#d946ef" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                {/* Escudo facetado Obsidian con corona sutil */}
                <rect
                  x="2.5"
                  y="2.5"
                  width="43"
                  height="43"
                  rx="13.5"
                  fill="url(#nk-bg-hdr)"
                  stroke="url(#nk-rim-hdr)"
                  strokeWidth="1.5"
                />
                <rect
                  x="5.5"
                  y="5.5"
                  width="37"
                  height="37"
                  rx="10.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                {/* Pilares verticales biselados de la N */}
                <path
                  d="M11.5 13C11.5 11.6 12.6 10.5 14 10.5H17.4V37.5H14C12.6 37.5 11.5 36.4 11.5 35V13Z"
                  fill="url(#nk-left-hdr)"
                />
                <path
                  d="M30.6 10.5H34C35.4 10.5 36.5 11.6 36.5 13V35C36.5 36.4 35.4 37.5 34 37.5H30.6V10.5Z"
                  fill="url(#nk-right-hdr)"
                />
                {/* Sombra profunda bajo la cinta diagonal */}
                <path d="M12.5 12.2H19.8L35.8 37.5H28.5L12.5 12.2Z" fill="rgba(0,0,0,0.55)" />
                {/* Cinta diagonal 3D principal */}
                <path d="M12 10.5H19.2L36 37.5H28.8L12 10.5Z" fill="url(#nk-slash-hdr)" />
                {/* Brillo especular superior en la diagonal */}
                <path
                  d="M13.2 11.2L29.3 36.8"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
              </svg>
              <span className="brand-word tracking-[-0.03em] text-[23px] font-black uppercase flex items-center">
                <span className="text-white">Neku</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c084fc] via-[#e879f9] to-[#f472b6] drop-shadow-[0_2px_14px_rgba(236,72,153,0.45)]">
                  toon
                </span>
              </span>
            </a>

            <nav className="desktop-nav" aria-label="Navegación principal">
              <a
                className={`nav-link ${!activeCategory ? "active" : ""}`}
                href="#recomendados"
                onClick={(e) => handleCategoryClick(e, "")}
              >
                <span>Catálogo</span>
              </a>
              <a
                className="nav-link"
                href="#listas-publicas"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("listas-publicas")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span>Listas Públicas</span>
              </a>
              <a
                className="nav-link"
                href="#muro-comunidad"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("muro-comunidad")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span>Comunidad</span>
              </a>
              <button
                type="button"
                onClick={() => setShowGuildShop(true)}
                className="nav-link cursor-pointer"
              >
                <span>Tienda</span>
              </button>
              <a
                className={`nav-link ${activeCategory === "+18" ? "active" : ""}`}
                href="#recomendados"
                onClick={(e) => handleCategoryClick(e, "+18")}
              >
                <span>+18</span>
              </a>
            </nav>

            <div className="header-actions">
              <div className="search-wrap desktop-search relative">
                <Search />
                <label className="sr-only" htmlFor="desktopSearch">
                  Buscar
                </label>
                <input
                  id="desktopSearch"
                  className="search-input"
                  type="search"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFocused(true);
                  }}
                  placeholder="Buscar manhwas, géneros..."
                  autoComplete="off"
                />
                {searchFocused && searchQuery.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 w-80 sm:w-96 bg-[#101015]/95 backdrop-blur-2xl border border-[#a855f7]/35 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-[90]">
                    <div className="px-3.5 py-2 border-b border-white/5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#c084fc]">
                      <span>Resultados en vivo ({filteredManhwas.length})</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchFocused(false);
                          document.getElementById("recomendados")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="text-white/60 hover:text-white inline-flex items-center gap-0.5"
                      >
                        Ver todos <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {filteredManhwas.length === 0 ? (
                      <div className="p-4 text-center text-xs text-white/50">
                        No se encontraron manhwas con &ldquo;{searchQuery}&rdquo;
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                        {filteredManhwas.slice(0, 6).map((item) => (
                          <Link
                            key={`live-${item.id}`}
                            href={`/manga/${item.id}`}
                            onClick={() => {
                              setSearchFocused(false);
                              try {
                                sessionStorage.setItem(`nekumi_manhwa_full_${item.id}`, JSON.stringify(item));
                              } catch {}
                            }}
                            className="flex items-center gap-3 p-2.5 hover:bg-[#a855f7]/15 transition-colors"
                          >
                            <img
                              referrerPolicy="no-referrer"
                              src={item.cover_url}
                              alt={item.title}
                              className="w-10 h-14 object-cover rounded-lg border border-white/10 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">{item.title}</p>
                              <p className="text-[11px] text-white/50 truncate mt-0.5">{item.genre}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#fbbf24]">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  {Number(item.score) > 0 ? item.score : "Sin votos"}
                                </span>
                                <span className="text-[10px] text-[#c084fc] font-semibold">
                                  {item.status || "En emisión"}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                className="icon-btn menu-btn"
                type="button"
                aria-label="Mostrar buscador"
                onClick={() => setMobileSearchVisible(!mobileSearchVisible)}
              >
                <Search />
              </button>

              <div className="notification-wrap">
                <button
                  className="icon-btn"
                  type="button"
                  aria-label="Notificaciones"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell />
                  {!notificationsRead && realNotifications.length > 0 && (
                    <span className="notification-badge">{realNotifications.length}</span>
                  )}
                </button>
                <div className={`notification-dropdown glass ${notificationsOpen ? "open" : ""}`}>
                  <div className="notification-head">
                    <strong>Notificaciones</strong>
                    {realNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsRead(true);
                          try {
                            localStorage.setItem("lastReadNotification", realNotifications[0].id);
                          } catch {}
                          showToastMessage("Notificaciones marcadas como leídas");
                        }}
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>
                  {realNotifications.length === 0 ? (
                    <div className="p-4 text-center text-white/50 text-sm">No hay notificaciones recientes</div>
                  ) : (
                    realNotifications.map((notif) => (
                      <Link
                        href={`/manga/${notif.manhwa?.id}`}
                        key={notif.id}
                        onClick={() => setNotificationsOpen(false)}
                        className="notification-item"
                      >
                        <span className="notification-icon">
                          <Sparkles />
                        </span>
                        <span>
                          <b>{notif.manhwa?.title}</b>
                          <small>
                            Capítulo {notif.chapter_number} · {formatRelativeDate(notif.created_at)}
                          </small>
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <button
                className="icon-btn"
                type="button"
                aria-label="Manhwa aleatorio (Sorpréndeme)"
                title="¡Sorpréndeme con un manhwa al azar!"
                onClick={handleSurpriseMe}
              >
                <Shuffle className="text-[#c084fc]" />
              </button>

              <button
                className={`icon-btn favorite-toggle ${activeCategory === "Favoritos" || favorites.size > 0 ? "active" : ""}`}
                type="button"
                aria-label="Ver mis favoritos"
                title={`Mis favoritos (${favorites.size})`}
                onClick={handleFavoritesFilterClick}
              >
                <Heart />
              </button>

              {user?.email === "diazmowi07@gmail.com" && (
                <Link
                  href="/admin"
                  className="btn bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/30 hover:bg-[#a855f7]/30 font-bold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" /> Admin
                </Link>
              )}

              {readerStats && (
                <button
                  type="button"
                  onClick={() => setShowGuildShop(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-[#a855f7]/15 border border-white/10 hover:border-[#a855f7]/45 text-zinc-200 text-xs font-extrabold transition-all cursor-pointer"
                  title="Abrir Tienda del Gremio (Marcos y Títulos por leer)"
                >
                  <Coins className="w-3.5 h-3.5 text-[#c084fc]" />
                  <span>{readerStats.coins}</span>
                </button>
              )}

              <div className="relative">
                <button
                  type="button"
                  aria-label="Abrir perfil"
                  onClick={handleAvatarClick}
                  className="inline-flex items-center gap-2.5 pl-1.5 pr-3.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.11] border border-white/15 hover:border-[#a855f7]/60 transition-all cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full overflow-hidden bg-black/50 p-0.5 flex-shrink-0 border border-[#a855f7]/60"
                    style={
                      getShopItemById(readerStats?.equipped?.frameId)?.glowCss
                        ? { boxShadow: getShopItemById(readerStats?.equipped?.frameId)?.glowCss }
                        : undefined
                    }
                    dangerouslySetInnerHTML={{ __html: getAvatarSvg(userProfile?.avatar_url || "hunter") }}
                  />
                  <div className="hidden sm:flex flex-col items-start leading-tight text-left">
                    <span className="text-xs font-extrabold text-white">
                      {userProfile?.username || user?.email?.split("@")[0] || "Mi Perfil"}
                    </span>
                    <span className="text-[10px] font-bold text-[#c084fc]">
                      {readerStats
                        ? `Rango ${readerStats.currentRank.code} · Nv.${readerStats.level}`
                        : "Ver Rango"}
                    </span>
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2.5 w-56 bg-[#12131a]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden z-50 flex flex-col animate-in fade-in zoom-in-95">
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="px-4 py-3 text-xs font-extrabold text-white hover:bg-white/5 border-b border-white/5 flex items-center gap-2.5"
                    >
                      <User className="w-4 h-4 text-[#c084fc]" /> Mi Perfil y Tarjeta de Rango
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowGuildShop(true);
                      }}
                      className="px-4 py-3 text-xs font-extrabold text-amber-300 hover:bg-white/5 border-b border-white/5 text-left flex items-center gap-2.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-amber-400" /> Tienda del Gremio ({readerStats?.coins ?? 250} Coins)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleFavoritesFilterClick();
                      }}
                      className="px-4 py-3 text-xs font-extrabold text-white hover:bg-white/5 border-b border-white/5 text-left flex items-center gap-2.5 cursor-pointer"
                    >
                      <Heart className="w-4 h-4 text-[#ec4899]" /> Mis Favoritos ({favorites.size})
                    </button>
                    {user ? (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-4 py-3 text-xs font-extrabold text-red-400 hover:bg-white/5 text-left flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setIsAuthOpen(true);
                        }}
                        className="px-4 py-3 text-xs font-extrabold text-[#c084fc] hover:bg-white/5 text-left flex items-center gap-2.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" /> Iniciar Sesión / Registrarse
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                className="icon-btn menu-btn"
                type="button"
                aria-label="Abrir menú"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
              >
                {mobileNavOpen ? <XIcon /> : <Menu />}
              </button>
            </div>
          </div>

          {mobileSearchVisible && (
            <div className="mobile-search visible relative">
              <div className="search-wrap">
                <Search />
                <label className="sr-only" htmlFor="mobileSearchInput">
                  Buscar
                </label>
                <input
                  id="mobileSearchInput"
                  className="search-input"
                  type="search"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFocused(true);
                  }}
                  placeholder="Buscar manhwas, géneros..."
                />
              </div>
              {searchQuery.trim().length > 0 && (
                <div className="mt-2 bg-[#101015]/95 backdrop-blur-2xl border border-[#a855f7]/35 rounded-2xl shadow-2xl overflow-hidden z-[90]">
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                    {filteredManhwas.slice(0, 5).map((item) => (
                      <Link
                        key={`mlive-${item.id}`}
                        href={`/manga/${item.id}`}
                        onClick={() => {
                          setMobileSearchVisible(false);
                          try {
                            sessionStorage.setItem(`nekumi_manhwa_full_${item.id}`, JSON.stringify(item));
                          } catch {}
                        }}
                        className="flex items-center gap-3 p-2.5 hover:bg-[#a855f7]/15 transition-colors"
                      >
                        <img
                          referrerPolicy="no-referrer"
                          src={item.cover_url}
                          alt={item.title}
                          className="w-10 h-14 object-cover rounded-lg border border-white/10 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{item.title}</p>
                          <p className="text-[11px] text-white/50 truncate">{item.genre}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#fbbf24]">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            {Number(item.score) > 0 ? item.score : "Sin votos"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <nav className={`mobile-nav ${mobileNavOpen ? "open" : ""}`} aria-label="Navegación móvil">
            <a
              href="#recomendados"
              onClick={(e) => {
                handleCategoryClick(e, "");
                setMobileNavOpen(false);
              }}
            >
              Explorar
            </a>
            <a
              href="#listas-publicas"
              onClick={(e) => {
                e.preventDefault();
                setMobileNavOpen(false);
                document.getElementById("listas-publicas")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-emerald-400 font-bold"
            >
              Listas Públicas
            </a>
            <Link
              href="/profile"
              onClick={() => setMobileNavOpen(false)}
              className="text-[#c084fc] font-bold"
            >
              Mi Rango de Cazador / Perfil
            </Link>
            <a
              href="#recomendados"
              onClick={(e) => {
                handleFavoritesFilterClick(e);
                setMobileNavOpen(false);
              }}
            >
              Mis Favoritos ({favorites.size})
            </a>
            <a
              href="#recomendados"
              onClick={(e) => {
                handleCategoryClick(e, "Acción");
                setMobileNavOpen(false);
              }}
            >
              Acción
            </a>
            <a
              href="#recomendados"
              onClick={(e) => {
                handleCategoryClick(e, "Fantasía");
                setMobileNavOpen(false);
              }}
            >
              Fantasía
            </a>
            <a
              href="#recomendados"
              onClick={(e) => {
                handleCategoryClick(e, "Romance");
                setMobileNavOpen(false);
              }}
            >
              Romance
            </a>
            <a
              href="#recomendados"
              onClick={(e) => {
                handleCategoryClick(e, "Isekai");
                setMobileNavOpen(false);
              }}
            >
              Isekai
            </a>
            <a
              href="#recomendados"
              onClick={(e) => {
                handleCategoryClick(e, "Drama");
                setMobileNavOpen(false);
              }}
            >
              Drama
            </a>
            <a
              href="#recomendados"
              onClick={(e) => {
                handleCategoryClick(e, "Comedia");
                setMobileNavOpen(false);
              }}
            >
              Comedia
            </a>
            <a
              href="#recomendados"
              onClick={(e) => {
                handleCategoryClick(e, "BL");
                setMobileNavOpen(false);
              }}
            >
              BL
            </a>
            <a
              href="#recomendados"
              onClick={(e) => {
                handleCategoryClick(e, "+18");
                setMobileNavOpen(false);
              }}
              className="text-pink-500"
            >
              +18
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Modal de Advertencia +18 */}
        {showAdultModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-[#121214] border border-[#2a2a35] p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
              <div className="w-16 h-16 bg-pink-500/10 text-pink-500 flex items-center justify-center rounded-full mx-auto mb-6">
                <Shield size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Contenido para Adultos</h2>
              <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                Esta sección contiene material para mayores de edad (+18). Al confirmar, declaras tener la mayoría de
                edad legal en tu país.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAdultModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-medium bg-[#2a2a35] text-white hover:bg-[#3a3a45] transition-colors"
                >
                  No, volver
                </button>
                <button
                  onClick={() => {
                    setIsAdultConfirmed(true);
                    try {
                      sessionStorage.setItem("nekumi_adult_confirmed", "1");
                    } catch {}
                    setShowAdultModal(false);
                    setActiveCategory(pendingCategory);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-medium bg-pink-500 text-white hover:bg-pink-600 transition-colors shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                >
                  Sí, soy mayor
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="shell page-grid">
          <div className="main-column">
            {/* Adsterra Native Banner */}
            {!activeCategory && !searchQuery && <AdsterraNative />}

            {displayHeroes.length > 0 && (
              <section className="hero grid" aria-labelledby="heroTitle">
                {displayHeroes.map((hero, idx) => (
                  <img
                    referrerPolicy="no-referrer"
                    key={`bg-${hero.id}`}
                    className={`hero-bg transition-opacity duration-700 ease-in-out ${
                      idx === currentHeroIndex ? "opacity-100" : "opacity-0"
                    }`}
                    src={hero.banner_url || hero.cover_url}
                    alt={`Ilustración de ${hero.title}`}
                    fetchPriority={idx === 0 ? "high" : "auto"}
                  />
                ))}

                {displayHeroes.map((hero, idx) => {
                  const isCurrent = idx === currentHeroIndex;
                  const HeadingTag = isCurrent ? "h1" : "h2";
                  return (
                    <div
                      key={`content-${hero.id}`}
                      aria-hidden={!isCurrent}
                      className={`hero-content col-start-1 row-start-1 transition-opacity duration-700 ease-in-out ${
                        isCurrent ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0"
                      }`}
                    >
                      <div className="hero-kicker">
                        <span className="tag accent">{hero.genre}</span>
                        <span className="tag">{hero.status || "Webtoon"}</span>
                      </div>
                      <HeadingTag id={isCurrent ? "heroTitle" : undefined} className="hero-title uppercase">
                        {hero.title}
                      </HeadingTag>
                      <div className="hero-meta">
                        <span className="rating">
                          <Star />
                          {Number(hero.score) > 0 ? Number(hero.score).toFixed(1) : "Destacado"}
                        </span>
                        <span className="meta-separator"></span>
                        <span>Catálogo Oficial Nekutoon</span>
                      </div>
                      <p className="hero-copy line-clamp-3">{hero.description}</p>
                      <div className="hero-actions">
                        <Link
                          href={`/manga/${hero.id}`}
                          className="btn btn-primary"
                          onClick={() => {
                            try {
                              sessionStorage.setItem(`nekumi_manhwa_full_${hero.id}`, JSON.stringify(hero));
                            } catch {}
                          }}
                        >
                          <BookOpen /> Leer Ahora
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(hero.id, e)}
                          className={`btn btn-secondary ${favorites.has(hero.id) ? "border-pink-500/50 text-pink-400" : ""}`}
                        >
                          <Heart className={favorites.has(hero.id) ? "fill-current text-pink-500" : ""} />
                          {favorites.has(hero.id) ? "En Favoritos" : "Guardar"}
                        </button>
                        <button
                          type="button"
                          onClick={handleSurpriseMe}
                          className="btn btn-secondary border-[#a855f7]/40 text-[#d8b4fe] hover:bg-[#a855f7]/20"
                          title="Abrir un manhwa recomendado al azar"
                        >
                          <Shuffle className="w-4 h-4" /> Sorpréndeme
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Selector interactivo de mini-pósters + flechas en el Hero (Estilo Olympus / Asura) */}
                {displayHeroes.length > 1 && (
                  <div className="absolute right-5 bottom-5 z-20 flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-black/55 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10">
                      {displayHeroes.map((hero, idx) => (
                        <button
                          key={`thumb-${hero.id}`}
                          type="button"
                          onClick={() => setCurrentHeroIndex(idx)}
                          aria-label={`Ver ${hero.title}`}
                          className={`relative w-10 h-14 rounded-xl overflow-hidden transition-all cursor-pointer ${
                            idx === currentHeroIndex
                              ? "ring-2 ring-[#c084fc] scale-105 opacity-100 shadow-[0_0_15px_rgba(192,132,252,0.5)]"
                              : "opacity-45 hover:opacity-80"
                          }`}
                        >
                          <img
                            referrerPolicy="no-referrer"
                            src={hero.cover_url}
                            alt={hero.title}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="Destacado anterior"
                        onClick={() =>
                          setCurrentHeroIndex((prev) => (prev - 1 + displayHeroes.length) % displayHeroes.length)
                        }
                        className="w-9 h-9 rounded-full bg-black/55 hover:bg-[#a855f7]/35 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Siguiente destacado"
                        onClick={() => setCurrentHeroIndex((prev) => (prev + 1) % displayHeroes.length)}
                        className="w-9 h-9 rounded-full bg-black/55 hover:bg-[#a855f7]/35 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Hub Unificado: Últimas Actualizaciones + Continuar Leyendo (Diseño espacioso de 2 columnas, sin apiñamiento) */}
            {(recentUpdatedManhwas.length > 0 || readingHistory.length > 0) && !searchQuery && !activeCategory && (
              <section className="section mt-8 mb-10" aria-label="Actividad reciente y capítulos actualizados">
                <div className="section-heading flex-wrap gap-3 mb-5">
                  <div className="flex items-center gap-2 bg-[#121216] p-1 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setActivityTab("updates")}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        activityTab === "updates"
                          ? "bg-gradient-to-r from-[#7c3aed] to-[#d946ef] text-white shadow-[0_4px_15px_rgba(139,92,246,0.35)]"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      Últimas Actualizaciones
                    </button>

                    {readingHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActivityTab("history")}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          activityTab === "history"
                            ? "bg-gradient-to-r from-[#7c3aed] to-[#d946ef] text-white shadow-[0_4px_15px_rgba(139,92,246,0.35)]"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        Continuar Leyendo ({readingHistory.length})
                      </button>
                    )}
                  </div>

                  <span className="text-xs font-medium text-white/40 hidden md:inline">
                    {activityTab === "updates"
                      ? "Episodios recién publicados con acceso directo"
                      : "Retoma tu lectura donde la dejaste"}
                  </span>
                </div>

                {activityTab === "history" && readingHistory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {readingHistory.slice(0, 4).map((item) => (
                      <Link
                        key={`hist-${item.manhwaId}`}
                        href={`/manga/${item.manhwaId}/chapter/${item.chapterId}`}
                        className="glass rounded-2xl p-4 flex items-center gap-4 border border-white/10 hover:border-[#a855f7]/50 transition-all group relative"
                      >
                        <img
                          referrerPolicy="no-referrer"
                          src={item.coverUrl}
                          alt={item.manhwaTitle}
                          className="w-20 h-28 object-cover rounded-xl flex-shrink-0 border border-white/10 group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1 pr-6">
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#c084fc] bg-[#a855f7]/15 border border-[#a855f7]/25 px-2.5 py-0.5 rounded-md mb-1.5">
                            En progreso
                          </span>
                          <h3 className="text-base font-bold text-white truncate group-hover:text-[#c084fc] transition-colors">
                            {item.manhwaTitle}
                          </h3>
                          <p className="text-xs text-white/70 font-semibold mt-1">
                            Último leído: <span className="text-[#d8b4fe]">Capítulo {item.chapterNumber}</span>
                          </p>
                          <span className="text-xs text-[#c084fc] font-bold inline-flex items-center gap-1 mt-2.5 group-hover:translate-x-0.5 transition-transform">
                            Continuar lectura <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-label={`Quitar ${item.manhwaTitle} del historial`}
                          onClick={(e) => removeHistoryItem(item.manhwaId, e)}
                          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 flex items-center justify-center transition-colors"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentUpdatedManhwas.map(({ manhwa: m, chapters: chList }) => {
                      const cleanGenres = (m.genre || "Acción")
                        .split(",")
                        .map((g) => g.trim())
                        .filter((g) => g.length > 1)
                        .slice(0, 3)
                        .join(" · ");
                      return (
                        <article
                          key={`upd-${m.id}`}
                          className="glass rounded-2xl p-4 flex gap-4 border border-white/10 hover:border-[#a855f7]/45 transition-all group"
                        >
                          <Link
                            href={`/manga/${m.id}`}
                            className="relative w-[84px] h-[118px] flex-shrink-0 rounded-xl overflow-hidden border border-white/10"
                            onClick={() => {
                              try {
                                sessionStorage.setItem(`nekumi_manhwa_full_${m.id}`, JSON.stringify(m));
                              } catch {}
                            }}
                          >
                            <img
                              referrerPolicy="no-referrer"
                              src={m.cover_url}
                              alt={m.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#c084fc] shadow-[0_0_8px_#a855f7]" />
                          </Link>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <Link
                                href={`/manga/${m.id}`}
                                onClick={() => {
                                  try {
                                    sessionStorage.setItem(`nekumi_manhwa_full_${m.id}`, JSON.stringify(m));
                                  } catch {}
                                }}
                              >
                                <h3 className="text-[15px] font-bold text-white truncate group-hover:text-[#c084fc] transition-colors">
                                  {m.title}
                                </h3>
                              </Link>
                              <p className="text-xs text-white/45 truncate mt-0.5">{cleanGenres}</p>
                            </div>

                            <div className="space-y-2 mt-2.5">
                              {chList.map((ch, cIdx) => (
                                <Link
                                  key={ch.id}
                                  href={`/manga/${m.id}/chapter/${ch.id}`}
                                  className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#a855f7]/20 border border-white/5 hover:border-[#a855f7]/40 transition-colors text-xs"
                                >
                                  <span className="font-bold text-white/90 flex items-center gap-2">
                                    <BookOpen className="w-3.5 h-3.5 text-[#c084fc]" />
                                    <span>Cap. {ch.chapter_number}</span>
                                    {cIdx === 0 && (
                                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#a855f7]/25 text-[#d8b4fe] font-extrabold">
                                        Nuevo
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[11px] text-white/45">{formatRelativeDate(ch.created_at)}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="sidebar">
            <section className="side-panel glass" aria-labelledby="trendingTitle">
              <div className="side-header">
                <h2 id="trendingTitle" className="side-title">
                  Ranking Nekutoon
                </h2>
                <span className="side-title-icon">
                  <Flame />
                </span>
              </div>

              {/* Pestañas interactivas de Ranking (Estilo Olympus / Asura) */}
              <div className="grid grid-cols-3 gap-1 p-1 mb-3 rounded-xl bg-black/40 border border-white/5">
                {[
                  { id: "top", label: "Populares" },
                  { id: "ongoing", label: "Emisión" },
                  { id: "completed", label: "Finalizados" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRankTab(tab.id as any)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      rankTab === tab.id
                        ? "bg-[#a855f7] text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <ol className="rank-list">
                {sidebarRanked.length === 0 && <p className="text-sm text-center py-4 text-white/50">Cargando...</p>}
                {sidebarRanked.map((item, i) => {
                  const medalClass =
                    i === 0
                      ? "bg-[#a855f7] text-white shadow-[0_0_12px_rgba(168,85,247,0.45)]"
                      : i === 1
                      ? "bg-white/15 text-white border border-white/20"
                      : i === 2
                      ? "bg-[#a855f7]/20 text-[#d8b4fe] border border-[#a855f7]/35"
                      : "bg-white/5 text-white/60 border border-white/10";
                  return (
                    <li key={item.id} className="rank-item group">
                      <span
                        className={`rank-number w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black ${medalClass}`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Link
                        href={`/manga/${item.id}`}
                        className="block"
                        onClick={() => {
                          try {
                            sessionStorage.setItem(`nekumi_manhwa_full_${item.id}`, JSON.stringify(item));
                          } catch {}
                        }}
                      >
                        <img
                          referrerPolicy="no-referrer"
                          className="rank-thumb group-hover:scale-105 transition-transform"
                          src={item.cover_url}
                          alt={`Portada de ${item.title}`}
                          loading="lazy"
                        />
                      </Link>
                      <div className="rank-copy">
                        <h3 className="rank-name line-clamp-1">
                          <Link
                            href={`/manga/${item.id}`}
                            className="hover:text-[#c084fc] transition-colors"
                            onClick={() => {
                              try {
                                sessionStorage.setItem(`nekumi_manhwa_full_${item.id}`, JSON.stringify(item));
                              } catch {}
                            }}
                          >
                            {item.title}
                          </Link>
                        </h3>
                        <p className="rank-genre flex items-center gap-1.5">
                          <span className="truncate">{item.genre}</span>
                          {Number(item.score) > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[#d8b4fe] font-bold flex-shrink-0">
                              <Star className="w-3 h-3 fill-[#c084fc] text-[#c084fc]" /> {Number(item.score).toFixed(1)}
                            </span>
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* Tarjeta Destacada: Cazador de la Semana */}
            <section className="side-panel glass relative overflow-hidden border border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#a855f7]/20 border border-[#a855f7]/35 flex items-center justify-center text-[#d8b4fe] font-black text-base flex-shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white truncate">
                      {recentReviews[0]?.user_email?.split("@")[0] || "SungJinWoo"}
                    </span>
                    <span className="text-[10px] font-bold text-[#c084fc]">· Lector destacado</span>
                  </div>
                  <p className="text-[11px] text-white/55 mt-0.5 truncate">
                    Cazador más activo de la semana en Nekutoon.
                  </p>
                </div>
              </div>
            </section>

            <section id="comunidad" className="side-panel glass">
              <div className="side-header">
                <h2 className="side-title">Últimas Reseñas</h2>
                <span className="side-title-icon">
                  <MessagesSquare />
                </span>
              </div>
              <div className="review-list space-y-2.5">
                {recentReviews.length === 0 && (
                  <p className="text-sm text-center py-4 text-white/50">Aún no hay reseñas en la plataforma.</p>
                )}
                {recentReviews.slice(0, 3).map((item) => (
                  <article
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-black/25 hover:bg-white/[0.04] transition-colors border border-white/[0.07]"
                  >
                    <div
                      className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 bg-black/40"
                      dangerouslySetInnerHTML={{ __html: getAvatarSvg(item.avatar_key || "hunter") }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-extrabold text-xs text-white truncate">
                            {item.user_email?.split("@")[0] || "Cazador"}
                          </span>
                          <ReaderRankBadge xp={60} size="xs" compact={true} />
                        </div>
                        <span className="flex text-[#c084fc] flex-shrink-0 gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-2.5 h-2.5 ${i < item.rating ? "fill-current" : "opacity-20"}`} />
                          ))}
                        </span>
                      </div>
                      <p className="text-white/75 text-xs line-clamp-2 mb-1.5 leading-snug">"{item.content}"</p>
                      <Link
                        href={`/manga/${item.manhwa_id}`}
                        className="text-zinc-400 hover:text-[#c084fc] text-[11px] font-semibold inline-flex items-center gap-1 truncate transition-colors"
                      >
                        <ChevronRight className="w-3 h-3 flex-shrink-0 text-[#c084fc]" />
                        <span className="truncate">{item.manhwas?.title || "Ver obra"}</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>

        {/* Full-Width Section: Listas Públicas + Catálogo Oficial + Muro Global (Espaciado Armónico) */}
        <div className="shell pb-16 space-y-14 mt-2">
          {!activeCategory && !searchQuery && (
            <PublicListsSection
              manhwas={manhwas}
              isAdultConfirmed={isAdultConfirmed}
              onRequireAdultConfirm={() => {
                setPendingCategory("+18");
                setShowAdultModal(true);
              }}
              user={user}
              onRequireAuth={() => setIsAuthOpen(true)}
              userName={userProfile?.username || user?.email?.split("@")[0] || "Cazador"}
              userAvatar={userProfile?.avatar_url || "hunter"}
            />
          )}

          <section id="recomendados" className="section pt-2" aria-labelledby="recommendedTitle">
            <div className="section-heading flex-wrap gap-3 mb-4">
              <h2 id="recommendedTitle" className="section-title">
                {searchQuery
                  ? `Resultados para "${searchQuery}" (${filteredManhwas.length})`
                  : activeCategory === "Favoritos"
                  ? `Mis Favoritos (${filteredManhwas.length})`
                  : activeCategory
                  ? `Categoría: ${activeCategory} (${filteredManhwas.length})`
                  : `Explorar Catálogo (${filteredManhwas.length})`}
              </h2>
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-2 bg-[#121216] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white/80">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#c084fc]" />
                  <label htmlFor="catalogSort" className="sr-only">
                    Ordenar catálogo
                  </label>
                  <select
                    id="catalogSort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                  >
                    <option value="recent" className="bg-[#121216]">Más recientes</option>
                    <option value="top" className="bg-[#121216]">Mejor valorados</option>
                    <option value="az" className="bg-[#121216]">Orden A - Z</option>
                    <option value="ongoing" className="bg-[#121216]">En emisión</option>
                    <option value="completed" className="bg-[#121216]">Finalizados</option>
                  </select>
                </div>
                {(activeCategory || searchQuery || sortBy !== "recent") && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory("");
                      setSearchQuery("");
                      setSortBy("recent");
                    }}
                    className="mini-button"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {/* Barra de Géneros Limpia y Minimalista integrada al Catálogo */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-white/[0.07]">
              {[
                { label: "Todos", value: "" },
                { label: "Acción", value: "Acción" },
                { label: "Fantasía", value: "Fantasía" },
                { label: "Romance", value: "Romance" },
                { label: "Isekai", value: "Isekai" },
                { label: "Drama", value: "Drama" },
                { label: "Comedia", value: "Comedia" },
                { label: "BL", value: "BL" },
                { label: "+18", value: "+18" },
                { label: `Favoritos (${favorites.size})`, value: "Favoritos" },
              ].map((cat) => {
                const isActive =
                  cat.value === ""
                    ? !activeCategory
                    : cat.value === "BL"
                    ? activeCategory === "BL" || activeCategory === "Boys Love"
                    : activeCategory === cat.value;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={(e) =>
                      cat.value === "Favoritos"
                        ? handleFavoritesFilterClick()
                        : handleCategoryClick(e as any, cat.value)
                    }
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#a855f7]/20 text-white border border-[#a855f7]/45 shadow-[0_0_14px_rgba(168,85,247,0.2)]"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {isLoading ? (
              <div className="catalog-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 mt-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={`skel-card-${i}`}
                    className="animate-pulse bg-white/5 rounded-2xl aspect-[2/3] border border-white/5"
                  />
                ))}
              </div>
            ) : filteredManhwas.length === 0 ? (
              <div className="py-14 px-6 text-center text-[#9b9ba6] glass rounded-2xl">
                <p className="text-base font-semibold text-white mb-2">
                  {activeCategory === "Favoritos"
                    ? "Aún no tienes manhwas guardados en tus favoritos"
                    : "No se encontraron resultados para esta búsqueda"}
                </p>
                <p className="text-sm mb-5">
                  {activeCategory === "Favoritos"
                    ? "Toca el ícono del corazón en cualquier manhwa para guardarlo en tu colección personal."
                    : "Prueba con otro término o explora todas las categorías disponibles."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("");
                    setSearchQuery("");
                  }}
                  className="btn btn-primary"
                >
                  Ver Catálogo Completo
                </button>
              </div>
            ) : (
              <>
                <div className="catalog-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mt-6">
                  {filteredManhwas.slice(0, visibleCount).map((item, idx) => {
                    const latestChapNum = latestChapByManhwa.get(item.id);
                    const hasRating = Number(item.score) > 0;
                    const isFinished = item.status === "Finalizado";
                    const cleanGenre = (item.genre || "Acción")
                      .split(",")
                      .map((g) => g.trim())
                      .filter((g) => g.length > 1)
                      .slice(0, 2)
                      .join(" · ");
                    return (
                      <article key={item.id} className="media-card h-full relative group">
                        <div className="cover relative overflow-hidden">
                          <img
                            referrerPolicy="no-referrer"
                            src={item.cover_url}
                            alt={`Portada de ${item.title}`}
                            loading={idx < 6 ? "eager" : "lazy"}
                            decoding="async"
                            className="w-full h-full object-cover aspect-[2/3] group-hover:scale-105 transition-transform duration-500"
                          />
                          <Link
                            href={`/manga/${item.id}`}
                            className="absolute inset-0 z-[2]"
                            aria-label={`Leer ${item.title}`}
                            onClick={() => {
                              try {
                                sessionStorage.setItem(`nekumi_manhwa_full_${item.id}`, JSON.stringify(item));
                              } catch {}
                            }}
                          />
                          {hasRating && (
                            <span className="card-badge score pointer-events-none z-[3]">
                              <Star />
                              {Number(item.score).toFixed(1)}
                            </span>
                          )}

                          <span
                            className={`pointer-events-none absolute top-2 right-2 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-lg z-[3] inline-flex items-center gap-1 ${
                              isFinished
                                ? "bg-[#064e3b]/90 text-[#6ee7b7] border-[#10b981]/30"
                                : "bg-[#1e1b4b]/90 text-[#c4b5fd] border-[#8b5cf6]/35"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isFinished ? "bg-[#10b981]" : "bg-[#a855f7] animate-pulse"
                              }`}
                            />
                            {item.status || "En emisión"}
                          </span>

                          {/* Hover Synopsis & Quick Chapter Preview (Olympus / Asura style) */}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/95 via-black/75 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[3] flex flex-col justify-end">
                            <p className="text-[11px] text-white/85 line-clamp-3 leading-snug mb-2">
                              {item.description || "Explora esta historia en español en Nekutoon."}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#c084fc]">
                              <BookOpen className="w-3 h-3" /> Leer ahora <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>

                          <button
                            className={`card-favorite favorite-toggle z-[4] ${favorites.has(item.id) ? "active" : ""}`}
                            type="button"
                            aria-label={
                              favorites.has(item.id)
                                ? `Quitar ${item.title} de favoritos`
                                : `Añadir ${item.title} a favoritos`
                            }
                            onClick={(e) => toggleFavorite(item.id, e)}
                          >
                            <Heart />
                          </button>
                        </div>
                        <Link
                          href={`/manga/${item.id}`}
                          className="card-info p-3 block"
                          onClick={() => {
                            try {
                              sessionStorage.setItem(`nekumi_manhwa_full_${item.id}`, JSON.stringify(item));
                            } catch {}
                          }}
                        >
                          <h3 className="card-title line-clamp-1 group-hover:text-[#c084fc] transition-colors">
                            {item.title}
                          </h3>
                          <div className="flex items-center justify-between gap-2 mt-1.5">
                            <p className="card-meta truncate">{cleanGenre}</p>
                            {latestChapNum !== undefined && (
                              <span className="text-[10px] font-bold text-[#c084fc] bg-[#a855f7]/15 border border-[#a855f7]/25 px-1.5 py-0.5 rounded flex-shrink-0">
                                Cap. {latestChapNum}
                              </span>
                            )}
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </div>
                {visibleCount < filteredManhwas.length && (
                  <div className="flex flex-wrap justify-center gap-3 mt-12 mb-4">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((v: number) => v + 36)}
                      className="group relative px-8 py-3 rounded-full bg-[#121214] border border-white/10 hover:border-[#a855f7]/50 transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#a855f7]/10 to-[#ec4899]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                      <span className="relative text-xs uppercase tracking-wider font-bold text-[#dedee5] group-hover:text-white transition-colors flex items-center gap-2">
                        Mostrar más ({filteredManhwas.length - visibleCount} restantes)
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibleCount(filteredManhwas.length)}
                      className="px-6 py-3 rounded-full bg-[#a855f7]/15 border border-[#a855f7]/40 hover:bg-[#a855f7]/25 text-xs uppercase tracking-wider font-bold text-[#c084fc] hover:text-white transition-all duration-300"
                    >
                      Ver todos ({filteredManhwas.length})
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {!activeCategory && !searchQuery && (
            <CommunityWallSection
              manhwas={manhwas}
              stats={readerStats}
              onStatsChange={(next) => setReaderStats(next)}
              onOpenShop={() => setShowGuildShop(true)}
              user={user}
              onRequireAuth={() => setIsAuthOpen(true)}
              userName={userProfile?.username || user?.email?.split("@")[0] || "Cazador"}
              userAvatar={userProfile?.avatar_url || "hunter"}
            />
          )}
        </div>

        {readerStats && (
          <GuildShopModal
            isOpen={showGuildShop}
            onClose={() => setShowGuildShop(false)}
            stats={readerStats}
            onStatsChange={(next) => setReaderStats(next)}
            userName={userProfile?.username || user?.email?.split("@")[0] || "Cazador"}
            userAvatar={userProfile?.avatar_url || "hunter"}
          />
        )}

        <div className="shell lower-grid">
          <div className="lower-content">
            <section id="noticias" className="lower-section" aria-labelledby="newsTitle">
              <div className="section-heading">
                <h2 id="newsTitle" className="section-title lower-title">
                  Destacados de la Semana
                </h2>
                <a
                  href="#recomendados"
                  className="mini-button"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("recomendados")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Ver todos <ArrowRight />
                </a>
              </div>
              <div className="news-grid">
                {(trending.length >= 3 ? trending.slice(0, 3) : manhwas.slice(0, 3)).map((item) => (
                  <Link key={item.id} href={`/manga/${item.id}`}>
                    <article className="news-card group cursor-pointer h-full flex flex-col justify-between">
                      <div className="news-media">
                        <img
                          referrerPolicy="no-referrer"
                          src={item.banner_url || item.cover_url}
                          alt={item.title}
                          loading="lazy"
                          className="group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="news-label">{item.genre?.split(",")[0]}</span>
                      </div>
                      <div className="news-body">
                        <h3 className="group-hover:text-[#c084fc] transition-colors">{item.title}</h3>
                        <div className="news-meta justify-between">
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-[#fbbf24] fill-[#fbbf24]" />
                            {Number(item.score) > 0 ? Number(item.score).toFixed(1) : "Destacado"}
                          </span>
                          <span className="text-[#c084fc] font-semibold text-xs inline-flex items-center gap-1">
                            Leer obra <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="newsletter glass" aria-labelledby="newsletterTitle">
            <span className="newsletter-glow"></span>
            <span className="newsletter-icon">
              <Mail />
            </span>
            <h2 id="newsletterTitle">Comunidad Nekutoon</h2>
            <p>
              Crea tu cuenta gratuita para sincronizar tus manhwas favoritos en la nube y calificar tus historias
              preferidas.
            </p>
            <div className="mt-4">
              {user ? (
                <Link href="/profile" className="btn btn-primary w-full">
                  Ir a Mi Perfil
                </Link>
              ) : (
                <button type="button" onClick={() => setIsAuthOpen(true)} className="btn btn-primary w-full">
                  Crear Cuenta / Iniciar Sesión
                </button>
              )}
            </div>
            <div className="social-block">
              <span>Síguenos en nuestras redes</span>
              <div className="social-row">
                <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" aria-label="Discord">
                  <MessageCircle />
                </a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X">
                  <span className="social-x">𝕏</span>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Camera />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                  <Video />
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="site-footer">
        <div className="shell footer-grid">
          <div className="footer-brand">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="brand group"
              aria-label="Nekutoon, inicio"
            >
              <svg
                className="brand-mark w-10 h-10 drop-shadow-[0_6px_20px_rgba(168,85,247,0.45)] transition-transform group-hover:scale-105 duration-300"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="nk-bg-ftr" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1d1138" />
                    <stop offset="55%" stopColor="#0f091d" />
                    <stop offset="100%" stopColor="#07050e" />
                  </linearGradient>
                  <linearGradient id="nk-rim-ftr" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#e879f9" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f472b6" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="nk-left-ftr" x1="14" y1="10" x2="14" y2="38" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#e9d5ff" />
                    <stop offset="45%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#5b21b6" />
                  </linearGradient>
                  <linearGradient id="nk-right-ftr" x1="34" y1="10" x2="34" y2="38" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f5d0fe" />
                    <stop offset="55%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                  <linearGradient id="nk-slash-ftr" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="48%" stopColor="#d946ef" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <rect
                  x="2.5"
                  y="2.5"
                  width="43"
                  height="43"
                  rx="13.5"
                  fill="url(#nk-bg-ftr)"
                  stroke="url(#nk-rim-ftr)"
                  strokeWidth="1.5"
                />
                <rect
                  x="5.5"
                  y="5.5"
                  width="37"
                  height="37"
                  rx="10.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <path
                  d="M11.5 13C11.5 11.6 12.6 10.5 14 10.5H17.4V37.5H14C12.6 37.5 11.5 36.4 11.5 35V13Z"
                  fill="url(#nk-left-ftr)"
                />
                <path
                  d="M30.6 10.5H34C35.4 10.5 36.5 11.6 36.5 13V35C36.5 36.4 35.4 37.5 34 37.5H30.6V10.5Z"
                  fill="url(#nk-right-ftr)"
                />
                <path d="M12.5 12.2H19.8L35.8 37.5H28.5L12.5 12.2Z" fill="rgba(0,0,0,0.55)" />
                <path d="M12 10.5H19.2L36 37.5H28.8L12 10.5Z" fill="url(#nk-slash-ftr)" />
                <path
                  d="M13.2 11.2L29.3 36.8"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
              </svg>
              <span className="brand-word tracking-[-0.03em] text-[23px] font-black uppercase flex items-center">
                <span className="text-white">Neku</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c084fc] via-[#e879f9] to-[#f472b6] drop-shadow-[0_2px_14px_rgba(236,72,153,0.45)]">
                  toon
                </span>
              </span>
            </a>
            <p>Tu espacio para descubrir, valorar y leer las mejores historias del universo manhwa y webtoon.</p>
          </div>
          <nav className="footer-links" aria-label="Enlaces del pie">
            <div>
              <h3>Explorar</h3>
              <a
                href="#recomendados"
                onClick={(e) => {
                  handleCategoryClick(e, "");
                  document.getElementById("recomendados")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Todos los Manhwas
              </a>
              <a
                href="#recomendados"
                onClick={(e) => {
                  handleCategoryClick(e, "Acción");
                  document.getElementById("recomendados")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Acción
              </a>
              <a
                href="#recomendados"
                onClick={(e) => {
                  handleCategoryClick(e, "Fantasía");
                  document.getElementById("recomendados")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Fantasía
              </a>
              <a
                href="#recomendados"
                onClick={(e) => {
                  handleCategoryClick(e, "Romance");
                  document.getElementById("recomendados")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Romance
              </a>
            </div>
            <div>
              <h3>Cuenta</h3>
              {user ? (
                <>
                  <Link href="/profile">Mi Perfil</Link>
                  <a href="#recomendados" onClick={handleFavoritesFilterClick}>
                    Mis Favoritos ({favorites.size})
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsAuthOpen(true);
                    }}
                  >
                    Iniciar sesión
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsAuthOpen(true);
                    }}
                  >
                    Registrarse
                  </a>
                </>
              )}
            </div>
            <div>
              <h3>Legal y Contacto</h3>
              <Link href="/dmca">DMCA / Copyright</Link>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setLegalModal({ isOpen: true, type: "terminos" });
                }}
              >
                Términos de Uso
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setLegalModal({ isOpen: true, type: "privacidad" });
                }}
              >
                Privacidad
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setLegalModal({ isOpen: true, type: "cookies" });
                }}
              >
                Cookies
              </a>
              <a href="mailto:diazmowi07@gmail.com">Contacto</a>
            </div>
          </nav>
          <div className="store-buttons">
            <span>Aplicación Web Progresiva</span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                showToastMessage("Usa 'Añadir a pantalla de inicio' en tu navegador");
              }}
            >
              <Apple />
              <span>
                <small>Instalar Web App</small>iOS / Safari
              </span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                showToastMessage("Usa 'Instalar aplicación' en el menú de Chrome");
              }}
            >
              <Play />
              <span>
                <small>Instalar Web App</small>Android / Chrome
              </span>
            </a>
          </div>
        </div>
        <div className="shell footer-bottom">
          <span>© 2026 Nekutoon. Todos los derechos reservados.</span>
          <div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setLegalModal({ isOpen: true, type: "privacidad" });
              }}
            >
              Política de Privacidad
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setLegalModal({ isOpen: true, type: "terminos" });
              }}
            >
              Términos de Servicio
            </a>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => setUser(u)}
        showToast={showToastMessage}
      />

      <LegalModal
        isOpen={legalModal.isOpen}
        type={legalModal.type}
        onClose={() => setLegalModal({ isOpen: false, type: "" })}
      />

      <div className={`toast ${showToast ? "show" : ""}`} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </>
  );
}
