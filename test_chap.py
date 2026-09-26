import re

urls = [
    "https://lector-mangas.lat/comics/colorista/capitulo-1",
    "https://lector-mangas.lat/comics/colorista/capitulo-1-1",
    "https://lector-mangas.lat/comics/colorista/capitulo-1.5",
    "https://lector-mangas.lat/comics/colorista/chapter-2",
]

for url in urls:
    match = re.search(r'(capitulo|chapter)-?(\d+([.-]\d+)?)', url.lower())
    if match:
        raw_num = match.group(2).replace('-', '.')
        print(f"{url} -> {raw_num}")
