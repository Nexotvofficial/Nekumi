import os

# Patch manga/[id]/page.tsx
with open("src/app/manga/[id]/page.tsx", "r") as f:
    content = f.read()

# Remove the old if (loading) return ...
import re
content = re.sub(r'if \(loading\) \{[\s\S]*?return \([\s\S]*?<Loader2.*?/>[\s\S]*?\);\n\s*\}', 'if (loading) return <NekuLoading fullScreen={true} />;', content)
with open("src/app/manga/[id]/page.tsx", "w") as f:
    f.write(content)

# Patch chapter/[chapterId]/page.tsx
with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "r") as f:
    content = f.read()

if "import NekuLoading" not in content:
    content = "import NekuLoading from '@/components/NekuLoading';\n" + content

content = re.sub(r'if \(loading\) \{[\s\S]*?return \([\s\S]*?<Loader2.*?/>[\s\S]*?\);\n\s*\}', 'if (loading) return <NekuLoading fullScreen={true} />;', content)
with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "w") as f:
    f.write(content)
