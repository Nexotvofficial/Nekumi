const fs = require('fs');

let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');

if (!layout.includes('AntiAdblock')) {
    layout = layout.replace(
        'import { AdsterraPopunder } from "@/components/Adsterra";',
        'import { AdsterraPopunder } from "@/components/Adsterra";\nimport AntiAdblock from "@/components/AntiAdblock";'
    );
    
    layout = layout.replace(
        '<SecurityShield />',
        '<SecurityShield />\n          <AntiAdblock />'
    );
    
    fs.writeFileSync('src/app/layout.tsx', layout);
    console.log('Layout patched with AntiAdblock');
} else {
    console.log('AntiAdblock already injected');
}
