import os
import re

def fix_logo(dir_path):
    updated_files = 0
    search_pattern = r'<Logo[^>]*/>\s*<span[^>]*>(?:<span[^>]*>)?Kaelus<span[^>]*>\.ai</span>(?:</span>)?</span>'
    
    for root, _, files in os.walk(dir_path):
        for f in files:
            if not f.endswith('.tsx'): continue
            path = os.path.join(root, f)
            with open(path, 'r') as file:
                content = file.read()
            
            if re.search(search_pattern, content):
                new_content = re.sub(search_pattern, '<TextLogo />', content)
                
                if 'TextLogo' not in new_content:
                    new_content = re.sub(r'(import\s+\{[^}]*Logo[^}]*\}\s+from\s+[\'"]@/components/Logo[\'"];?)', r'\1\nimport { TextLogo } from "@/components/TextLogo";', new_content)
                    
                    if 'import { TextLogo }' not in new_content:
                        new_content = 'import { TextLogo } from "@/components/TextLogo";\n' + new_content
                
                # Cleanup unused Logo imports if Logo is no longer used
                if '<Logo' not in new_content:
                    new_content = re.sub(r'import\s+\{[^}]*Logo[^}]*\}\s+from\s+[\'"]@/components/Logo[\'"];?\n?', '', new_content)
                    # Handle cases where Logo was exported with something else (unlikely but possible)
                    new_content = new_content.replace('import { Logo, TextLogo }', 'import { TextLogo }')
                    
                with open(path, 'w') as file:
                    file.write(new_content)
                print(f"Updated {path}")
                updated_files += 1
                
    print(f"Updated {updated_files} files.")

fix_logo('/Users/yantr/Desktop/Kaelus.ai-main/compliance-firewall-agent/app')
