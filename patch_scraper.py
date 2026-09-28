import re

with open("direct_scraper_backup.py", "r") as f:
    content = f.read()

# Import the Hydra Engine
if "from hidra_engine import buscar_manga_hidra, purificar_imagenes" not in content:
    content = content.replace("from supabase import create_client", "from supabase import create_client\nfrom hidra_engine import buscar_manga_hidra, purificar_imagenes")

# Add Hydra Fallback logic at the beginning of scrape_manhwa
old_start = """    print(f"\\n🔗 Accediendo a: {url}")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64 AppleWebKit/537.36)'}
    
    try:
        res = requests.get(url, headers=headers, timeout=15)
        res.raise_for_status()
    except Exception as e:
        print(f"❌ Error al conectar: {e}")
        return False"""

new_start = """    print(f"\\n🔗 Accediendo a: {url}")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64 AppleWebKit/537.36)'}
    
    try:
        res = requests.get(url, headers=headers, timeout=15)
        if res.status_code == 404 or 'No Encontrado' in res.text:
            raise Exception("Página 404 - No Encontrado")
        res.raise_for_status()
    except Exception as e:
        print(f"⚠️ Alerta: Error al conectar con {url} ({e})")
        print("🐉 Invocando Protocolo HIDRA (Multi-Fuente)...")
        slug = url.rstrip('/').split('/')[-1]
        nueva_url = buscar_manga_hidra(slug)
        if nueva_url:
            print(f"🐉 Hidra redirigiendo el scraping a: {nueva_url}")
            url = nueva_url
            res = requests.get(url, headers=headers, timeout=15)
        else:
            print(f"❌ Hidra falló. No se pudo conectar.")
            return False"""

content = content.replace(old_start, new_start)

# Replace image extraction with pure heuristics
old_images = """        # Buscar contenedor de lectura si existe, sino todo el body
        reading_area = chap_soup.find(class_=re.compile(r'reading-content|entry-content|chapter-content|vung-doc', re.I)) or chap_soup
        images = reading_area.find_all('img')
        
        pages_payload = []
        for i, img in enumerate(images):
            src = img.get('data-src') or img.get('src')
            if not src or 'avatar' in src.lower() or 'logo' in src.lower():
                continue
                
            src = src.strip()
            pages_payload.append({
                "chapter_id": chapter_id,
                "page_number": i + 1,
                "image_url": src
            })"""

new_images = """        # 🐉 Invocando heurística inmortal de la Hidra
        lista_imagenes = purificar_imagenes(chap_soup)
        
        pages_payload = []
        for i, src in enumerate(lista_imagenes):
            pages_payload.append({
                "chapter_id": chapter_id,
                "page_number": i + 1,
                "image_url": src
            })"""

content = content.replace(old_images, new_images)

with open("direct_scraper_backup.py", "w") as f:
    f.write(content)

print("Scraper patched with Hydra Engine!")
