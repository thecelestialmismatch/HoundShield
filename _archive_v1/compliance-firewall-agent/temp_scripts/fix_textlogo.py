import os, glob

for p in glob.glob("app/**/*.tsx", recursive=True):
    with open(p, "r") as f:
        c = f.read()
    if "<TextLogo" in c and "import { TextLogo }" not in c:
        if 'import { Logo }' in c:
            c = c.replace('import { Logo } from "@/components/Logo";', 'import { Logo } from "@/components/Logo";\nimport { TextLogo } from "@/components/TextLogo";')
            c = c.replace('import { Logo } from "../../components/Logo";', 'import { Logo } from "../../components/Logo";\nimport { TextLogo } from "@/components/TextLogo";')
        else:
            lines = c.split('\n')
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    lines.insert(i, 'import { TextLogo } from "@/components/TextLogo";')
                    break
            c = '\n'.join(lines)
        with open(p, "w") as f:
            f.write(c)
