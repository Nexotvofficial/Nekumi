const fs = require('fs');

let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add Pagination State
if (!pageContent.includes('visibleCount')) {
    pageContent = pageContent.replace('const [pendingCategory, setPendingCategory] = useState("");', 'const [pendingCategory, setPendingCategory] = useState("");\n  const [visibleCount, setVisibleCount] = useState(18);');
}

// 2. Add New Genres to Desktop Nav
const desktopNavRegex = /<nav className="desktop-nav" aria-label="Navegación principal">[\s\S]*?<\/nav>/;
const newDesktopNav = `<nav className="desktop-nav flex items-center gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide" aria-label="Navegación principal">
                <a className={\`nav-link \${!activeCategory ? 'active' : ''}\`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, ""); setVisibleCount(18); }}>Explorar</a>
                <a className={\`nav-link \${activeCategory === 'Acción' ? 'active' : ''}\`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Acción"); setVisibleCount(18); }}>Acción</a>
                <a className={\`nav-link \${activeCategory === 'Fantasía' ? 'active' : ''}\`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Fantasía"); setVisibleCount(18); }}>Fantasía</a>
                <a className={\`nav-link \${activeCategory === 'Romance' ? 'active' : ''}\`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Romance"); setVisibleCount(18); }}>Romance</a>
                <a className={\`nav-link \${activeCategory === 'Isekai' ? 'active' : ''}\`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Isekai"); setVisibleCount(18); }}>Isekai</a>
                <a className={\`nav-link \${activeCategory === 'Drama' ? 'active' : ''}\`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Drama"); setVisibleCount(18); }}>Drama</a>
                <a className={\`nav-link \${activeCategory === 'Comedia' ? 'active' : ''}\`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Comedia"); setVisibleCount(18); }}>Comedia</a>
                <a className={\`nav-link \${activeCategory === '+18' ? 'active' : ''} text-pink-500\`} href="#recomendados" onClick={(e) => { handleCategoryClick(e, "+18"); setVisibleCount(18); }}>+18</a>
              </nav>`;
pageContent = pageContent.replace(desktopNavRegex, newDesktopNav);

// 3. Add New Genres to Mobile Nav
const mobileNavRegex = /<nav className={`mobile-nav.*?<\/nav>/s;
const newMobileNav = `<nav className={\`mobile-nav \${mobileNavOpen ? 'open' : ''}\`} aria-label="Navegación móvil">
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, ""); setVisibleCount(18); setMobileNavOpen(false); }}>Explorar</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Acción"); setVisibleCount(18); setMobileNavOpen(false); }}>Acción</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Fantasía"); setVisibleCount(18); setMobileNavOpen(false); }}>Fantasía</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Romance"); setVisibleCount(18); setMobileNavOpen(false); }}>Romance</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Isekai"); setVisibleCount(18); setMobileNavOpen(false); }}>Isekai</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Drama"); setVisibleCount(18); setMobileNavOpen(false); }}>Drama</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "Comedia"); setVisibleCount(18); setMobileNavOpen(false); }}>Comedia</a>
              <a href="#recomendados" onClick={(e) => { handleCategoryClick(e, "+18"); setVisibleCount(18); setMobileNavOpen(false); }} className="text-pink-500">+18</a>
            </nav>`;
pageContent = pageContent.replace(mobileNavRegex, newMobileNav);

// 4. Update the Map function to slice by visibleCount
const mapRegex = /\{filteredManhwas\.map\(\(item\) => \(/;
const newMap = `{filteredManhwas.slice(0, visibleCount).map((item) => (`;
if(!pageContent.includes('slice(0, visibleCount)')) {
    pageContent = pageContent.replace(mapRegex, newMap);
}

// 5. Add Load More Button PROPERLY WITH FRAGMENTS
const loadMoreTarget = /<\/div>\s*\)\s*\}\s*<\/section>/;
const loadMoreBtn = `</div>
                  {visibleCount < filteredManhwas.length && (
                    <div className="flex justify-center mt-10">
                      <button 
                        onClick={() => setVisibleCount(v => v + 18)} 
                        className="bg-[#1c1c24] hover:bg-[#2a2a35] border border-white/5 text-white font-medium py-3 px-8 rounded-full transition-all active:scale-95 flex items-center gap-2">
                        <span>Cargar más manhwas</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>`;

// And add the <Fragment> before <div className="grid grid-cols-2...">
if(!pageContent.includes('Cargar más manhwas')) {
    pageContent = pageContent.replace(
      `) : (
                <div className="grid grid-cols-2`, 
      `) : (
                <>
                <div className="grid grid-cols-2`
    );
    pageContent = pageContent.replace(loadMoreTarget, loadMoreBtn);
}

// 6. Add Status Badge to the Cards
const cardTarget = /<span className="card-badge score"><Star \/>\{item\.score\}<\/span>/;
const cardReplacement = `<span className="card-badge score"><Star />{item.score}</span>
                          {item.status && item.status !== 'Publicado' && (
                            <span className={\`absolute top-2 right-2 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-lg \${item.status === 'Finalizado' ? 'bg-[#10b981]/80 text-white border-[#10b981]/30' : 'bg-[#3b82f6]/80 text-white border-[#3b82f6]/30'}\`}>
                              {item.status}
                            </span>
                          )}`;
pageContent = pageContent.replace(cardTarget, cardReplacement);

fs.writeFileSync('src/app/page.tsx', pageContent);
console.log('page.tsx patched successfully');
