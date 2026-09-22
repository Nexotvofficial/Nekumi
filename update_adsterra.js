const fs = require('fs');

// 1. Update Adsterra.tsx
let adsContent = fs.readFileSync('src/components/Adsterra.tsx', 'utf8');
const popunderCode = `
export function AdsterraPopunder() {
  useEffect(() => {
    const scriptId = 'adsterra-popunder-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src = '//pl31363079.profitableratecpmnetwork.com/54/29/bd/5429bd345e3c7e7bc304287e0656aaa3.js';
      document.body.appendChild(script);
    }
  }, []);
  return null;
}
`;
if (!adsContent.includes('AdsterraPopunder')) {
  fs.writeFileSync('src/components/Adsterra.tsx', adsContent + popunderCode);
}

// 2. Update layout.tsx
let layoutContent = fs.readFileSync('src/app/layout.tsx', 'utf8');
if (!layoutContent.includes('AdsterraPopunder')) {
  if (!layoutContent.includes('AdsterraPopunder } from')) {
    layoutContent = layoutContent.replace(
      'import Script from "next/script";',
      'import Script from "next/script";\nimport { AdsterraPopunder } from "@/components/Adsterra";'
    );
  }
  
  layoutContent = layoutContent.replace(
    '<div id="root-app">',
    '<div id="root-app">\n          <AdsterraPopunder />'
  );
  
  fs.writeFileSync('src/app/layout.tsx', layoutContent);
}

// 3. Remove conditional popunder from page.tsx
let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');
pageContent = pageContent.replace(/{\/\* Adsterra Popunder.*?{[\s\S]*?<\/Script>\n\s*\)}/, '{/* Popunder movido a global */}');
fs.writeFileSync('src/app/page.tsx', pageContent);

console.log('Adsterra popunder deployed globally!');
