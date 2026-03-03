const fs = require('fs');

const NEW_LOGO = `<Logo />`;

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = require('path').join(dir, f);
    if(fs.statSync(dirPath).isDirectory()) walkDir(dirPath, callback);
    else callback(dirPath);
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  let changed = false;
  let newLines = [];
  let inOldLogo = false;
  
  for (let i = 0; i < lines.length; i++) {
    // CTA: w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20
    if (lines[i].includes('border border-brand-500/20') && lines[i].includes('w-16 h-16')) {
        if (lines[i+1] && lines[i+1].includes('<div className={`relative')) {
            // Found CTA!
            newLines.push(lines[i]);
            newLines.push('                  <Logo className="w-12 h-12" />');
            i += 4; // skip 4 lines
            changed = true;
            continue;
        }
    }
    
    // Auth page: w-16 h-16 rounded-2xl
    if (lines[i].includes('w-16 h-16 rounded-2xl') && lines[i+1] && lines[i+1].includes('<div className={`relative w-8 h-8 ')) {
         newLines.push(lines[i]);
         newLines.push('              <Logo className="mx-auto" />');
         i += 4; // skip
         changed = true;
         continue;
    }

    // Footer: w-7 h-7 rounded-lg bg-brand-500/15
    if (lines[i].includes('w-7 h-7 rounded-lg bg-brand-500/15')) {
        if (lines[i+1] && lines[i+1].includes('<div className={`relative')) {
            // Found Footer!
            newLines.push('                <Logo />');
            i += 5; // skip 4 lines + the closing div lines[i+5]
            changed = true;
            continue;
        }
    }
    
    // Dashboard sidebar logo: <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20
    if (lines[i].includes('w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20')) {
        if (lines[i+1] && lines[i+1].includes('<div className={`relative w-8 h-8 `}>')) {
            newLines.push('            <Logo />');
            i += 5;
            changed = true;
            continue;
        }
    }

    // Any <Shield ... className="w-full h-full...
    if (lines[i].includes('<Shield className="w-full h-full text-white"') || lines[i].includes('text-brand-400" strokeWidth={1.5}')) {
        if (lines[i-1] && lines[i-1].includes('relative w-') && lines[i+1] && lines[i+1].includes('<Zap')) {
            // Strip out
            newLines.pop(); // pop the relative w- div
            newLines.push('                        <Logo />');
            i += 2;
            changed = true;
            continue;
        }
    }

    newLines.push(lines[i]);
  }
  
  if (changed) {
    let finalStr = newLines.join('\n');
    // Ensure import
    if (!finalStr.includes('import { Logo }')) {
        const importStmt = `import { Logo } from "@/components/Logo";\n`;
        if (finalStr.startsWith('"use client";') || finalStr.startsWith("'use client';")) {
             finalStr = finalStr.replace(/^(["']use client["'];?[\n\r]*)/, `$1${importStmt}`);
        } else {
             const parts = finalStr.split('\n');
             let importIndex = 0;
             for (let j=0; j<parts.length; j++) {
                 if (parts[j].includes('import ')) importIndex = Math.max(importIndex, j);
             }
             parts.splice(importIndex+1, 0, importStmt.trim());
             finalStr = parts.join('\n');
        }
    }
    fs.writeFileSync(filePath, finalStr, 'utf8');
    console.log("Updated:", filePath);
  }
}

walkDir('./app', f => f.endsWith('.tsx') && processFile(f));
walkDir('./components', f => f.endsWith('.tsx') && !f.includes('Logo.tsx') && processFile(f));
