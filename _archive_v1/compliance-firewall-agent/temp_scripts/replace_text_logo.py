import os
import re

def fix_standalone_logo(dir_path):
    updated_files = 0
    # Match <span ...>Kaelus<span...>.ai</span></span> or just Kaelus<span...>.ai</span>
    search_pattern1 = r'<span[^>]*>\s*Kaelus\s*<span[^>]*>\.ai</span>\s*</span>'
    search_pattern2 = r'Kaelus\s*<span[^>]*>\.ai</span>'
    
    for root, _, files in os.walk(dir_path):
        for f in files:
            if not f.endswith('.tsx'): continue
            # Exclude TextLogo.tsx and Navbar.tsx since we already did those manually
            if f in ['TextLogo.tsx', 'Navbar.tsx']: continue
            
            path = os.path.join(root, f)
            with open(path, 'r') as file:
                content = file.read()
            
            original_content = content
            
            if re.search(search_pattern1, content):
                content = re.sub(search_pattern1, '<TextLogo />', content)
                
            if re.search(search_pattern2, content):
                content = re.sub(search_pattern2, '<TextLogo />', content)
                
            if content != original_content:
                if 'TextLogo' not in content:
                    # Match any import and add TextLogo right after
                    content = re.sub(r'(import [^;]+;)', r'\1\nimport { TextLogo } from "@/components/TextLogo";', content, count=1)
                    
                    if 'import { TextLogo }' not in content:
                        content = 'import { TextLogo } from "@/components/TextLogo";\n' + content
                
                with open(path, 'w') as file:
                    file.write(content)
                print(f"Updated {path}")
                updated_files += 1
                
    print(f"Updated {updated_files} files.")

fix_standalone_logo('/Users/yantr/Desktop/Kaelus.ai-main/compliance-firewall-agent/app')
