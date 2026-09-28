import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin

# Diccionario de dominios alternativos compatibles con el scraper actual (CMS Madara o similar)
# Si una página cae, la Hidra buscará el manga en estos espejos automáticamente.
FUENTES_HIDRA = [
    "https://vermanhwa.com/manga/",
    "https://lector-mangas.lat/manga/",
    "https://yugenmangas.net/manga/",
    "https://olympusv2.gg/manga/",
    "https://asurascans.com/manga/"
]

def buscar_manga_hidra(slug_o_nombre):
    """
    Intenta encontrar un enlace válido del manga en múltiples páginas.
    Devuelve la primera URL que responda con código 200 y contenga capítulos.
    """
    print(f"🐉 [HIDRA] Iniciando búsqueda multi-fuente para: '{slug_o_nombre}'")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    # Normalizar slug
    slug = re.sub(r'[^a-zA-Z0-9-]', '-', slug_o_nombre.lower().replace(' ', '-'))
    slug = re.sub(r'-+', '-', slug)
    
    for base in FUENTES_HIDRA:
        url = base + slug + "/"
        print(f"  👀 Probando: {url}")
        try:
            res = requests.get(url, headers=headers, timeout=5, allow_redirects=True)
            # Evitar falsos positivos si la página redirige al inicio
            if res.status_code == 200 and len(res.url) > len(base) - 5 and "manga" in res.url:
                if 'capítulo' in res.text.lower() or 'chapter' in res.text.lower() or 'ajax/chapters' in res.text.lower():
                    print(f"  ✅ ¡Éxito! Encontrado en: {res.url}")
                    return res.url
        except:
            pass
            
    print(f"  ❌ La Hidra no pudo encontrar '{slug}' en las fuentes registradas.")
    return None

def purificar_imagenes(soup):
    """
    Heurística "inmortal" para extraer imágenes de un capítulo.
    No depende de nombres de clases HTML que cambian.
    Busca bloques contiguos de imágenes pesadas.
    """
    imagenes = []
    
    # 1. Recopilar todos los img tags
    todos_img = soup.find_all('img')
    
    for img in todos_img:
        # Extraer la URL real (lazy load soportes variados)
        src = img.get('data-src') or img.get('data-lazy-src') or img.get('data-srcset') or img.get('src')
        if not src: continue
        
        if type(src) == list: src = src[0]
        src = str(src).strip()
        
        # 2. Ignorar basura (íconos, avatares, banners, webp muy pequeños)
        if any(x in src.lower() for x in ['avatar', 'logo', 'banner', 'icon', 'ads', 'gif', 'discord']):
            continue
            
        # 3. Filtrar por patrón típico de manhwa (ej. 01.jpg, chapter/1/01.webp)
        if re.search(r'\d{1,4}\.(jpg|jpeg|png|webp)', src.lower()) or 'manga' in src.lower() or 'uploads' in src.lower():
            if src not in imagenes:
                imagenes.append(src)
                
    # 4. Si falló la heurística, buscar en scripts (algunos cargan las imgs en arrays de JS)
    if len(imagenes) < 2:
        for script in soup.find_all('script'):
            if script.string:
                urls_ocultas = re.findall(r'(https?://[^"\']+(?:jpg|png|webp))', script.string)
                for u in urls_ocultas:
                    if u not in imagenes and not 'logo' in u:
                        imagenes.append(u)
                        
    return imagenes
