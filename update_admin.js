const fs = require('fs');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const ALL_GENRES = `const ALL_GENRES = ['Acción', 'Romance', 'Fantasía', 'Comedia', 'Drama', 'Aventura', 'Misterio', 'Terror', 'Suspenso', 'Ciencia Ficción', 'Harem', 'Isekai', 'Reencarnación', 'Cultivación', '+18', 'Escolar', 'Recuentos de la vida', 'Sobrenatural', 'Deportes', 'Psicológico', 'Sistema'];\n\nexport default function AdminProDashboard`;
content = content.replace('export default function AdminProDashboard', ALL_GENRES);

content = content.replace('const [genre, setGenre] = useState("Acción");', 'const [genres, setGenres] = useState<string[]>(["Acción"]);');

content = content.replace('const payload = { title, description, genre, cover_url: coverUrl, banner_url: bannerUrl, is_hero: isHero };', 'const payload = { title, description, genre: genres.join(", "), cover_url: coverUrl, banner_url: bannerUrl, is_hero: isHero };');

content = content.replace('setGenre(m.genre?.[0] || "Acción");', 'setGenres(m.genre ? m.genre.split(", ") : ["Acción"]);');

content = content.replace('<td className="py-3 text-[#a7a7b1]">{m.genre?.[0] || \'-\'}</td>', '<td className="py-3 text-[#a7a7b1]">{m.genre || \'-\'}</td>');

const UI_OLD = `<select value={genre} onChange={e => setGenre(e.target.value)} className="w-full h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white focus:border-[#a855f7] outline-none transition-colors">
                                <option value="Acción" className="bg-[#121216]">Acción</option>
                                <option value="Romance" className="bg-[#121216]">Romance</option>
                                <option value="Fantasía" className="bg-[#121216]">Fantasía</option>
                                <option value="Comedia" className="bg-[#121216]">Comedia</option>
                                <option value="Drama" className="bg-[#121216]">Drama</option>
                                <option value="Aventura" className="bg-[#121216]">Aventura</option>
                                <option value="Reencarnación" className="bg-[#121216]">Reencarnación</option>
                                <option value="Sistema" className="bg-[#121216]">Sistema</option>
                                <option value="Sobrenatural" className="bg-[#121216]">Sobrenatural</option>
                                <option value="Escolar" className="bg-[#121216]">Escolar</option>
                                <option value="+18" className="bg-[#121216]">+18</option>
                              </select>`;
const UI_NEW = `<div className="w-full flex flex-wrap gap-2 mt-2">
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
                              
content = content.replace(UI_OLD, UI_NEW);
fs.writeFileSync('src/app/admin/page.tsx', content);
console.log('Done replacement in admin');
