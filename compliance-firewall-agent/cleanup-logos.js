const fs = require('fs');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = require('path').join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) walkDir(dirPath, callback);
        else callback(dirPath);
    });
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Footer Kaelus.ai
    content = content.replace(
        /<div className="w-7 h-7 rounded-lg bg-brand-500\/10 border border-brand-500\/20 flex items-center justify-center">\s*<Logo \/>\s*<\/div>\s*<span className="font-bold">Kaelus<span className="text-brand-400">\.ai<\/span><\/span>/g,
        `<Logo className="w-7 h-7" />\n                <span className="text-lg font-bold tracking-tight text-white">\n                    Kaelus<span className="text-brand-400">.ai</span>\n                </span>`
    );

    content = content.replace(
        /<div className="w-7 h-7 rounded-lg bg-brand-500\/15 flex items-center justify-center border border-brand-500\/20">\s*<Logo \/>\s*<\/div>\s*<span className="font-bold">Kaelus<span className="text-brand-400">\.ai<\/span><\/span>/g,
        `<Logo className="w-7 h-7" />\n                <span className="text-lg font-bold tracking-tight text-white">\n                    Kaelus<span className="text-brand-400">.ai</span>\n                </span>`
    );

    // CTAs
    content = content.replace(
        /<div className="w-16 h-16 rounded-2xl bg-brand-500\/10 border border-brand-500\/20 flex items-center justify-center mx-auto mb-6">\s*<Logo \/>\s*<\/div>/g,
        `<Logo className="mx-auto mb-6 w-16 h-16 scale-125" />`
    );

    // Dashboard Sidebar (if nested)
    content = content.replace(
        /<div className="w-8 h-8 rounded-lg bg-brand-500\/10 border border-brand-500\/20 flex items-center justify-center flex-shrink-0">\s*<Logo \/>\s*<\/div>\s*<span className="font-bold text-white tracking-tight">Kaelus<span className="text-brand-400">\.ai<\/span><\/span>/g,
        `<Logo />\n                    <span className="font-bold tracking-tight text-white text-lg">Kaelus<span className="text-brand-400">.ai</span></span>`
    );

    // Fallback for Auth or ANY remaining nested div inside CTA
    content = content.replace(
        /<div className="w-16 h-16 rounded-2xl bg-brand-500\/10 border border-brand-500\/20 flex items-center justify-center mx-auto mb-6">\s*<Logo className="w-12 h-12 mb-6 mx-auto scale-150" \/>\s*<\/div>/g,
        `<Logo className="mx-auto mb-6 w-16 h-16 scale-125" />`
    );

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Cleaned:", filePath);
    }
}

walkDir('./app', f => f.endsWith('.tsx') && processFile(f));
