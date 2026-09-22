const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldHeaderBrand = `<a href="#" className="brand" aria-label="Nekutoon, inicio">
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
              </a>`;

const oldFooterBrand = `<a href="#" className="brand">
                <svg className="brand-mark" viewBox="0 0 44 44" aria-hidden="true">
                  <path d="M8 32.5V11.7c0-2.2 2.7-3.2 4.2-1.6L28 27.2V10.9c0-1.6 1.3-2.9 2.9-2.9h2.2c1.6 0 2.9 1.3 2.9 2.9v21c0 2.1-2.6 3.2-4.1 1.7L16 16.4v16.1c0 1.9-1.5 3.5-3.5 3.5h-1C9.6 36 8 34.4 8 32.5Z" fill="url(#lg)" />
                </svg>
                <span className="brand-word">neku<span>toon</span></span>
              </a>`;

const newBrand = `<a href="#" className="brand group" aria-label="Nekutoon, inicio">
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
                  <span className="text-white">Neku</span><span className="text-transparent bg-clip-text bg-gradient-to-br from-[#a855f7] to-[#ec4899] drop-shadow-[0_2px_12px_rgba(236,72,153,0.4)]">toon</span>
                </span>
              </a>`;

content = content.replace(oldHeaderBrand, newBrand);
content = content.replace(oldFooterBrand, newBrand);

fs.writeFileSync('src/app/page.tsx', content);
console.log('Replaced logo!');
