const fs = require('fs');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const uiNew = `                              <div className="w-full flex flex-wrap gap-2 mt-2">
                                {ALL_GENRES.map(g => (
                                  <label key={g} className={\`cursor-pointer px-2 py-1 rounded-md text-xs font-semibold border transition-all \${genres.includes(g) ? 'bg-[#a855f7]/20 border-[#a855f7] text-[#c084fc]' : 'bg-black/30 border-white/10 text-[#a7a7b1] hover:border-white/30'}\`}>
                                    <input type="checkbox" className="hidden" checked={genres.includes(g)} onChange={(e) => {
                                      if (e.target.checked) setGenres([...genres, g]);
                                      else setGenres(genres.filter(x => x !== g));
                                    }} />
                                    {g}
                                  </label>
                                ))}
                              </div>`;

content = content.replace(/<select value=\{genre\}[\s\S]*?<\/select>/, uiNew);

fs.writeFileSync('src/app/admin/page.tsx', content);
console.log('Replaced select block!');
