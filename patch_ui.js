const fs = require('fs');

let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Fix Desktop Nav Scrollbar issue
const badNav = '<nav className="desktop-nav flex items-center gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide" aria-label="Navegación principal">';
const goodNav = '<nav className="desktop-nav flex items-center gap-5" aria-label="Navegación principal">';
code = code.replace(badNav, goodNav);

// 2. Fix the Button
const badBtnRegex = /<div className="flex justify-center mt-10">[\s\S]*?<\/div>/;
const goodBtn = `<div className="flex justify-center mt-12 mb-4">
                      <button 
                        onClick={() => setVisibleCount((v: number) => v + 18)} 
                        className="group relative px-8 py-2.5 rounded-full bg-[#121214] border border-white/10 hover:border-[#a855f7]/50 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#a855f7]/10 to-[#ec4899]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                        <span className="relative text-xs uppercase tracking-wider font-bold text-[#a7a7b1] group-hover:text-white transition-colors flex items-center gap-2">
                          Mostrar más
                        </span>
                      </button>
                    </div>`;

if (code.match(badBtnRegex)) {
    code = code.replace(badBtnRegex, goodBtn);
}

fs.writeFileSync('src/app/page.tsx', code);
console.log('UI Patched!');
