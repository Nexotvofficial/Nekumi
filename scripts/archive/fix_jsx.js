const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const target = `                </div>
                  {visibleCount < filteredManhwas.length && (
                    <div className="flex justify-center mt-10">
                      <button 
                        onClick={() => setVisibleCount(v => v + 18)} 
                        className="bg-[#1c1c24] hover:bg-[#2a2a35] border border-white/5 text-white font-medium py-3 px-8 rounded-full transition-all active:scale-95 flex items-center gap-2">
                        <span>Cargar más manhwas</span>
                      </button>
                    </div>
                  )}
                )
              }
            </section>`;

const replacement = `                </div>
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

if (code.includes(target)) {
    code = code.replace(target, replacement);
    
    // We also need to inject <> after (
    const startTarget = `              ) : (
                <div className="grid grid-cols-2`;
    const startReplacement = `              ) : (
                <>
                <div className="grid grid-cols-2`;
    code = code.replace(startTarget, startReplacement);
    
    fs.writeFileSync('src/app/page.tsx', code);
    console.log('Fixed JSX');
} else {
    console.log('Target not found');
}
