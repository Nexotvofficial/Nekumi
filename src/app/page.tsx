"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Heart,
  Menu,
  Star,
  ExternalLink,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flame, User, LogOut,
  ArrowRight,
  MessagesSquare,
  TrendingUp,
  Mail,
  MessageCircle,
  Camera,
  Video,
  CalendarDays,
  Sparkles,
  Apple,
  Play,
  X as XIcon,
  Shield,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const MEDIA_CONFIG = {
  hero: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1800&q=90",
  avatar: "https://i.pravatar.cc/96?img=47",
  fantasy: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=85",
  action: "https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&w=900&q=85",
  romance: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=85",
  isekai: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=85",
  slice: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85",
  comedy: "https://images.unsplash.com/photo-1614583225154-5fcdda07019e?auto=format&fit=crop&w=900&q=85",
  news1: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=85",
  news2: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=85",
  news3: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=85",
};

interface Manhwa {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  score: number;
  genre: string;
  isNew?: boolean;
}

const trends = [
  { title: 'Solo Leveling', genre: 'Acción • Fantasía', image: MEDIA_CONFIG.action },
  { title: 'Omniscient Reader', genre: 'Aventura • Drama', image: MEDIA_CONFIG.fantasy },
  { title: 'Villains Are Destined to Die', genre: 'Romance • Isekai', image: MEDIA_CONFIG.romance },
  { title: 'Tower of God', genre: 'Fantasía • Misterio', image: MEDIA_CONFIG.fantasy },
  { title: 'The World After the Fall', genre: 'Acción • Aventura', image: MEDIA_CONFIG.action }
];

const reviews = [
  { id: 1, user: 'Luna.art', text: 'Una construcción de mundo increíble. Cada capítulo mejora al anterior.', work: 'El Cazador de Sombras', likes: 82, avatar: 'https://i.pravatar.cc/96?img=47' },
  { id: 2, user: 'DaniReads', text: 'La evolución del protagonista está muy bien escrita y el arte es espectacular.', work: 'Eternal Legend', likes: 64, avatar: 'https://i.pravatar.cc/96?img=12' },
  { id: 3, user: 'Mika_07', text: 'Necesito la próxima temporada ya. El final me dejó sin palabras.', work: 'La Heredera Carmesí', likes: 51, avatar: 'https://i.pravatar.cc/96?img=32' }
];

const categories = [
  ['Fantasía', 'fantasy'],
  ['Acción', 'action'],
  ['Romance', 'romance'],
  ['Isekai', 'isekai'],
  ['Recuentos de la vida', 'slice'],
  ['Comedia', 'comedy']
] as const;

const news = [
  { label: 'Novedades', title: 'Los estrenos de manhwa que no puedes perderte este mes', date: '18 Sep 2026', comments: 24, image: 'news1' },
  { label: 'Guías', title: 'Cómo empezar a leer webtoons: guía esencial para nuevos lectores', date: '15 Sep 2026', comments: 18, image: 'news2' },
  { label: 'Comunidad', title: 'Las historias mejor valoradas por la comunidad de Nekutoon', date: '12 Sep 2026', comments: 37, image: 'news3' }
] as const;


import Script from "next/script";
import AuthModal from "@/components/AuthModal";
import { LegalModal } from "@/components/LegalModal";
import { AdsterraNative, AdsterraBanner300 } from "@/components/Adsterra";
import { getAvatarSvg } from "@/lib/avatars";
import { createClient } from "@/lib/supabase";

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [showAdultModal, setShowAdultModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [realNotifications, setRealNotifications] = useState<any[]>([]);
  const [notificationsRead, setNotificationsRead] = useState(false);
  
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [cardPage, setCardPage] = useState(0);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<{isOpen: boolean, type: any}>({isOpen: false, type: ""});
  const [user, setUser] = useState<any>(null);
  const [manhwas, setManhwas] = useState<Manhwa[]>([]);
  const [trending, setTrending] = useState<Manhwa[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    try {
      const saved = new Set<string>(JSON.parse(localStorage.getItem('nekutoon:favorites') || '[]'));
      setFavorites(saved);
    } catch {}

    // Fetch site config
    supabase.from('site_config').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) setSiteConfig(data);
    });

    // Fetch real manhwas
    supabase.from('manhwas').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setManhwas(data);
    });

    // Fetch trending
    supabase.from('manhwas').select('*').order('score', { ascending: false }).limit(5).then(({ data }) => {
      if (data) setTrending(data);
    });

    // Fetch recent reviews with manhwa title
    supabase.from('reviews').select('*, manhwas(title)').order('created_at', { ascending: false }).limit(3).then(({ data }) => {
      if (data) setRecentReviews(data);
    });

        const fetchInitialNotifications = async () => {
      const { data } = await supabase
        .from('chapters')
        .select('id, chapter_number, created_at, manhwa:manhwas(id, title)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data && data.length > 0) {
        setRealNotifications(data);
        const lastReadId = localStorage.getItem('lastReadNotification');
        if (lastReadId !== data[0].id) {
          setNotificationsRead(false);
        }
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
        // Play notification sound if possible, or just toast
        try { new Audio('/notification.mp3').play(); } catch(e) {}
      })
      .subscribe();

    // Check active session
    supabase.from('visits').insert([{}]).then();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => { subscription.unsubscribe(); supabase.removeChannel(channel); };
  }, [supabase]);

  const handleCategoryClick = (e: any, category: string) => {
    e?.preventDefault();
    if (category === "+18" && !isAdultConfirmed) {
      setPendingCategory("+18");
      setShowAdultModal(true);
    } else {
      setActiveCategory(category);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileMenu(false);
    showToastMessage("Sesión cerrada correctamente");
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      showToastMessage('Inicia sesión para guardar favoritos');
      setIsAuthOpen(true);
      return;
    }

    const next = new Set(favorites);
    if (next.has(id)) {
      next.delete(id);
      showToastMessage('Eliminado de favoritos');
    } else {
      next.add(id);
      showToastMessage('Añadido a favoritos');
    }
    setFavorites(next);
    localStorage.setItem('nekutoon:favorites', JSON.stringify([...next]));
  };

  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1800);
  };

  const filteredManhwas = manhwas.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory ? m.genre.toLowerCase() === activeCategory.toLowerCase() : true;
    return matchesSearch && matchesCat;
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
            <a href="#" className="brand" aria-label="Nekutoon, inicio">
              <svg className="brand-mark" viewBox="0 0 44 44" aria-hidden="true">
                <defs>
                  <linearGradient id="lg" x1="2" y1="3" x2="42" y2="42">
                    <stop stopColor="#7c3aed" />
                    <stop offset=".52" stopColor="#c026d3" />
                    <stop offset="1" stopColor="#f472b6" />
                  </linearGradient>
                </defs>
                <path d="M8 32.5V11.7c0-2.2 2.7-3.2 4.2-1.6L28 27.2V10.9c0-1.6 1.3-2.9 2.9-2.9h2.2c1.6 0 2.9 1.3 2.9 2.9v21c0 2.1-2.6 3.2-4.1 1.7L16 16.4v16.1c0 1.9-1.5 3.5-3.5 3.5h-1C9.6 36 8 34.4 8 32.5Z" fill="url(#lg)" />
                <path d="M14.5 31V15.8L28.5 31" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.2" />
              </svg>
              <span className="brand-word">neku<span>toon</span></span>
            </a>
            <nav className="desktop-nav" aria-label="Navegación principal">
              <a className={`nav-link ${!activeCategory ? 'active' : ''}`} href="#recomendados" onClick={(e) => handleCategoryClick(e, "")}>Explorar</a>
              <a className={`nav-link ${activeCategory === 'Fantasía' ? 'active' : ''}`} href="#recomendados" onClick={(e) => handleCategoryClick(e, "Fantasía")}>Fantasía</a>
              <a className={`nav-link ${activeCategory === 'Acción' ? 'active' : ''}`} href="#recomendados" onClick={(e) => handleCategoryClick(e, "Acción")}>Acción</a>
              <a className={`nav-link ${activeCategory === 'Romance' ? 'active' : ''}`} href="#recomendados" onClick={(e) => handleCategoryClick(e, "Romance")}>Romance</a>
              <a className={`nav-link ${activeCategory === '+18' ? 'active' : ''} text-pink-500`} href="#recomendados" onClick={(e) => handleCategoryClick(e, "+18")}>+18</a>
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
                  {!notificationsRead && <span className="notification-badge">3</span>}
                </button>
                <div className={`notification-dropdown glass ${notificationsOpen ? 'open' : ''}`}>
                  <div className="notification-head">
                      <strong>Notificaciones</strong>
                      <button type="button" onClick={() => { 
                        setNotificationsRead(true); 
                        if (realNotifications.length > 0) {
                          localStorage.setItem('lastReadNotification', realNotifications[0].id);
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
              
              <button className={`icon-btn favorite-toggle ${favorites.size > 0 ? 'active' : ''}`} type="button" aria-label="Ver favoritos">
                <Heart />
              </button>
              {user?.email === 'diazmowi07@gmail.com' && (
                <Link href="/admin" className="btn bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/30 hover:bg-[#a855f7]/30 font-bold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Admin
                </Link>
              )}
              <div className="relative">
                <button className="avatar-button" type="button" aria-label="Abrir perfil" onClick={handleAvatarClick}>
                  <img src={MEDIA_CONFIG.avatar} alt="Avatar de usuario" />
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
            <a href="#recomendados" onClick={(e) => handleCategoryClick(e, "")}>Explorar</a>
            <a href="#recomendados" onClick={(e) => handleCategoryClick(e, "Fantasía")}>Fantasía</a>
            <a href="#recomendados" onClick={(e) => handleCategoryClick(e, "Acción")}>Acción</a>
            <a href="#recomendados" onClick={(e) => handleCategoryClick(e, "Romance")}>Romance</a>
            <a href="#recomendados" onClick={(e) => handleCategoryClick(e, "+18")} className="text-pink-500">+18</a>
          </nav>
        </div>
      </header>

      <main>
        {/* Adsterra Popunder (Sólo en +18) */}
        {isAdultConfirmed && activeCategory === "+18" && (
          <Script src="//pl31363079.profitableratecpmnetwork.com/54/29/bd/5429bd345e3c7e7bc304287e0656aaa3.js" strategy="lazyOnload" />
        )}

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
                  <img 
                    key={`bg-${hero.id}`}
                    className={`hero-bg transition-opacity duration-1000 ease-in-out ${idx === currentHeroIndex ? 'opacity-100' : 'opacity-0'}`} 
                    src={(hero as any).banner_url || hero.cover_url} 
                    alt={`Ilustración de ${hero.title}`} 
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
                  {searchQuery ? `Resultados para "${searchQuery}"` : (activeCategory ? `Categoría: ${activeCategory}` : 'Explorar Catálogo')}
                </h2>
              </div>
              
              {filteredManhwas.length === 0 ? (
                <div className="py-12 text-center text-[#777782] glass rounded-2xl">
                  No se encontraron resultados.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
                  {filteredManhwas.map((item) => (
                    <Link key={item.id} href={`/manga/${item.id}`} className="block">
                      <article className="media-card h-full" tabIndex={0}>
                        <div className="cover">
                          <img src={item.cover_url} alt={`Portada de ${item.title}`} loading="lazy" className="w-full object-cover aspect-[2/3]" />
                          <span className="card-badge score"><Star />{item.score}</span>
                          <button className={`card-favorite favorite-toggle ${favorites.has(item.id) ? 'active' : ''}`} type="button" aria-label={`Añadir ${item.title} a favoritos`} onClick={(e) => toggleFavorite(item.id, e)}>
                            <Heart />
                          </button>
                        </div>
                        <div className="card-info p-3">
                          <h3 className="card-title line-clamp-1">{item.title}</h3>
                          <p className="card-meta">{item.genre}</p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
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
                    <img className="rank-thumb" src={item.cover_url} alt={`Portada de ${item.title}`} loading="lazy" />
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
                        <span className="font-bold text-sm text-white truncate pr-2">{item.user_email?.split('@')[0] || "Usuario"}</span>
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
                        <img src={item.cover_url} alt={item.title} loading="lazy" className="group-hover:scale-105 transition-transform duration-500" />
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
                {manhwas.length === 0 && (
                  <p className="text-white/40 col-span-3 text-center py-8">No hay manhwas disponibles aún.</p>
                )}
              </div>
            </section>
          </div>
          
          <aside className="newsletter glass" aria-labelledby="newsletterTitle">
            <span className="newsletter-glow"></span>
            <span className="newsletter-icon"><Mail /></span>
            <h2 id="newsletterTitle">Únete a Nekutoon</h2>
            <p>Suscríbete para recibir recomendaciones, actualizaciones y noticias de manhwas directamente en tu correo.</p>
            <form onSubmit={(e) => { e.preventDefault(); showToastMessage("¡Gracias por suscribirte!"); setIsAuthOpen(true); }}>
              <label className="sr-only" htmlFor="emailInput">Correo electrónico</label>
              <div className="newsletter-form-row">
                <input id="emailInput" type="email" placeholder="Introduce tu correo" autoComplete="email" required />
                <button type="submit">Suscribirse</button>
              </div>
            </form>
            <div className="social-block">
              <span>Síguenos en nuestras redes</span>
              <div className="social-row">
                <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" aria-label="Discord"><MessageCircle /></a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X"><span className="social-x">𝕏</span></a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Camera /></a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><Video /></a>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="site-footer">
        <div className="shell footer-grid">
          <div className="footer-brand">
            <a href="#" className="brand">
              <svg className="brand-mark" viewBox="0 0 44 44" aria-hidden="true">
                <path d="M8 32.5V11.7c0-2.2 2.7-3.2 4.2-1.6L28 27.2V10.9c0-1.6 1.3-2.9 2.9-2.9h2.2c1.6 0 2.9 1.3 2.9 2.9v21c0 2.1-2.6 3.2-4.1 1.7L16 16.4v16.1c0 1.9-1.5 3.5-3.5 3.5h-1C9.6 36 8 34.4 8 32.5Z" fill="url(#lg)" />
              </svg>
              <span className="brand-word">neku<span>toon</span></span>
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
                  <a href="#" onClick={(e) => { e.preventDefault(); showToastMessage("Favoritos en la próxima actualización"); }}>Mis Favoritos</a>
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
              <a href="#" onClick={(e) => { e.preventDefault(); setLegalModal({isOpen: true, type: "terminos"}); }}>Términos</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setLegalModal({isOpen: true, type: "privacidad"}); }}>Privacidad</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setLegalModal({isOpen: true, type: "derechos"}); }}>Derechos de autor</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setLegalModal({isOpen: true, type: "cookies"}); }}>Cookies</a>
              <a href="mailto:soporte@nekutoon.com">soporte@nekutoon.com</a>
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
          <span>© 2026 Nekutoon. Todos los derechos reservados.</span>
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










