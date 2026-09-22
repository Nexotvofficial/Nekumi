const fs = require('fs');

let adminContent = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// The block starts with `<div className="grid grid-cols-2 gap-4">` right before the `Género` block.
// Let's replace the grid div with a regular space-y-6 div, and also remove the nested `space-y-1` divs around the inputs, or keep them but they will stack vertically.
// Since we want full width and vertical stacking for Genres and Status:

const oldBlockRegex = /<div className="grid grid-cols-2 gap-4">\s*<div className="space-y-1">\s*<label className="text-xs font-semibold text-\[#a7a7b1\] uppercase tracking-wider">Género<\/label>/;

const newBlock = `<div className="flex flex-col gap-6">\n  <div className="space-y-2">\n    <label className="text-xs font-semibold text-[#a7a7b1] uppercase tracking-wider">Género</label>`;

if (adminContent.match(oldBlockRegex)) {
    adminContent = adminContent.replace(oldBlockRegex, newBlock);
} else {
    console.log("Could not find the target block");
}

fs.writeFileSync('src/app/admin/page.tsx', adminContent);
console.log('Fixed admin form layout!');
