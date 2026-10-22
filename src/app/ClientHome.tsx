"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Heart,
  Menu,
  Star,
  BookOpen,
  Flame, User, LogOut,
  ArrowRight,
  MessagesSquare,
  Mail,
  Sparkles,
  Apple,
  Play,
  X as XIcon,
  Shield,
} from "lucide-react";
import Link from "next/link";

interface Manhwa {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  score: number;
  status?: string;
  genre: string;
  isNew?: boolean;
}

import AuthModal from "@/components/AuthModal";
import { LegalModal } from "@/components/LegalModal";
import { AdsterraNative, AdsterraBanner300 } from "@/components/Adsterra";
import { getAvatarSvg } from "@/lib/avatars";
import { createClient } from "@/lib/supabase";

export default function Home({ initialManhwas = [], initialTrending = [], initialReviews = [] }: any) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [showAdultModal, setShowAdultModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [realNotifications, setRealNotifications] = useState<any[]>([]);
  const [notificationsRead, setNotificationsRead] = useState(false);
  
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<{isOpen: boolean, type: any}>({isOpen: false, type: ""});
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [manhwas, setManhwas] = useState<Manhwa[]>(initialManhwas);
  const [isLoading, setIsLoading] = useState(initialManhwas.length === 0);
  const [trending, setTrending] = useState<Manhwa[]>(initialTrending);
  const [recentReviews, setRecentReviews] = useState<any[]>(initialReviews);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [visibleCount, setVisibleCount] = useState<number>(18);
  const supabase = createClient();

  useEffect(() => {
    // SSR ya trae estos datos. Consultar solo si el servidor no pudo devolverlos.
    if (initialManhwas.length === 0) {
      supabase.from('manhwas').select('*').order('created_at', { ascending: false }).limit(24).then(({ data, error }) => {
        if (!error && data) setManhwas(data);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }

    if (initialTrending.length === 0) {
      supabase.from('manhwas').select('*').order('score', { ascending: false }).limit(5).then(({ data }) => {
        if (data) setTrending(data);
      });
    }

    if (initialReviews.length === 0) {
      supabase.from('reviews').select('id, manhwa_id, user_id, avatar_key, rating, content, created_at, manhwas(title)').order('created_at', { ascending: false }).limit(3).then(({ data }) => {
        if (data) setRecentReviews(data);
      });
    }

        const fetchInitialNotifications = async () => {
      const { data } = await supabase
        .from('chapters')
        .select('id, chapter_number, created_at, manhwa:manhwas(id, title)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data && data.length > 0) {
        setRealNotifications(data);
        try {
          const lastReadId = localStorage.getItem('lastReadNotification');
          setNotificationsRead(lastReadId === data[0].id);
        } catch { setNotificationsRead(false); }
      }
    };
    fetchInitialNotifications();

    const channel = supabase.channel('realtime-chapters')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chapters' }, async (payload) => {
        const { manhwa_id, chapter_number, id, created_at } = payload.new;
        const { data: mData } = await supabase.from('manhwas').select('title').eq('id', manhwa_id).single();
        const title = mData?.title || 'Un manhwa';
        
        const newNotif = {
          id,
          chapter_number,
          created_at,
          manhwa: { id: manhwa_id, title }
        };
        
        setRealNotifications(prev => [newNotif, ...prev].slice(0, 5));
        setNotificationsRead(false);
        // The UI notification is sufficient; no missing audio asset is requested.
      })
      .subscribe();

    // Check active session
    void supabase.from('visits').insert([{}]).then(() => undefined, () => undefined);

    const fetchProfile = async (sessionUser: any) => {
      setUser(sessionUser);
      if (sessionUser) {
        const [{ data: profileData }, { data: favoriteData, error: favoritesError }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle(),
          supabase.from('favorites').select('manhwa_id').eq('user_id', sessionUser.id),
        ]);
        setUserProfile(profileData || null);
        setFavorites(favoritesError ? new Set() : new Set((favoriteData || []).map((favorite) => String(favorite.manhwa_id))));
      } else {
        setUserProfile(null);
        setFavorites(new Set());
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      void fetchProfile(session?.user ?? null).catch(() => { setUser(null); setUserProfile(null); setFavorites(new Set()); });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer database queries until the auth callback releases Supabase's auth lock.
      window.setTimeout(() => {
        void fetchProfile(session?.user ?? null).catch(() => {
          setUserProfile(null);
          setFavorites(new Set());
        });
      }, 0);
    });

    return () => { subscription.unsubscribe(); supabase.removeChannel(channel); };
  }, [supabase, initialManhwas.length, initialTrending.length, initialReviews.length]);

  const handleCategoryClick = (e: any, category: string) => {
    e?.preventDefault();
    setFavoritesOnly(false);
    if (category === "+18" && !isAdultConfirmed) {
      setPendingCategory("+18");
      setShowAdultModal(true);
    } else {
      setActiveCategory(category);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { showToastMessage("No se pudo cerrar la sesión. Inténtalo de nuevo."); return; }
    setShowProfileMenu(false);
    showToastMessage("Sesión cerrada correctamente");
  };

  const toggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToastMessage('Inicia sesión para guardar favoritos');
      setIsAuthOpen(true);
      return;
    }

    try {
      const isSaved = favorites.has(id);
      const result = isSaved
        ? await supabase.from('favorites').delete().eq('user_id', user.id).eq('manhwa_id', id)
        : await supabase.from('favorites').insert([{ user_id: user.id, manhwa_id: id }]);
      if (result.error) throw result.error;

      setFavorites((current) => {
        const next = new Set(current);
        if (isSaved) next.delete(id);
        else next.add(id);
        return next;
      });
      showToastMessage(isSaved ? 'Eliminado de favoritos' : 'Añadido a favoritos');
    } catch (cause) {
      showToastMessage(cause instanceof Error ? cause.message : 'No se pudo actualizar favoritos. Inténtalo de nuevo.');
    }
  };

  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1800);
  };

  const filteredManhwas = manhwas.filter((m) => {
    const title = (m.title || '').toLowerCase();
    const genre = (m.genre || '').toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase()) || genre.includes(searchQuery.toLowerCase());
    const matchesFavorites = !favoritesOnly || favorites.has(m.id);

    // Ocultar contenido sensible de la vista general por defecto.
    if (!activeCategory && !searchQuery) {
      const isSensible = genre.includes('+18') || genre.includes('bl') || genre.includes('boys love') || genre.includes('yuri') || genre.includes('romance');
      if (isSensible) return false;
    }

    const matchesCat = activeCategory ? genre.includes(activeCategory.toLowerCase()) : true;
    return matchesSearch && matchesCat && matchesFavorites;
  });

  const maxCardPage = Math.max(0, filteredManhwas.length - 6); // Approximation for desktop

  const handleAvatarClick = () => { if (user) { setShowProfileMenu(!showProfileMenu); } else { setIsAuthOpen(true); } };

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const heroManhwas = manhwas.filter(m => (m as any).is_hero);
  const displayHeroes = heroManhwas.length > 0 ? heroManhwas : manhwas.slice(0, 3);
  const heroManhwa = displayHeroes[currentHeroIndex] || manhwas[0];

  useEffect(() => {
    if (displayHeroes.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % displayHeroes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [displayHeroes.length]);

  return (
    <>
      <header className="site-header">
        <div className="shell">
          <div className="header-inner">
            <a href="#" className="brand group" aria-label="Nekutton, inicio">
                <svg className="brand-mark w-9 h-9 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)] transition-transform group-hover:scale-110 duration-300" viewBox="0 0 44 44" aria-hidden="true">
                  <defs>
                    <linearGradient id="lg-epic" x1="0" y1="0" x2="44" y2="44">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="lg-epic-2" x1="44" y1="0" x2="0" y2="44">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                  </defs>
                  <path d="M8 32.5V11.7c0-2.2 2.7-3.2 4.2-1.6L28 27.2V10.9c0-1.6 1.3-2.9 2.9-2.9h2.2c1.6 0 2.9 1.3 2.9 2.9v21c0 2.1-2.6 3.2-4.1 1.7L16 16.4v16.1c0 1.9-1.5 3.5-3.5 3.5h-1C9.6 36 8 34.4 8 32.5Z" fill="url(#lg-epic)" />
                  <path d="M14.5 31V15.8L28.5 31" fill="none" stroke="url(#lg-epic-2)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="brand-word tracking-[0.02em] text-[24px] font-black uppercase">
                  <span className="text-white">Neku</span><span className="text-transparent bg-clip-text bg-gradient-to-br from-[#a855f7] to-[#ec4899] drop-shadow-[0_2px_12px_rgba(236,72,153,0.4)]">tton</span>
                </span>
              </a>
            <nav className="desktop-nav flex items-center gap-5" aria-label="Navegación principal">
                <a className={`nav-link ${!activeCategory ? 'active' : ''}`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, ""); setVisibleCount(18); }}>Explorar</a>
                <a className={`nav-link ${activeCategory === 'Acción' ? 'active' : ''}`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Acción"); setVisibleCount(18); }}>Acción</a>
                <a className={`nav-link ${activeCategory === 'Fantasía' ? 'active' : ''}`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Fantasía"); setVisibleCount(18); }}>Fantasía</a>
                <a className={`nav-link ${activeCategory === 'Romance' ? 'active' : ''}`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Romance"); setVisibleCount(18); }}>Romance</a>
                <a className={`nav-link ${activeCategory === 'Isekai' ? 'active' : ''}`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Isekai"); setVisibleCount(18); }}>Isekai</a>
                <a className={`nav-link ${activeCategory === 'Drama' ? 'active' : ''}`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Drama"); setVisibleCount(18); }}>Drama</a>
                <a className={`nav-link ${activeCategory === 'Comedia' ? 'active' : ''}`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Comedia"); setVisibleCount(18); }}>Comedia</a>
                <a className={`nav-link ${activeCategory === 'BL' || activeCategory === 'Boys Love' ? 'active' : ''}`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "BL"); setVisibleCount(18); }}>BL</a>
                <a className={`nav-link ${activeCategory === '+18' ? 'active' : ''} text-pink-500`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "+18"); setVisibleCount(18); }}>+18</a>
              </nav>
            <div className="header-actions">
              <div className="search-wrap desktop-search">
                <Search />
                <label className="sr-only" htmlFor="desktopSearch">Buscar</label>
                <input id="desktopSearch" className="search-input" type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar manhwas, géneros..." autoComplete="off" />
              </div>
              <button className="icon-btn menu-btn" type="button" aria-label="Mostrar buscador" onClick={() => setMobileSearchVisible(!mobileSearchVisible)}>
                <Search />
              </button>
              
              <div className="notification-wrap">
                <button className="icon-btn" type="button" aria-label="Notificaciones" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                  <Bell />
                  {!notificationsRead && realNotifications.length > 0 && <span className="notification-badge">{realNotifications.length}</span>}
                </button>
                <div className={`notification-dropdown glass ${notificationsOpen ? 'open' : ''}`}>
                  <div className="notification-head">
                      <strong>Notificaciones</strong>
                      <button type="button" onClick={() => { 
                        setNotificationsRead(true); 
                        if (realNotifications.length > 0) {
                          try { localStorage.setItem('lastReadNotification', realNotifications[0].id); } catch { /* optional */ }
                        }
                        showToastMessage('Notificaciones marcadas como leídas'); 
                      }}>Marcar leídas</button>
                    </div>
                    {realNotifications.length === 0 ? (
                      <div className="p-4 text-center text-white/50 text-sm">No hay notificaciones recientes</div>
                    ) : (
                      realNotifications.map(notif => (
                        <Link href={`/manga/${notif.manhwa?.id}`} key={notif.id} className="notification-item">
                          <span className="notification-icon"><Sparkles /></span>
                          <span>
                            <b>{notif.manhwa?.title}</b>
                            <small>Capítulo {notif.chapter_number} · Hace un momento</small>
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
              </div>
              
              <button
                className={`icon-btn favorite-toggle ${favoritesOnly ? 'active' : ''}`}
                type="button"
                aria-label={favoritesOnly ? "Mostrar todo el catálogo" : "Ver favoritos"}
                aria-pressed={favoritesOnly}
                onClick={() => {
                  if (!user) { setIsAuthOpen(true); return; }
                  setFavoritesOnly((current) => !current);
                  setActiveCategory("");
                  setSearchQuery("");
                  setVisibleCount(18);
                  window.setTimeout(() => document.getElementById("recomendados")?.scrollIntoView({ behavior: "smooth" }), 0);
                }}
              >
                <Heart />
              </button>
              {user?.email === 'diazmowi07@gmail.com' && (
                <Link href="/admin" className="btn bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/30 hover:bg-[#a855f7]/30 font-bold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
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
                    <Link href="/profile" className="px-4 py-3 text-sm text-white hover:bg-white/5 border-b border-white/5 flex items-center gap-2">
                      <User className="w-4 h-4" /> Mi Perfil
                    </Link>
                    <button onClick={handleLogout} className="px-4 py-3 text-sm text-red-400 hover:bg-white/5 text-left flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
              <button className="icon-btn menu-btn" type="button" aria-label="Abrir menú" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
                {mobileNavOpen ? <XIcon /> : <Menu />}
              </button>
            </div>
          </div>
          
          {mobileSearchVisible && (
            <div className="mobile-search visible">
              <div className="search-wrap">
                <Search />
                <label className="sr-only" htmlFor="mobileSearchInput">Buscar</label>
                <input id="mobileSearchInput" className="search-input" type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar manhwas, géneros..." />
              </div>
            </div>
          )}
          
          <nav className={`mobile-nav ${mobileNavOpen ? 'open' : ''}`} aria-label="Navegación móvil">
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, ""); setVisibleCount(18); setMobileNavOpen(false); }}>Explorar</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Acción"); setVisibleCount(18); setMobileNavOpen(false); }}>Acción</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Fantasía"); setVisibleCount(18); setMobileNavOpen(false); }}>Fantasía</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Romance"); setVisibleCount(18); setMobileNavOpen(false); }}>Romance</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Isekai"); setVisibleCount(18); setMobileNavOpen(false); }}>Isekai</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Drama"); setVisibleCount(18); setMobileNavOpen(false); }}>Drama</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Comedia"); setVisibleCount(18); setMobileNavOpen(false); }}>Comedia</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "BL"); setVisibleCount(18); setMobileNavOpen(false); }}>BL</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "+18"); setVisibleCount(18); setMobileNavOpen(false); }} className="text-pink-500">+18</a>
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
              <p className="text-gray-400 mb-8">
                Esta sección contiene material explícito (+18). Al hacer clic en "Sí, soy mayor", 
                confirmas que tienes la edad legal en tu país para ver este contenido.
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
                    setShowAdultModal(false);
                    setActiveCategory(pendingCategory);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            
            {/* Adsterra Native Banner (Arriba en el inicio) */}
            {!activeCategory && !searchQuery && <AdsterraNative />}

            {displayHeroes.length > 0 && (
              <section className="hero grid" aria-labelledby="heroTitle">
                {displayHeroes.map((hero, idx) => (
                  <img referrerPolicy="no-referrer" 
                    key={`bg-${hero.id}`}
                    className={`hero-bg transition-opacity duration-1000 ease-in-out ${idx === currentHeroIndex ? 'opacity-100' : 'opacity-0'}`} 
                    src={(hero as any).banner_url || hero.cover_url} 
                    alt={`Ilustración de ${hero.title}`} 
                    loading={idx === currentHeroIndex ? "eager" : "lazy"}
                    fetchPriority={idx === currentHeroIndex ? "high" : "auto"}
                  />
                ))}
                
                {displayHeroes.map((hero, idx) => (
                  <div 
                    key={`content-${hero.id}`}
                    className={`hero-content col-start-1 row-start-1 transition-opacity duration-1000 ease-in-out ${idx === currentHeroIndex ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'}`}
                  >
                    <div className="hero-kicker">
                      <span className="tag accent">{hero.genre}</span>
                      <span className="tag">Webtoon</span>
                    </div>
                    <h1 id="heroTitle" className="hero-title uppercase">{hero.title}</h1>
                    <div className="hero-meta">
                      <span className="rating"><Star />{hero.score}</span>
                      <span className="meta-separator"></span>
                    </div>
                    <p className="hero-copy line-clamp-3">{hero.description}</p>
                    <div className="hero-actions">
                      <Link href={`/manga/${hero.id}`} className="btn btn-primary">
                        <BookOpen />Ver Detalles
                      </Link>
                    </div>
                  </div>
                ))}
              </section>
            )}
            
            <section id="recomendados" className="section" aria-labelledby="recommendedTitle">
              <div className="section-heading">
                <h2 id="recommendedTitle" className="section-title">
                  {favoritesOnly ? 'Mis favoritos' : searchQuery ? `Resultados para "${searchQuery}"` : (activeCategory ? `Categoría: ${activeCategory}` : 'Explorar Catálogo')}
                </h2>
              </div>
              
              {filteredManhwas.length === 0 ? (
                <div className="py-12 text-center text-[#777782] glass rounded-2xl">
                  No se encontraron resultados.
                </div>
              ) : (
                <>
                  <div className="catalog-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
                    {filteredManhwas.slice(0, visibleCount).map((item) => (
                      <article key={item.id} className="media-card h-full">
                        <div className="cover relative">
                          <Link href={`/manga/${item.id}`} className="block">
                            <img referrerPolicy="no-referrer" src={item.cover_url} alt={`Portada de ${item.title}`} loading="lazy" className="w-full object-cover aspect-[2/3]" />
                            <span className="card-badge score"><Star />{item.score ?? '—'}</span>
                            <span className={`absolute top-2 right-2 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-lg ${item.status === 'Finalizado' ? 'bg-[#10b981]/80 text-white border-[#10b981]/30' : 'bg-[#3b82f6]/80 text-white border-[#3b82f6]/30'}`}>
                              {item.status || 'En emisión'}
                            </span>
                          </Link>
                          <button className={`card-favorite favorite-toggle ${favorites.has(item.id) ? 'active' : ''}`} type="button" aria-label={favorites.has(item.id) ? `Quitar ${item.title} de favoritos` : `Añadir ${item.title} a favoritos`} aria-pressed={favorites.has(item.id)} onClick={(e) => toggleFavorite(item.id, e)}>
                            <Heart />
                          </button>
                        </div>
                        <div className="card-info p-3">
                          <h3 className="card-title line-clamp-1"><Link href={`/manga/${item.id}`} className="hover:text-[#c084fc]">{item.title}</Link></h3>
                          <p className="card-meta">{item.genre || 'Género sin especificar'}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                  {visibleCount < filteredManhwas.length && (
                    <div className="flex justify-center mt-12 mb-4">
                      <button 
                        onClick={() => setVisibleCount((v: number) => v + 18)} 
                        className="group relative px-8 py-2.5 rounded-full bg-[#121214] border border-white/10 hover:border-[#a855f7]/50 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#a855f7]/10 to-[#ec4899]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                        <span className="relative text-xs uppercase tracking-wider font-bold text-[#a7a7b1] group-hover:text-white transition-colors flex items-center gap-2">
                          Mostrar más
                        </span>
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
                <h2 id="trendingTitle" className="side-title">Tendencias</h2>
                <span className="side-title-icon"><Flame /></span>
              </div>
              <ol className="rank-list">
                {trending.length === 0 && <p className="text-sm text-center py-4 text-white/50">Cargando...</p>}
                {trending.map((item, i) => (
                  <li key={item.id} className="rank-item">
                    <span className="rank-number">{i + 1}</span>
                    <img referrerPolicy="no-referrer" className="rank-thumb" src={item.cover_url} alt={`Portada de ${item.title}`} loading="lazy" />
                    <div className="rank-copy">
                      <h3 className="rank-name line-clamp-1"><Link href={`/manga/${item.id}`} className="hover:text-[#a855f7]">{item.title}</Link></h3>
                      <p className="rank-genre">{item.genre} • <Star className="w-3 h-3 inline text-[#fbbf24]" /> {item.score}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            
            <div className="w-full flex justify-center mb-6">
              <AdsterraBanner300 />
            </div>
            
            <section id="comunidad" className="side-panel glass">
              <div className="side-header">
                <h2 className="side-title">Reseñas</h2>
                <span className="side-title-icon"><MessagesSquare /></span>
              </div>
              <div className="review-list">
                {recentReviews.length === 0 && <p className="text-sm text-center py-4 text-white/50">Aún no hay reseñas en la plataforma.</p>}
                {recentReviews.map((item) => (
                  <article key={item.id} className="review-item flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                    <div 
                      className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 bg-black/40"
                      dangerouslySetInnerHTML={{ __html: getAvatarSvg(item.avatar_key || "hunter") }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-white truncate pr-2">{"Lector"}</span>
                        <span className="flex text-[#fbbf24] flex-shrink-0">
                          {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < item.rating ? 'fill-current' : 'opacity-20'}`} />)}
                        </span>
                      </div>
                      <p className="text-white/70 text-xs italic line-clamp-2 mb-2">"{item.content}"</p>
                      <Link href={`/manga/${item.manhwa_id}`} className="text-[#a855f7] hover:text-[#c084fc] text-[11px] font-bold uppercase tracking-wider block truncate transition-colors">
                        ↳ EN {item.manhwas?.title || 'MANHWA'}
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
                <h2 id="newsTitle" className="section-title lower-title">Novedades del Catálogo</h2>
                <Link href="#recomendados" className="mini-button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Ver todos <ArrowRight />
                </Link>
              </div>
              <div className="news-grid">
                {manhwas.slice(0, 3).map((item) => (
                  <Link key={item.id} href={`/manga/${item.id}`}>
                    <article className="news-card group cursor-pointer">
                      <div className="news-media">
                        <img referrerPolicy="no-referrer" src={item.cover_url} alt={item.title} loading="lazy" className="group-hover:scale-105 transition-transform duration-500" />
                        <span className="news-label">{item.genre}</span>
                      </div>
                      <div className="news-body">
                        <h3 className="group-hover:text-[#c084fc] transition-colors">{item.title}</h3>
                        <div className="news-meta">
                          <span><Star className="w-3 h-3 inline text-[#fbbf24]" /> {item.score}</span>
                          <span className="text-[#a855f7] font-semibold text-xs">Leer ahora →</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={`skel-${i}`} className="animate-pulse bg-white/5 rounded-xl h-64 border border-white/5"></div>
                  ))
                ) : manhwas.length === 0 ? (
                  <p className="text-white/40 col-span-3 text-center py-8">No hay manhwas disponibles aún.</p>
                ) : null}
              </div>
            </section>
          </div>
          
          <aside className="newsletter glass" aria-labelledby="newsletterTitle">
            <span className="newsletter-glow"></span>
            <span className="newsletter-icon"><Mail /></span>
            <h2 id="newsletterTitle">Únete a Nekutton</h2>
            <p>Suscríbete para recibir recomendaciones, actualizaciones y noticias de manhwas directamente en tu correo.</p>
            <button type="button" className="newsletter-cta" onClick={() => setIsAuthOpen(true)}>
              Crear cuenta gratis
            </button>
            <div className="social-block">
              <span>Síguenos en nuestras redes</span>
              <p className="text-xs text-white/45 mt-3">Próximamente compartiremos los canales oficiales de Nekutton.</p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="site-footer">
        <div className="shell footer-grid">
          <div className="footer-brand">
            <a href="#" className="brand group" aria-label="Nekutton, inicio">
                <svg className="brand-mark w-9 h-9 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)] transition-transform group-hover:scale-110 duration-300" viewBox="0 0 44 44" aria-hidden="true">
                  <defs>
                    <linearGradient id="lg-epic" x1="0" y1="0" x2="44" y2="44">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="lg-epic-2" x1="44" y1="0" x2="0" y2="44">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                  </defs>
                  <path d="M8 32.5V11.7c0-2.2 2.7-3.2 4.2-1.6L28 27.2V10.9c0-1.6 1.3-2.9 2.9-2.9h2.2c1.6 0 2.9 1.3 2.9 2.9v21c0 2.1-2.6 3.2-4.1 1.7L16 16.4v16.1c0 1.9-1.5 3.5-3.5 3.5h-1C9.6 36 8 34.4 8 32.5Z" fill="url(#lg-epic)" />
                  <path d="M14.5 31V15.8L28.5 31" fill="none" stroke="url(#lg-epic-2)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="brand-word tracking-[0.02em] text-[24px] font-black uppercase">
                  <span className="text-white">Neku</span><span className="text-transparent bg-clip-text bg-gradient-to-br from-[#a855f7] to-[#ec4899] drop-shadow-[0_2px_12px_rgba(236,72,153,0.4)]">tton</span>
                </span>
              </a>
            <p>Tu espacio para descubrir, valorar y compartir las mejores historias del universo manhwa y webtoon.</p>
          </div>
          <nav className="footer-links" aria-label="Enlaces del pie">
            <div>
              <h3>Explorar</h3>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, ""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Manhwas</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Acción"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Acción</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Romance"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Romance</a>
              <a href="#categorias">Categorías</a>
            </div>
            <div>
              <h3>Cuenta</h3>
              {user ? (
                <>
                  <Link href="/profile">Mi perfil</Link>
                  <a href="#recomendados" onClick={(e) => { e.preventDefault(); setFavoritesOnly(true); setActiveCategory(""); setSearchQuery(""); setVisibleCount(18); document.getElementById("recomendados")?.scrollIntoView({ behavior: "smooth" }); }}>Mis Favoritos</a>
                </>
              ) : (
                <>
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsAuthOpen(true); }}>Iniciar sesión</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsAuthOpen(true); }}>Registrarse</a>
                </>
              )}
            </div>
            <div>
              <h3>Legal y Contacto</h3>
              <Link href="/dmca">DMCA / Copyright</Link>
              <a href="#" onClick={(e) => { e.preventDefault(); setLegalModal({isOpen: true, type: "terminos"}); }}>Términos</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setLegalModal({isOpen: true, type: "privacidad"}); }}>Privacidad</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setLegalModal({isOpen: true, type: "cookies"}); }}>Cookies</a>
              <a href="mailto:diazmowi07@gmail.com">diazmowi07@gmail.com</a>
            </div>
          </nav>
          <div className="store-buttons">
            <span>Descarga nuestra app</span>
            <a href="#" onClick={(e) => { e.preventDefault(); showToastMessage("App Store — Próximamente"); }}>
              <Apple />
              <span><small>Próximamente en</small>App Store</span>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); showToastMessage("Google Play — Próximamente"); }}>
              <Play />
              <span><small>Próximamente en</small>Google Play</span>
            </a>
          </div>
        </div>
        <div className="shell footer-bottom">
          <span>© 2026 Nekutton. Todos los derechos reservados.</span>
          <div>
            <a href="#" onClick={(e) => { e.preventDefault(); setLegalModal({isOpen: true, type: "privacidad"}); }}>Política de Privacidad</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setLegalModal({isOpen: true, type: "terminos"}); }}>Términos de Servicio</a>
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
        onClose={() => setLegalModal({isOpen: false, type: ""})}
      />

      <div className={`toast ${showToast ? 'show' : ''}`} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </>
  );
}










