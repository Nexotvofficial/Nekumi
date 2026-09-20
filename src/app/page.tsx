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
} from "lucide-react";
import Image from "next/image";

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

const manhwas = [
  { id: 'shadow-hunter', title: 'El Cazador de Sombras', meta: 'Fantasía • 49 capítulos', score: '4.9', isNew: true, image: MEDIA_CONFIG.action },
  { id: 'eternal-legend', title: 'Eternal Legend', meta: 'Acción • 72 capítulos', score: '4.8', isNew: false, image: 'https://images.unsplash.com/photo-1614583225154-5fcdda07019e?auto=format&fit=crop&w=600&q=85' },
  { id: 'crimson-heiress', title: 'La Heredera Carmesí', meta: 'Romance • 38 capítulos', score: '4.7', isNew: true, image: MEDIA_CONFIG.romance },
  { id: 'northern-ashes', title: 'Cenizas del Norte', meta: 'Drama • 61 capítulos', score: '4.8', isNew: false, image: MEDIA_CONFIG.isekai },
  { id: 'infinite-tower', title: 'La Torre Infinita', meta: 'Aventura • 106 capítulos', score: '4.9', isNew: true, image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=600&q=85' },
  { id: 'arcane-code', title: 'Código Arcano', meta: 'Misterio • 28 capítulos', score: '4.6', isNew: false, image: MEDIA_CONFIG.slice },
  { id: 'crystal-night', title: 'Noche de Cristal', meta: 'Fantasía • 43 capítulos', score: '4.7', isNew: true, image: MEDIA_CONFIG.fantasy },
  { id: 'last-guardian', title: 'El Último Guardián', meta: 'Acción • 84 capítulos', score: '4.8', isNew: false, image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=85' }
];

const trends = [
  { title: 'Solo Leveling', genre: 'Acción • Fantasía', image: manhwas[0].image },
  { title: 'Omniscient Reader', genre: 'Aventura • Drama', image: manhwas[1].image },
  { title: 'Villains Are Destined to Die', genre: 'Romance • Isekai', image: manhwas[2].image },
  { title: 'Tower of God', genre: 'Fantasía • Misterio', image: manhwas[4].image },
  { title: 'The World After the Fall', genre: 'Acción • Aventura', image: manhwas[6].image }
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
  const supabase = createClient();

  useEffect(() => {
    try {
      const saved = new Set<string>(JSON.parse(localStorage.getItem('nekutoon:favorites') || '[]'));
      setFavorites(saved);
    } catch {}

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const maxCardPage = Math.max(0, manhwas.length - 6); // Approximation for desktop

  const handleAvatarClick = () => {
    if (user) {
      showToastMessage("Perfil (Próximamente)");
    } else {
      setIsAuthOpen(true);
    }
  };

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
              <a className="nav-link active" href="#recomendados">Explorar</a>
              <a className="nav-link" href="#recomendados">Recomendaciones</a>
              <a className="nav-link" href="#comunidad">Comunidad</a>
              <a className="nav-link" href="#oficiales">Plataformas Oficiales</a>
              <a className="nav-link premium" href="#premium">Premium</a>
            </nav>
            <div className="header-actions">
              <div className="search-wrap desktop-search">
                <Search />
                <label className="sr-only" htmlFor="desktopSearch">Buscar</label>
                <input id="desktopSearch" className="search-input" type="search" placeholder="Buscar manhwas, artistas, géneros..." autoComplete="off" onKeyDown={(e) => { if (e.key === 'Enter') showToastMessage(`Buscando "${e.currentTarget.value}"`) }} />
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
                <input id="mobileSearchInput" className="search-input" type="search" placeholder="Buscar manhwas, artistas, géneros..." />
              </div>
            </div>
          )}
          
          <nav className={`mobile-nav ${mobileNavOpen ? 'open' : ''}`} aria-label="Navegación móvil">
            <a href="#recomendados">Explorar</a>
            <a href="#recomendados">Recomendaciones</a>
            <a href="#comunidad">Comunidad</a>
            <a href="#categorias">Categorías</a>
            <a href="#noticias">Noticias</a>
          </nav>
        </div>
      </header>

      <main>
        <div className="shell page-grid">
          <div className="main-column">
            <section className="hero" aria-labelledby="heroTitle">
              <img className="hero-bg" src={MEDIA_CONFIG.hero} alt="Ilustración atmosférica del Cazador de Sombras" />
              <div className="hero-content">
                <div className="hero-kicker">
                  <span className="tag accent">Fantasía de acción</span>
                  <span className="tag">Webtoon</span>
                  <span className="tag">Estreno de temporada</span>
                </div>
                <h1 id="heroTitle" className="hero-title">EL CAZADOR<br />DE SOMBRAS</h1>
                <div className="hero-meta">
                  <span className="rating"><Star />4.9</span>
                  <span>(14.2k votos)</span>
                  <span className="meta-separator"></span>
                  <span><Heart className="w-[13px] inline" /> 28.6k</span>
                </div>
                <p className="hero-copy">Cuando las sombras despiertan, solo un cazador puede detenerlas. Una historia de poder, secretos y destinos enfrentados en un mundo al borde de la oscuridad.</p>
                <div className="hero-actions">
                  <button className="btn btn-primary" type="button" onClick={() => showToastMessage("Abriendo la reseña")}>
                    <BookOpen />Leer Reseña
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => showToastMessage("Enlaces oficiales")}>
                    <ExternalLink />Enlaces Oficiales
                  </button>
                </div>
              </div>
              <div className="slider-dots">
                <button className="active" aria-label="Banner 1"></button>
                <button aria-label="Banner 2"></button>
                <button aria-label="Banner 3"></button>
              </div>
            </section>
            
            <section id="recomendados" className="section" aria-labelledby="recommendedTitle">
              <div className="section-heading">
                <h2 id="recommendedTitle" className="section-title">Recomendados de la Semana</h2>
                <div className="section-tools">
                  <a className="text-link" href="#" onClick={(e) => { e.preventDefault(); showToastMessage("Catálogo completo"); }}>Ver todos</a>
                  <button className="round-arrow" type="button" aria-label="Anteriores" disabled={cardPage === 0} onClick={() => setCardPage(Math.max(0, cardPage - 1))}>
                    <ChevronLeft />
                  </button>
                  <button className="round-arrow" type="button" aria-label="Siguientes" disabled={cardPage >= maxCardPage} onClick={() => setCardPage(cardPage + 1)}>
                    <ChevronRight />
                  </button>
                </div>
              </div>
              <div className="cards-viewport">
                <div className="cards-track" style={{ transform: `translateX(calc(-${cardPage} * (100% / 6)))` }}>
                  {manhwas.map((item) => (
                    <article key={item.id} className="media-card" tabIndex={0} onClick={() => showToastMessage(`Abriendo ${item.title}`)}>
                      <div className="cover">
                        <img src={item.image} alt={`Portada de ${item.title}`} loading="lazy" />
                        <span className="card-badge score"><Star />{item.score}</span>
                        {item.isNew && <span className="card-badge new">Nuevo</span>}
                        <button className={`card-favorite favorite-toggle ${favorites.has(item.id) ? 'active' : ''}`} type="button" aria-label={`Añadir ${item.title} a favoritos`} onClick={(e) => toggleFavorite(item.id, e)}>
                          <Heart />
                        </button>
                      </div>
                      <div className="card-info">
                        <h3 className="card-title">{item.title}</h3>
                        <p className="card-meta">{item.meta}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>
          
          <aside className="sidebar">
            <section className="side-panel glass" aria-labelledby="trendingTitle">
              <div className="side-header">
                <h2 id="trendingTitle" className="side-title">Tendencias de la Semana</h2>
                <span className="side-title-icon"><Flame /></span>
              </div>
              <ol className="rank-list">
                {trends.map((item, i) => (
                  <li key={i} className="rank-item">
                    <span className="rank-number">{i + 1}</span>
                    <img className="rank-thumb" src={item.image} alt={`Portada de ${item.title}`} loading="lazy" />
                    <div className="rank-copy">
                      <h3 className="rank-name">{item.title}</h3>
                      <p className="rank-genre">{item.genre}</p>
                    </div>
                    <span className="trend-up"><TrendingUp /></span>
                  </li>
                ))}
              </ol>
              <div className="panel-footer">
                <button className="mini-button" onClick={() => showToastMessage("Todas las tendencias")}>
                  Ver todas <ArrowRight />
                </button>
              </div>
            </section>
            
            <section id="comunidad" className="side-panel glass">
              <div className="side-header">
                <h2 className="side-title">Reseñas de la Comunidad</h2>
                <span className="side-title-icon"><MessagesSquare /></span>
              </div>
              <div className="review-list">
                {reviews.map((item) => (
                  <article key={item.id} className="review-item">
                    <img className="review-avatar" src={item.avatar} alt={`Avatar de ${item.user}`} loading="lazy" />
                    <div className="review-main">
                      <div className="review-head">
                        <span className="review-user">{item.user}</span>
                        <span className="review-stars">
                          <Star /><Star /><Star /><Star /><Star />
                        </span>
                      </div>
                      <p className="review-text">“{item.text}”</p>
                      <p className="review-work">{item.work}</p>
                    </div>
                    <button className="review-like" type="button" aria-label="Me gusta">
                      <Heart />
                      <span>{item.likes}</span>
                    </button>
                  </article>
                ))}
              </div>
              <div className="panel-footer">
                <button className="mini-button" onClick={() => showToastMessage("Más reseñas")}>
                  Siguiente <ArrowRight />
                </button>
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
