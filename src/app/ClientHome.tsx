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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import { LegalModal } from "@/components/LegalModal";
import { AdsterraNative, AdsterraBanner300 } from "@/components/Adsterra";
import { getAvatarSvg } from "@/lib/avatars";
import { createClient } from "@/lib/supabase";

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
}: {
  initialManhwas?: Manhwa[];
  initialTrending?: Manhwa[];
  initialReviews?: any[];
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [showAdultModal, setShowAdultModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [realNotifications, setRealNotifications] = useState<any[]>([]);
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
  const [visibleCount, setVisibleCount] = useState<number>(36);

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
    } catch {}

    try {
      if (sessionStorage.getItem("nekumi_adult_confirmed") === "1") {
        setIsAdultConfirmed(true);
      }
    } catch {}

    // Always fetch full catalog from Supabase so all manhwas are present and up to date
    supabase
      .from("manhwas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000)
      .then(({ data }) => {
        if (data && data.length > 0) setManhwas(data);
        setIsLoading(false);
      });

    supabase
      .from("manhwas")
      .select("*")
      .order("score", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) setTrending(data);
      });

    supabase
      .from("reviews")
      .select("*, manhwas(title, cover_url)")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setRecentReviews(data);
      });

    // Fetch notifications
    const fetchInitialNotifications = async () => {
      const { data } = await supabase
        .from("chapters")
        .select("id, chapter_number, created_at, manhwa:manhwas(id, title)")
        .not("manhwa_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        setRealNotifications(data);
        try {
          const lastReadId = localStorage.getItem("lastReadNotification");
          setNotificationsRead(lastReadId === data[0].id);
        } catch {
          setNotificationsRead(false);
        }
      }
    };
    fetchInitialNotifications();

    const channel = supabase
      .channel("realtime-chapters")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chapters" }, async (payload) => {
        const { manhwa_id, chapter_number, id, created_at } = payload.new;
        const { data: mData } = await supabase.from("manhwas").select("title").eq("id", manhwa_id).single();
        const title = mData?.title || "Un manhwa";

        const newNotif = {
          id,
          chapter_number,
          created_at,
          manhwa: { id: manhwa_id, title },
        };

        setRealNotifications((prev) => [newNotif, ...prev].slice(0, 5));
        setNotificationsRead(false);
      })
      .subscribe();

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
      supabase.removeChannel(channel);
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
    if (user) {
      setShowProfileMenu(!showProfileMenu);
    } else {
      setIsAuthOpen(true);
    }
  };

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const displayHeroes = useMemo(() => {
    const heroManhwas = manhwas.filter((m) => m.is_hero);
    return heroManhwas.length > 0 ? heroManhwas : manhwas.slice(0, 4);
  }, [manhwas]);

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
              aria-label="Nekumi, inicio"
            >
              <svg
                className="brand-mark w-9 h-9 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)] transition-transform group-hover:scale-110 duration-300"
                viewBox="0 0 44 44"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="lg-epic-header" x1="0" y1="0" x2="44" y2="44">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  <linearGradient id="lg-epic-header-2" x1="44" y1="0" x2="0" y2="44">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
                <path
                  d="M8 32.5V11.7c0-2.2 2.7-3.2 4.2-1.6L28 27.2V10.9c0-1.6 1.3-2.9 2.9-2.9h2.2c1.6 0 2.9 1.3 2.9 2.9v21c0 2.1-2.6 3.2-4.1 1.7L16 16.4v16.1c0 1.9-1.5 3.5-3.5 3.5h-1C9.6 36 8 34.4 8 32.5Z"
                  fill="url(#lg-epic-header)"
                />
                <path
                  d="M14.5 31V15.8L28.5 31"
                  fill="none"
                  stroke="url(#lg-epic-header-2)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="brand-word tracking-[0.02em] text-[24px] font-black uppercase">
                <span className="text-white">Neku</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#a855f7] to-[#ec4899] drop-shadow-[0_2px_12px_rgba(236,72,153,0.4)]">
                  mi
                </span>
              </span>
            </a>

            <nav className="desktop-nav flex items-center gap-5" aria-label="Navegación principal">
              <a
                className={`nav-link ${!activeCategory ? "active" : ""}`}
                href="#recomendados"
                onClick={(e) => handleCategoryClick(e, "")}
              >
                Explorar
              </a>
              <a
                className={`nav-link ${activeCategory === "Acción" ? "active" : ""}`}
                href="#recomendados"
                onClick={(e) => handleCategoryClick(e, "Acción")}
              >
                Acción
              </a>
              <a
                className={`nav-link ${activeCategory === "Fantasía" ? "active" : ""}`}
                href="#recomendados"
                onClick={(e) => handleCategoryClick(e, "Fantasía")}
              >
                Fantasía
              </a>
              <a
                className={`nav-link ${activeCategory === "Romance" ? "active" : ""}`}
                href="#recomendados"
                onClick={(e) => handleCategoryClick(e, "Romance")}
              >
                Romance
              </a>
              <a
                className={`nav-link ${activeCategory === "Isekai" ? "active" : ""}`}
                href="#recomendados"
                onClick={(e) => handleCategoryClick(e, "Isekai")}
              >
                Isekai
              </a>
              <a
                className={`nav-link ${activeCategory === "Drama" ? "active" : ""}`}
                href="#recomendados"
                onClick={(e) => handleCategoryClick(e, "Drama")}
              >
                Drama
              </a>
              <a
                className={`nav-link ${activeCategory === "Comedia" ? "active" : ""}`}
                href="#recomendados"
                onClick={(e) => handleCategoryClick(e, "Comedia")}
              >
                Comedia
              </a>
              <a
                className={`nav-link ${activeCategory === "BL" || activeCategory === "Boys Love" ? "active" : ""}`}
                href="#recomendados"
                onClick={(e) => handleCategoryClick(e, "BL")}
              >
                BL
              </a>
              <a
                className={`nav-link ${activeCategory === "+18" ? "active" : ""} text-pink-500`}
                href="#recomendados"
                onClick={(e) => handleCategoryClick(e, "+18")}
              >
                +18
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
                        className="text-white/60 hover:text-white"
                      >
                        Ver todos →
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

              <div className="relative">
                <button className="avatar-button" type="button" aria-label="Abrir perfil" onClick={handleAvatarClick}>
                  <div
                    className="rounded-full overflow-hidden bg-black/40 [&>svg]:w-full [&>svg]:h-full [&>svg]:scale-110"
                    dangerouslySetInnerHTML={{ __html: getAvatarSvg(userProfile?.avatar_url || "hunter") }}
                  />
                </button>

                {showProfileMenu && user && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#121216] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col animate-in fade-in zoom-in-95">
                    <Link
                      href="/profile"
                      className="px-4 py-3 text-sm text-white hover:bg-white/5 border-b border-white/5 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" /> Mi Perfil
                    </Link>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleFavoritesFilterClick();
                      }}
                      className="px-4 py-3 text-sm text-white hover:bg-white/5 border-b border-white/5 text-left flex items-center gap-2"
                    >
                      <Heart className="w-4 h-4 text-[#ec4899]" /> Mis Favoritos ({favorites.size})
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-3 text-sm text-red-400 hover:bg-white/5 text-left flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
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
                          {hero.score}
                        </span>
                        <span className="meta-separator"></span>
                        <span>Destacado en Nekumi</span>
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

                {displayHeroes.length > 1 && (
                  <div className="slider-dots z-20" role="tablist" aria-label="Obras destacadas">
                    {displayHeroes.map((hero, idx) => (
                      <button
                        key={`dot-${hero.id}`}
                        type="button"
                        role="tab"
                        aria-selected={idx === currentHeroIndex}
                        aria-label={`Ver ${hero.title}`}
                        className={idx === currentHeroIndex ? "active" : ""}
                        onClick={() => setCurrentHeroIndex(idx)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Continuar Leyendo (Si el usuario tiene historial local) */}
            {readingHistory.length > 0 && !searchQuery && !activeCategory && (
              <section className="section" aria-label="Continuar leyendo">
                <div className="section-heading">
                  <h2 className="section-title flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#c084fc]" /> Continuar Leyendo
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {readingHistory.slice(0, 3).map((item) => (
                    <Link
                      key={`hist-${item.manhwaId}`}
                      href={`/manga/${item.manhwaId}/chapter/${item.chapterId}`}
                      className="glass rounded-2xl p-3 flex items-center gap-3.5 hover:border-[#a855f7]/50 transition-all group relative"
                    >
                      <img
                        referrerPolicy="no-referrer"
                        src={item.coverUrl}
                        alt={item.manhwaTitle}
                        className="w-14 h-20 object-cover rounded-xl flex-shrink-0 border border-white/10"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1 pr-6">
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-[#c084fc] transition-colors">
                          {item.manhwaTitle}
                        </h3>
                        <p className="text-xs text-[#a855f7] font-semibold mt-1">
                          Capítulo {item.chapterNumber}
                        </p>
                        <span className="text-[11px] text-white/40 block mt-0.5">
                          Continuar lectura →
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label={`Quitar ${item.manhwaTitle} del historial`}
                        onClick={(e) => removeHistoryItem(item.manhwaId, e)}
                        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 flex items-center justify-center transition-colors"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section id="recomendados" className="section" aria-labelledby="recommendedTitle">
              <div className="section-heading flex-wrap gap-3">
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
                  <div className="flex items-center gap-2 bg-[#121216] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/80">
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
                      <option value="top" className="bg-[#121216]">Mejor valorados ⭐</option>
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

              {isLoading ? (
                <div className="catalog-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 mt-4">
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
                  <div className="catalog-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 mt-4">
                    {filteredManhwas.slice(0, visibleCount).map((item, idx) => (
                      <article key={item.id} className="media-card h-full relative group">
                        <div className="cover relative">
                          <img
                            referrerPolicy="no-referrer"
                            src={item.cover_url}
                            alt={`Portada de ${item.title}`}
                            loading={idx < 6 ? "eager" : "lazy"}
                            decoding="async"
                            className="w-full h-full object-cover aspect-[2/3]"
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
                          <span className="card-badge score pointer-events-none z-[3]">
                            <Star />
                            {Number(item.score) > 0 ? item.score : "★"}
                          </span>

                          <span
                            className={`pointer-events-none absolute top-2 right-2 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-lg z-[3] ${
                              item.status === "Finalizado"
                                ? "bg-[#10b981]/85 text-white border-[#10b981]/30"
                                : "bg-[#3b82f6]/85 text-white border-[#3b82f6]/30"
                            }`}
                          >
                            {item.status || "En emisión"}
                          </span>

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
                          className="card-info p-2.5 block"
                          onClick={() => {
                            try {
                              sessionStorage.setItem(`nekumi_manhwa_full_${item.id}`, JSON.stringify(item));
                            } catch {}
                          }}
                        >
                          <h3 className="card-title line-clamp-1 group-hover:text-[#c084fc] transition-colors">{item.title}</h3>
                          <p className="card-meta">{item.genre}</p>
                        </Link>
                      </article>
                    ))}
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
          </div>

          <aside className="sidebar">
            <section className="side-panel glass" aria-labelledby="trendingTitle">
              <div className="side-header">
                <h2 id="trendingTitle" className="side-title">
                  Tendencias Top
                </h2>
                <span className="side-title-icon">
                  <Flame />
                </span>
              </div>
              <ol className="rank-list">
                {trending.length === 0 && <p className="text-sm text-center py-4 text-white/50">Cargando...</p>}
                {trending.map((item, i) => {
                  const medalClass =
                    i === 0
                      ? "bg-gradient-to-br from-[#fbbf24] to-[#d97706] text-black shadow-[0_0_12px_rgba(251,191,36,0.45)]"
                      : i === 1
                      ? "bg-gradient-to-br from-[#e2e8f0] to-[#94a3b8] text-black shadow-[0_0_10px_rgba(226,232,240,0.3)]"
                      : i === 2
                      ? "bg-gradient-to-br from-[#f59e0b] to-[#92400e] text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                      : "";
                  return (
                    <li key={item.id} className="rank-item group">
                      <span
                        className={`rank-number ${
                          i < 3 ? `w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${medalClass}` : ""
                        }`}
                      >
                        {i + 1}
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
                        <p className="rank-genre">
                          {item.genre} • <Star className="w-3 h-3 inline text-[#fbbf24] fill-[#fbbf24]" /> {item.score}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <div className="w-full flex justify-center mb-2">
              <AdsterraBanner300 />
            </div>

            <section id="comunidad" className="side-panel glass">
              <div className="side-header">
                <h2 className="side-title">Últimas Reseñas</h2>
                <span className="side-title-icon">
                  <MessagesSquare />
                </span>
              </div>
              <div className="review-list space-y-2">
                {recentReviews.length === 0 && (
                  <p className="text-sm text-center py-4 text-white/50">Aún no hay reseñas en la plataforma.</p>
                )}
                {recentReviews.map((item) => (
                  <article
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-white/5"
                  >
                    <div
                      className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 bg-black/40"
                      dangerouslySetInnerHTML={{ __html: getAvatarSvg(item.avatar_key || "hunter") }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-white truncate pr-2">
                          {item.user_email?.split("@")[0] || "Lector"}
                        </span>
                        <span className="flex text-[#fbbf24] flex-shrink-0 gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < item.rating ? "fill-current" : "opacity-20"}`} />
                          ))}
                        </span>
                      </div>
                      <p className="text-white/80 text-xs line-clamp-2 mb-1.5 leading-relaxed">"{item.content}"</p>
                      <Link
                        href={`/manga/${item.manhwa_id}`}
                        className="text-[#c084fc] hover:text-white text-[11px] font-bold uppercase tracking-wider block truncate transition-colors"
                      >
                        ↳ {item.manhwas?.title || "Ver obra"}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>

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
                          <span>
                            <Star className="w-3.5 h-3.5 inline text-[#fbbf24] fill-[#fbbf24]" /> {item.score}
                          </span>
                          <span className="text-[#c084fc] font-semibold text-xs">Leer obra →</span>
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
            <h2 id="newsletterTitle">Comunidad Nekumi</h2>
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
              aria-label="Nekumi, inicio"
            >
              <svg
                className="brand-mark w-9 h-9 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)] transition-transform group-hover:scale-110 duration-300"
                viewBox="0 0 44 44"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="lg-epic-footer" x1="0" y1="0" x2="44" y2="44">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  <linearGradient id="lg-epic-footer-2" x1="44" y1="0" x2="0" y2="44">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
                <path
                  d="M8 32.5V11.7c0-2.2 2.7-3.2 4.2-1.6L28 27.2V10.9c0-1.6 1.3-2.9 2.9-2.9h2.2c1.6 0 2.9 1.3 2.9 2.9v21c0 2.1-2.6 3.2-4.1 1.7L16 16.4v16.1c0 1.9-1.5 3.5-3.5 3.5h-1C9.6 36 8 34.4 8 32.5Z"
                  fill="url(#lg-epic-footer)"
                />
                <path
                  d="M14.5 31V15.8L28.5 31"
                  fill="none"
                  stroke="url(#lg-epic-footer-2)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="brand-word tracking-[0.02em] text-[24px] font-black uppercase">
                <span className="text-white">Neku</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#a855f7] to-[#ec4899] drop-shadow-[0_2px_12px_rgba(236,72,153,0.4)]">
                  mi
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
          <span>© 2026 Nekumi. Todos los derechos reservados.</span>
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
