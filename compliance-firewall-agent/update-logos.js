const fs = require('fs');
const glob = require('glob'); // use standard fs traversing if glob not installed

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = require('path').join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const BRAND_LOGO_JSX = (wClass, hClass, zapWClass, zapHClass, extraOuterClass = "") => 
`<div className={\`relative ${wClass} ${hClass} ${extraOuterClass}\`}>
  <Shield className="w-full h-full text-brand-400" strokeWidth={1.5} />
  <Zap className={\`absolute inset-0 m-auto ${zapWClass} ${zapHClass} text-white\`} strokeWidth={2} />
</div>`;

walkDir('./app', function(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Generic w-8 h-8 text-brand-400
  content = content.replace(/<Shield className="w-8 h-8 text-(?:brand|blue)-[0-0]+"\s*\/>/g, BRAND_LOGO_JSX('w-8', 'h-8', 'w-4', 'h-4'));
  content = content.replace(/<Shield className="w-8 h-8 text-brand-400"\s*\/>/g, BRAND_LOGO_JSX('w-8', 'h-8', 'w-4', 'h-4'));
  content = content.replace(/<Shield className="w-8 h-8 text-brand-200"\s*\/>/g, BRAND_LOGO_JSX('w-8', 'h-8', 'w-4', 'h-4'));

  // Footers: w-3.5 or w-4 h-4 
  content = content.replace(/<Shield className="w-4 h-4 text-brand-400"\s*\/>/g, BRAND_LOGO_JSX('w-4', 'h-4', 'w-2', 'h-2'));
  content = content.replace(/<Shield className="w-3.5 h-3.5 text-brand-400"\s*\/>/g, BRAND_LOGO_JSX('w-3.5', 'h-3.5', 'w-[10px]', 'h-[10px]'));
  
  // CTAs: w-12 h-12 text-brand-400 mx-auto mb-6
  content = content.replace(/<Shield className="w-12 h-12 text-brand-400 mx-auto mb-6"\s*\/>/g, BRAND_LOGO_JSX('w-12', 'h-12', 'w-6', 'h-6', 'mx-auto mb-6'));

  // Ensure imports
  if (content !== original) {
    if (content.includes('<Zap') && !content.includes(', Zap') && !content.includes('Zap,')) {
      content = content.replace(/import\s*{([^}]*)Shield([^}]*)}\s*from\s+['"]lucide-react['"];?/, `import {$1Shield, Zap$2} from 'lucide-react';`);
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Updated", filePath);
  }
});
