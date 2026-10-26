const fs = require('fs');

let adminContent = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const badSelectRegex = /<div className="space-y-1">\s*<label className="text-xs font-semibold text-\[#a7a7b1\] uppercase tracking-wider">Estado<\/label>\s*<select value=\{status\} onChange=\{e => setStatus\(e\.target\.value\)\}[\s\S]*?<\/select>\s*<\/div>/;

const newStatusField = `<div className="space-y-1">\n  <label className="text-xs font-semibold text-[#a7a7b1] uppercase tracking-wider">Estado de Emisión</label>\n  <div className="w-full flex gap-2 mt-2">\n    {['En emisión', 'Finalizado', 'Pausado'].map(s => (\n      <label key={s} className={\`cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold border transition-all \${status === s ? 'bg-[#a855f7]/20 border-[#a855f7] text-[#c084fc]' : 'bg-black/30 border-white/10 text-[#a7a7b1] hover:border-white/30'}\`}>\n        <input type="radio" className="hidden" checked={status === s} onChange={() => setStatus(s)} />\n        {s}\n      </label>\n    ))}\n  </div>\n</div>`;

adminContent = adminContent.replace(badSelectRegex, newStatusField);

fs.writeFileSync('src/app/admin/page.tsx', adminContent);
console.log('Fixed admin status dropdown!');
