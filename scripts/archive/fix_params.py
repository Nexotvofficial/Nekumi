with open("src/app/manga/[id]/page.tsx", "r") as f:
    content = f.read()

# Fix generateMetadata signature and body
content = content.replace(
    "export async function generateMetadata({ params }: { params: { id: string } }) {",
    "export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {\n  const { id } = await params;"
)
content = content.replace('.eq("id", params.id)', '.eq("id", id)')

# Fix component signature
content = content.replace(
    "export default function MangaDetailServer({ params }: { params: { id: string } }) {",
    "export default async function MangaDetailServer({ params }: { params: Promise<{ id: string }> }) {\n  const { id } = await params;"
)

with open("src/app/manga/[id]/page.tsx", "w") as f:
    f.write(content)

print("Fixed params promise TS error!")
