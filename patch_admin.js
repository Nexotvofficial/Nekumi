const fs = require('fs');

let adminContent = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// 1. Update the payload to include status
const payloadTarget = 'const payload = { title, description, genre: genres.join(", "), cover_url: coverUrl, banner_url: bannerUrl, is_hero: isHero };';
const payloadReplacement = 'const payload = { title, description, genre: genres.join(", "), cover_url: coverUrl, banner_url: bannerUrl, is_hero: isHero, status };';

if (adminContent.includes(payloadTarget)) {
    adminContent = adminContent.replace(payloadTarget, payloadReplacement);
}

// 2. Add Status Field to UI
// Right now status is set to "Publicado", we should change the UI to a dropdown for "En emisión", "Finalizado", "Pausado"
const statusFieldRegex = /<label className="text-xs font-semibold text-\[#a7a7b1\] uppercase tracking-wider">Estado<\/label>\s*<div className="flex gap-4 mt-2">[\s\S]*?<\/div>\s*<\/div>/;

const newStatusField = `<label className="text-xs font-semibold text-[#a7a7b1] uppercase tracking-wider">Estado de Emisión</label>
                            <div className="w-full flex gap-2 mt-2">
                              {['En emisión', 'Finalizado', 'Pausado'].map(s => (
                                <label key={s} className={\`cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold border transition-all \${status === s ? 'bg-[#a855f7]/20 border-[#a855f7] text-[#c084fc]' : 'bg-black/30 border-white/10 text-[#a7a7b1] hover:border-white/30'}\`}>
                                  <input type="radio" className="hidden" checked={status === s} onChange={() => setStatus(s)} />
                                  {s}
                                </label>
                              ))}
                            </div>`;

// Wait, does the admin page actually have a status UI field yet? Let's check if it has "Publicado".
if (adminContent.includes('>Estado<')) {
    adminContent = adminContent.replace(statusFieldRegex, newStatusField);
} else {
    // Inject it after Genres
    const genreBlockRegex = /<div className="w-full flex flex-wrap gap-2 mt-2">[\s\S]*?<\/div>\s*<\/div>/;
    const match = genreBlockRegex.exec(adminContent);
    if (match) {
        const injected = match[0] + '\n\n                          <div className="space-y-1">\n' + newStatusField + '\n                          </div>';
        adminContent = adminContent.replace(match[0], injected);
    }
}

// 3. Change the state default to "En emisión" instead of "Publicado"
adminContent = adminContent.replace('useState("Publicado");', 'useState("En emisión");');
adminContent = adminContent.replace('setStatus(m.status || "Publicado");', 'setStatus(m.status || "En emisión");');

// Fix Table display for status
adminContent = adminContent.replace(/<span className="inline-block px-2\.5 py-1 rounded-full text-xs font-semibold bg-\[#10b981\]\/20 text-\[#34d399\]">\{m\.status \|\| 'Publicado'\}<\/span>/g, 
  `<span className={\`inline-block px-2.5 py-1 rounded-full text-xs font-semibold \${m.status === 'Finalizado' ? 'bg-[#10b981]/20 text-[#34d399]' : 'bg-[#3b82f6]/20 text-[#60a5fa]'}\`}>{m.status || 'En emisión'}</span>`);


fs.writeFileSync('src/app/admin/page.tsx', adminContent);
console.log('admin patched successfully');
