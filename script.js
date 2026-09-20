/* Datos editables. Para usar tus imágenes, reemplaza cada URL de image. */
const manhwas=[
 {title:'El Cazador de Sombras',meta:'Fantasía • 49 capítulos',score:'4.9',isNew:true,image:'https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&w=600&q=85'},
 {title:'Eternal Legend',meta:'Acción • 72 capítulos',score:'4.8',isNew:false,image:'https://images.unsplash.com/photo-1614583225154-5fcdda07019e?auto=format&fit=crop&w=600&q=85'},
 {title:'La Heredera Carmesí',meta:'Romance • 38 capítulos',score:'4.7',isNew:true,image:'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=85'},
 {title:'Cenizas del Norte',meta:'Drama • 61 capítulos',score:'4.8',isNew:false,image:'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=85'},
 {title:'La Torre Infinita',meta:'Aventura • 106 capítulos',score:'4.9',isNew:true,image:'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=600&q=85'},
 {title:'Código Arcano',meta:'Misterio • 28 capítulos',score:'4.6',isNew:false,image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=85'},
 {title:'Noche de Cristal',meta:'Fantasía • 43 capítulos',score:'4.7',isNew:true,image:'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=85'},
 {title:'El Último Guardián',meta:'Acción • 84 capítulos',score:'4.8',isNew:false,image:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=85'}
];
const trends=[
 {title:'Solo Leveling',genre:'Acción • Fantasía',image:manhwas[0].image},{title:'Omniscient Reader',genre:'Aventura • Drama',image:manhwas[1].image},{title:'Villains Are Destined to Die',genre:'Romance • Isekai',image:manhwas[2].image},{title:'Tower of God',genre:'Fantasía • Misterio',image:manhwas[4].image},{title:'The World After the Fall',genre:'Acción • Aventura',image:manhwas[6].image}
];
const reviews=[
 {user:'Luna.art',text:'Una construcción de mundo increíble. Cada capítulo mejora al anterior.',work:'El Cazador de Sombras',likes:82,avatar:'https://i.pravatar.cc/96?img=47'},
 {user:'DaniReads',text:'La evolución del protagonista está muy bien escrita y el arte es espectacular.',work:'Eternal Legend',likes:64,avatar:'https://i.pravatar.cc/96?img=12'},
 {user:'Mika_07',text:'Necesito la próxima temporada ya. El final me dejó sin palabras.',work:'La Heredera Carmesí',likes:51,avatar:'https://i.pravatar.cc/96?img=32'}
];

/* Renderizado de tarjetas y listas. */
const track=document.getElementById('cardsTrack');
track.innerHTML=manhwas.map(item=>`<article class="media-card" tabindex="0" data-title="${item.title}" aria-label="Abrir ${item.title}"><div class="cover"><img src="${item.image}" alt="Portada de ${item.title}" loading="lazy"><span class="card-badge score"><i data-lucide="star"></i>${item.score}</span>${item.isNew?'<span class="card-badge new">Nuevo</span>':''}</div><div class="card-info"><h3 class="card-title">${item.title}</h3><p class="card-meta">${item.meta}</p></div></article>`).join('');
document.getElementById('trendingList').innerHTML=trends.map((item,i)=>`<li class="rank-item"><span class="rank-number">${i+1}</span><img class="rank-thumb" src="${item.image}" alt="Portada de ${item.title}" loading="lazy"><div class="rank-copy"><h3 class="rank-name">${item.title}</h3><p class="rank-genre">${item.genre}</p></div><span class="trend-up" aria-label="Subiendo"><i data-lucide="trending-up"></i></span></li>`).join('');
document.getElementById('reviewsList').innerHTML=reviews.map(item=>`<article class="review-item"><img class="review-avatar" src="${item.avatar}" alt="Avatar de ${item.user}" loading="lazy"><div class="review-main"><div class="review-head"><span class="review-user">${item.user}</span><span class="review-stars" aria-label="5 estrellas">${'<i data-lucide="star"></i>'.repeat(5)}</span></div><p class="review-text">“${item.text}”</p><p class="review-work">${item.work}</p></div><button class="review-like" type="button" aria-label="Me gusta" data-likes="${item.likes}"><i data-lucide="heart"></i><span>${item.likes}</span></button></article>`).join('');
lucide.createIcons({attrs:{'stroke-width':1.8}});

/* Pequeña notificación visual para las acciones de demostración. */
const toast=document.getElementById('toast');let toastTimer;
function showToast(message){clearTimeout(toastTimer);toast.textContent=message;toast.classList.add('show');toastTimer=setTimeout(()=>toast.classList.remove('show'),1800)}

/* Menú y buscador para móvil. */
const menuBtn=document.getElementById('menuBtn'),mobileNav=document.getElementById('mobileNav');
menuBtn.addEventListener('click',()=>{const open=mobileNav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',open);menuBtn.innerHTML=`<i data-lucide="${open?'x':'menu'}"></i>`;lucide.createIcons({attrs:{'stroke-width':1.8}})});
const mobileSearch=document.getElementById('mobileSearch');
document.getElementById('mobileSearchBtn').addEventListener('click',()=>{mobileSearch.classList.toggle('visible');if(mobileSearch.classList.contains('visible'))document.getElementById('mobileSearchInput').focus()});
document.querySelectorAll('.search-input').forEach(input => input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && input.value.trim()) {
    window.location.href = `explorar.html?q=${encodeURIComponent(input.value.trim())}`;
  }
}));

/* Carrusel de recomendaciones en escritorio; desplazamiento táctil en móvil. */
let cardPage = 0; const prev = document.getElementById('cardsPrev'), next = document.getElementById('cardsNext');
function visibleCards() { return innerWidth <= 760 ? 2 : innerWidth <= 1230 ? 5 : 6; }
if (prev && next) {
  function updateCarousel() { if (innerWidth <= 760) { track.style.transform = ''; prev.disabled = true; next.disabled = true; return } const max = Math.max(0, manhwas.length - visibleCards()); cardPage = Math.min(cardPage, max); const card = track.querySelector('.media-card'); const step = card ? card.getBoundingClientRect().width + 10 : 0; track.style.transform = `translateX(${-cardPage * step}px)`; prev.disabled = cardPage === 0; next.disabled = cardPage >= max; }
  prev.addEventListener('click', () => { cardPage = Math.max(0, cardPage - 1); updateCarousel(); }); next.addEventListener('click', () => { cardPage++; updateCarousel(); }); addEventListener('resize', updateCarousel); updateCarousel();
}

/* Interacciones de botones, tarjetas, slider y likes. */
document.addEventListener('click', e => {
  const action = e.target.closest('[data-action]');
  if (action) {
    e.preventDefault();
    const act = action.dataset.action;
    if (act === 'Perfil') window.location.href = 'perfil.html';
    else if (act === 'Favoritos') window.location.href = 'favoritos.html';
    else if (act === 'Notificaciones') window.location.href = 'notificaciones.html';
    else if (act === 'Catálogo completo' || act === 'Todas las tendencias') window.location.href = 'explorar.html';
    else if (act === 'Más reseñas') window.location.href = 'comunidad.html';
    else if (act === 'Abriendo la reseña') window.location.href = 'manga.html';
    else if (act === 'Enlaces oficiales') window.location.href = 'manga.html';
    else showToast(act);
  }
  const card = e.target.closest('.media-card');
  if (card) {
    window.location.href = 'manga.html';
  }
  const dot = e.target.closest('.slider-dots button');
  if (dot) {
    document.querySelectorAll('.slider-dots button').forEach(el => el.classList.remove('active'));
    dot.classList.add('active');
  }
});
document.querySelectorAll('.media-card').forEach(card => card.addEventListener('keydown', e => {
  if (e.key === 'Enter') window.location.href = 'manga.html';
}));
document.querySelectorAll('.review-like').forEach(button => button.addEventListener('click', () => {
  const active = button.classList.toggle('liked'), base = Number(button.dataset.likes);
  button.querySelector('span').textContent = base + (active ? 1 : 0);
}));