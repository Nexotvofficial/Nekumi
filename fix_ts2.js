const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Fix the Manhwa interface
if (!code.includes('status?: string;')) {
    code = code.replace(
        /score:\s*number;/, 
        'score: number;\n  status?: string;'
    );
}

// 2. Inject visibleCount state
if (!code.includes('const [visibleCount')) {
    code = code.replace(
        /const\s+\[activeCategory,\s*setActiveCategory\]\s*=\s*useState\([^)]*\);/,
        'const [activeCategory, setActiveCategory] = useState("");\n  const [visibleCount, setVisibleCount] = useState<number>(18);'
    );
}

fs.writeFileSync('src/app/page.tsx', code);
console.log('Fixed TypeScript errors properly');
