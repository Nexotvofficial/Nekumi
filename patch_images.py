with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "r") as f:
    content = f.read()

# Make the first 3 images load instantly with fetchPriority="high" and no lazy loading
content = content.replace('className="w-full h-auto block select-none pointer-events-none"', 'className="w-full h-auto block select-none pointer-events-none"\n                fetchPriority={index < 3 ? "high" : "auto"}\n                loading={index < 3 ? "eager" : "lazy"}')

# Remove duplicate loading="lazy" if it exists
import re
content = re.sub(r'loading="lazy"\s*className', 'className', content)

with open("src/app/manga/[id]/chapter/[chapterId]/page.tsx", "w") as f:
    f.write(content)
