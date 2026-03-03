const fs = require('fs');

const BRAND_LOGO_JSX = `<Logo />`;

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = require('path').join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function ensureLogoImport(content) {
  if (!content.includes('import { Logo }')) {
    const importStatement = `import { Logo } from "@/components/Logo";\n`;
    if (content.startsWith('"use client";') || content.startsWith("'use client';")) {
      content = content.replace(/^(["']use client["'];?[\n\r]*)/, `$1${importStatement}`);
    } else {
      // find first import to insert after, or just at top
      content = `${importStatement}${content}`;
    }
  }
  return content;
}

let modifiedFiles = [];

// App Directory Replacements
walkDir('./app', function (filePath) {
  if (!filePath.endsWith('.tsx')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Pattern 1: Footer logo block
  const footerPattern = /<div className="w-[10-9]* h-[10-9]*[^\>]*?>\s*<div className=\{`relative[^\>]*`\}>\s*<Shield[^\>]*\/>\s*<Zap[^\>]*\/>\s*<\/div>\s*<\/div>/g;
  content = content.replace(footerPattern, '<Logo className="w-8 h-8 scale-75 origin-left" />'); // Shrink down if inside footer, or just use default

  // Pattern 2: CTA logo block
  const ctaPattern = /<div className="w-16 h-16 rounded-2xl bg-brand-500\/10 border border-brand-500\/20 flex items-center justify-center mx-auto mb-6">\s*<div className=\{`relative w-8 h-8 `\}>\s*<Shield[^\>]*\/>\s*<Zap[^\>]*\/>\s*<\/div>\s*<\/div>/g;
  content = content.replace(ctaPattern, '<Logo className="w-12 h-12 mb-6 mx-auto scale-150" />');

  // Any other naked Zap+Shield blocks (like some isolated ones)
  const nakedPattern = /<div className=\{`relative[^`]*`\}>\s*<Shield className="w-full h-full[^\>]*\/>\s*<Zap className=\{`absolute inset-0[^\>]*`\}[^\>]*\/>\s*<\/div>/g;
  content = content.replace(nakedPattern, '<Logo />');

  if (content !== original) {
    content = ensureLogoImport(content);
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFiles.push(filePath);
  }
});

// Components Replacements
walkDir('./components', function (filePath) {
  if (!filePath.endsWith('.tsx') || filePath.includes('Logo.tsx')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // In Navbar:
  const navPattern = /<div className="relative w-8 h-8 rounded-lg bg-brand-500\/10 border border-brand-500\/20 flex items-center justify-center group-hover:border-brand-500\/40 transition-colors">\s*<Shield className="w-4\.5 h-4\.5 text-brand-400" \/>\s*<Zap className="w-2 h-2 text-emerald-400 absolute" style=\{\{ fill: "currentColor" \}\} \/>\s*<\/div>/g;
  content = content.replace(navPattern, '<Logo className="group-hover:border-brand-500/40 transition-colors" />');

  // In GlobalChat:
  const chatPattern = /<div className=\{`relative w-7 h-7 `\}>\s*<Shield className="w-full h-full text-white" strokeWidth=\{1\.5\} \/>\s*<Zap className=\{`absolute inset-0 m-auto w-3\.5 h-3\.5 text-indigo-400`\} strokeWidth=\{2\} \/>\s*<\/div>/g;
  content = content.replace(chatPattern, '<Logo className="shadow-lg" />');

  if (content !== original) {
    content = ensureLogoImport(content);
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFiles.push(filePath);
  }
});

console.log("Updated files:", modifiedFiles);
