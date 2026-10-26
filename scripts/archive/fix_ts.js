const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Fix the Manhwa interface
if (!code.includes('status?: string;')) {
    code = code.replace(
        'score: number;\n', 
        'score: number;\n  status?: string;\n'
    );
}

// 2. Inject visibleCount state
if (!code.includes('const [visibleCount')) {
    code = code.replace(
        'const [activeCategory, setActiveCategory] = useState("");\n',
        'const [activeCategory, setActiveCategory] = useState("");\n  const [visibleCount, setVisibleCount] = useState<number>(18);\n'
    );
}

// 3. Fix the 'v => v + 18' by typing it '((v: number) => v + 18)'
code = code.replace(/v => v \+ 18/g, '(v: number) => v + 18');

fs.writeFileSync('src/app/page.tsx', code);
console.log('Fixed TypeScript errors');
