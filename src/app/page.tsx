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
  Flame,
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


import AuthModal from "@/components/AuthModal";
import { createClient } from "@/lib/supabase";

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [cardPage, setCardPage] = useState(0);

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [manhwas, setManhwas] = useState<Manhwa[]>([]);
  const [trending, setTrending] = useState<Manhwa[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const supabase = createClient();

  useEffect(() => {
    try {
      const saved = new Set<string>(JSON.parse(localStorage.getItem('nekutoon:favorites') || '[]'));
      setFavorites(saved);
    } catch {}

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

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

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

  const handleAvatarClick = () => {
    if (user) {
      showToastMessage("Perfil (Próximamente)");
    } else {
      setIsAuthOpen(true);
    }
  };

  const heroManhwa = manhwas.find(m => (m as any).is_hero) || manhwas[0];

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
              <a className={`nav-link ${!activeCategory ? 'active' : ''}`} href="#recomendados" onClick={(e) => { e.preventDefault(); setActiveCategory(""); }}>Explorar</a>
              <a className={`nav-link ${activeCategory === 'Fantasía' ? 'active' : ''}`} href="#recomendados" onClick={(e) => { e.preventDefault(); setActiveCategory("Fantasía"); }}>Fantasía</a>
              <a className={`nav-link ${activeCategory === 'Acción' ? 'active' : ''}`} href="#recomendados" onClick={(e) => { e.preventDefault(); setActiveCategory("Acción"); }}>Acción</a>
              <a className={`nav-link ${activeCategory === 'Romance' ? 'active' : ''}`} href="#recomendados" onClick={(e) => { e.preventDefault(); setActiveCategory("Romance"); }}>Romance</a>
              <a className={`nav-link ${activeCategory === '+18' ? 'active' : ''} text-pink-500`} href="#recomendados" onClick={(e) => { e.preventDefault(); setActiveCategory("+18"); }}>+18</a>
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
                    <button type="button" onClick={() => { setNotificationsRead(true); showToastMessage('Notificaciones marcadas como leídas'); }}>Marcar leídas</button>
                  </div>
                  <a href="#" className="notification-item">
                    <span className="notification-icon"><Sparkles /></span>
                    <span><b>Nuevo capítulo disponible</b><small>El Cazador de Sombras · Cap. 50</small></span>
                  </a>
                  <a href="#" className="notification-item">
                    <span className="notification-icon"><BookOpen /></span>
                    <span><b>Estreno esta semana</b><small>La Heredera Carmesí · Temporada 2</small></span>
                  </a>
                  <a href="#" className="notification-item">
                    <span className="notification-icon"><MessageCircle /></span>
                    <span><b>Respondieron tu reseña</b><small>Luna.art mencionó tu comentario</small></span>
                  </a>
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
              <button className="avatar-button" type="button" aria-label="Abrir perfil" onClick={handleAvatarClick}>
                <img src={MEDIA_CONFIG.avatar} alt="Avatar de usuario" />
              </button>
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
            <a href="#recomendados" onClick={() => setActiveCategory("")}>Explorar</a>
            <a href="#recomendados" onClick={() => setActiveCategory("Fantasía")}>Fantasía</a>
            <a href="#recomendados" onClick={() => setActiveCategory("Acción")}>Acción</a>
            <a href="#recomendados" onClick={() => setActiveCategory("Romance")}>Romance</a>
            <a href="#recomendados" onClick={() => setActiveCategory("+18")} className="text-pink-500">+18</a>
          </nav>
        </div>
      </header>

      <main>
        <div className="shell page-grid">
          <div className="main-column">
            {heroManhwa && (
              <section className="hero" aria-labelledby="heroTitle">
                <img className="hero-bg" src={(heroManhwa as any).banner_url || heroManhwa.cover_url} alt={`Ilustración de ${heroManhwa.title}`} />
                <div className="hero-content">
                  <div className="hero-kicker">
                    <span className="tag accent">{heroManhwa.genre}</span>
                    <span className="tag">Webtoon</span>
                  </div>
                  <h1 id="heroTitle" className="hero-title uppercase">{heroManhwa.title}</h1>
                  <div className="hero-meta">
                    <span className="rating"><Star />{heroManhwa.score}</span>
                    <span className="meta-separator"></span>
                  </div>
                  <p className="hero-copy">{heroManhwa.description}</p>
                  <div className="hero-actions">
                    <Link href={`/manga/${heroManhwa.id}`} className="btn btn-primary">
                      <BookOpen />Ver Detalles
                    </Link>
                  </div>
                </div>
              </section>
            )}
            
            <section id="recomendados" className="section" aria-labelledby="recommendedTitle">
              <div className="section-heading">
                <h2 id="recommendedTitle" className="section-title">
                  {searchQuery ? `Resultados para "${searchQuery}"` : (activeCategory ? `Categoría: ${activeCategory}` : 'Explorar Catálogo')}
                </h2>
                <div className="section-tools">
                  <button className="round-arrow" type="button" aria-label="Anteriores" disabled={cardPage === 0} onClick={() => setCardPage(Math.max(0, cardPage - 1))}>
                    <ChevronLeft />
                  </button>
                  <button className="round-arrow" type="button" aria-label="Siguientes" disabled={cardPage >= maxCardPage} onClick={() => setCardPage(cardPage + 1)}>
                    <ChevronRight />
                  </button>
                </div>
              </div>
              
              {filteredManhwas.length === 0 ? (
                <div className="py-12 text-center text-[#777782] glass rounded-2xl">
                  No se encontraron resultados.
                </div>
              ) : (
                <div className="cards-viewport">
                  <div className="cards-track" style={{ transform: `translateX(calc(-${cardPage} * (100% / 6)))` }}>
                    {filteredManhwas.map((item) => (
                      <Link key={item.id} href={`/manga/${item.id}`} className="block">
                        <article className="media-card" tabIndex={0}>
                          <div className="cover">
                            <img src={item.cover_url} alt={`Portada de ${item.title}`} loading="lazy" />
                            <span className="card-badge score"><Star />{item.score}</span>
                            <button className={`card-favorite favorite-toggle ${favorites.has(item.id) ? 'active' : ''}`} type="button" aria-label={`Añadir ${item.title} a favoritos`} onClick={(e) => toggleFavorite(item.id, e)}>
                              <Heart />
                            </button>
                          </div>
                          <div className="card-info">
                            <h3 className="card-title">{item.title}</h3>
                            <p className="card-meta">{item.genre}</p>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
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
            
            <section id="comunidad" className="side-panel glass">
              <div className="side-header">
                <h2 className="side-title">Reseñas</h2>
                <span className="side-title-icon"><MessagesSquare /></span>
              </div>
              <div className="review-list">
                {recentReviews.length === 0 && <p className="text-sm text-center py-4 text-white/50">Aún no hay reseñas en la plataforma.</p>}
                {recentReviews.map((item) => (
                  <article key={item.id} className="review-item">
                    <div className="review-main" style={{ marginLeft: 0 }}>
                      <div className="review-head">
                        <span className="review-user">{item.user_email?.split('@')[0] || "Usuario"}</span>
                        <span className="review-stars">
                          {[...Array(5)].map((_, i) => <Star key={i} className={i < item.rating ? 'fill-current' : 'opacity-20'} />)}
                        </span>
                      </div>
                      <p className="review-text line-clamp-3 text-sm">“{item.content}”</p>
                      <p className="review-work text-xs text-[#a855f7]"><Link href={`/manga/${item.manhwa_id}`}>Leer reseña en {item.manhwas?.title || 'este manhwa'}</Link></p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <div className="shell lower-grid">
          <div className="lower-content">
            <section id="categorias" className="lower-section" aria-labelledby="categoriesTitle">
              <div className="section-heading">
                <h2 id="categoriesTitle" className="section-title lower-title">Explora por Categorías</h2>
              </div>
              <div className="categories-grid">
                {categories.map(([name, key]) => (
                  <a key={key} href="#recomendados" className="category-card" onClick={(e) => { e.preventDefault(); showToastMessage(`Explorando ${name}`) }}>
                    <img src={MEDIA_CONFIG[key as keyof typeof MEDIA_CONFIG]} alt={`Categoría ${name}`} loading="lazy" />
                    <h3>{name}</h3>
                  </a>
                ))}
              </div>
            </section>
            
            <section id="noticias" className="lower-section" aria-labelledby="newsTitle">
              <div className="section-heading">
                <h2 id="newsTitle" className="section-title lower-title">Últimas Noticias y Artículos</h2>
                <a href="#" className="mini-button" onClick={(e) => { e.preventDefault(); showToastMessage("Todos los artículos") }}>
                  Ver todos <ArrowRight />
                </a>
              </div>
              <div className="news-grid">
                {news.map((item, i) => (
                  <article key={i} className="news-card">
                    <div className="news-media">
                      <img src={MEDIA_CONFIG[item.image as keyof typeof MEDIA_CONFIG]} alt={item.title} loading="lazy" />
                      <span className="news-label">{item.label}</span>
                    </div>
                    <div className="news-body">
                      <h3>{item.title}</h3>
                      <div className="news-meta">
                        <span><CalendarDays />{item.date}</span>
                        <span><MessageCircle />{item.comments}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
          
          <aside className="newsletter glass" aria-labelledby="newsletterTitle">
            <span className="newsletter-glow"></span>
            <span className="newsletter-icon"><Mail /></span>
            <h2 id="newsletterTitle">Únete a Nekutoon</h2>
            <p>Suscríbete para recibir recomendaciones, actualizaciones y noticias de manhwas directamente en tu correo.</p>
            <form onSubmit={(e) => { e.preventDefault(); showToastMessage("¡Gracias por suscribirte!") }}>
              <label className="sr-only" htmlFor="emailInput">Correo electrónico</label>
              <div className="newsletter-form-row">
                <input id="emailInput" type="email" placeholder="Introduce tu correo" autoComplete="email" required />
                <button type="submit">Suscribirse</button>
              </div>
            </form>
            <div className="social-block">
              <span>Síguenos en nuestras redes</span>
              <div className="social-row">
                <a href="#" aria-label="Discord"><MessageCircle /></a>
                <a href="#" aria-label="X"><span className="social-x">𝕏</span></a>
                <a href="#" aria-label="Instagram"><Camera /></a>
                <a href="#" aria-label="YouTube"><Video /></a>
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
              <a href="#recomendados">Manhwas</a>
              <a href="#recomendados">Recomendaciones</a>
              <a href="#comunidad">Comunidad</a>
              <a href="#categorias">Categorías</a>
            </div>
            <div>
              <h3>Comunidad</h3>
              <a href="#">Foro</a>
              <a href="#">Discord</a>
              <a href="#">Soporte</a>
              <a href="#">Contacto</a>
            </div>
            <div>
              <h3>Legal</h3>
              <a href="#">Términos</a>
              <a href="#">Privacidad</a>
              <a href="#">Derechos de autor</a>
              <a href="#">Cookies</a>
            </div>
          </nav>
          <div className="store-buttons">
            <span>Descarga nuestra app</span>
            <a href="#" onClick={(e) => { e.preventDefault(); showToastMessage("App Store") }}>
              <Apple />
              <span><small>Disponible en</small>App Store</span>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); showToastMessage("Google Play") }}>
              <Play />
              <span><small>Disponible en</small>Google Play</span>
            </a>
          </div>
        </div>
        <div className="shell footer-bottom">
          <span>© 2026 Nekutoon. Todos los derechos reservados.</span>
          <div>
            <a href="#">Política de Privacidad</a>
            <a href="#">Términos de Servicio</a>
          </div>
        </div>
      </footer>
      
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onSuccess={(u) => setUser(u)} 
        showToast={showToastMessage} 
      />

      <div className={`toast ${showToast ? 'show' : ''}`} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </>
  );
}
