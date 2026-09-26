import os
import sys
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
import re

# --- 1. CARGAR CONFIGURACIÓN SUPABASE ---
env_path = Path('.env.local')
if env_path.exists():
    load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ Configura tu .env.local con las credenciales de Supabase.")
    sys.exit(1)

SUPABASE_URL = SUPABASE_URL.replace("/rest/v1/", "").replace("/rest/v1", "").rstrip("/")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- 2. SCRAPER GENÉRICO ---
def upload_image_to_storage(image_url, storage_path, bucket_name="mangas"):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    try:
        res = requests.get(image_url, headers=headers, timeout=10)
        if res.status_code == 200:
            content_type = res.headers.get('content-type', 'image/jpeg')
            # x-upsert permite sobreescribir si ya existe
            supabase.storage.from_(bucket_name).upload(
                path=storage_path,
                file=res.content,
                file_options={"content-type": content_type, "x-upsert": "true"}
            )
            return f"{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{storage_path}"
    except Exception as e:
        pass
    return image_url # Fallback a la url original si falla

def scrape_manhwa(url):
    print(f"🌍 Analizando: {url}")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    # 1. Obtener datos del Manhwa
    res = requests.get(url, headers=headers)
    res.encoding = 'utf-8'  # <--- Fix para tildes y eñes
    soup = BeautifulSoup(res.text, 'html.parser')
    
    # Intentar obtener el título (adaptable según la web)
    title_tag = soup.find('h1')
    manga_title = title_tag.text.strip() if title_tag else "Manga Desconocido"
    # Limpiar el título por si la web incluye "Capítulo X" en el H1
    manga_title = re.sub(r'(?i)\s*(cap[ií]tulo|chapter)\s*\d+([.-]\d+)?.*$', '', manga_title).strip()
    
    # Extraer un slug confiable desde la URL
    slug = url.rstrip('/').split('/')[-1]
    
    # Cover image (busca el og:image)
    cover_meta = soup.find('meta', property='og:image')
    cover_url = cover_meta['content'] if cover_meta else ""
    
    # Extraer Sinopsis real (Soporte mejorado para Madara/TMO)
    synopsis = "Sinopsis no disponible."
    specific = soup.find(class_=re.compile(r'summary__content|description-summary|manga-excerpt', re.IGNORECASE))
    if specific:
        synopsis = specific.text.strip()
    else:
        for el in soup.find_all(['div', 'p'], class_=re.compile(r'summary|desc|excerpt|sinopsis|sino', re.IGNORECASE)):
            text = el.text.strip()
            if len(text) > 40 and 'traducciones' not in text.lower():
                synopsis = text
                break
                
    if synopsis == "Sinopsis no disponible." or len(synopsis) < 10:
        meta = soup.find('meta', property='og:description')
        if meta:
            synopsis = meta['content'].strip()
            
    # Limpiar basura de la sinopsis (URLs, Markdown links)
    synopsis = re.sub(r'\[.*?\]\(https?://.*?\)', '', synopsis)
    synopsis = re.sub(r'\(https?://.*?\)', '', synopsis)
    synopsis = re.sub(r'https?://\S+', '', synopsis).strip()
            
    # Extraer Géneros reales
    genres = []
    for a in soup.find_all('a', href=True):
        href = a['href'].lower()
        if 'genero' in href or 'genre' in href or 'category' in href:
            g = a.text.strip()
            if g and g not in genres:
                genres.append(g)
    genre_text = ", ".join(genres[:4]) if genres else "Acción"
    
    print(f"📖 Título: {manga_title}")
    print(f"🏷️ Géneros: {genre_text}")
    print(f"📝 Sinopsis: {synopsis[:60]}...")
    
    # 2. Insertar en Supabase (Manhwa)
    existing = supabase.table("manhwas").select("id").eq("title", manga_title).execute()
    if existing.data:
        manhwa_id = existing.data[0]['id']
        print(f"✅ El Manhwa ya existe (ID: {manhwa_id})")
        # No actualizamos la info para hacerlo más rápido
    else:
        # Subir portada a Supabase Storage
        print("  📥 Descargando y subiendo portada...")
        file_ext = cover_url.split('.')[-1].split('?')[0] if cover_url else "jpg"
        if len(file_ext) > 4: file_ext = "jpg"
        cover_storage_path = f"{slug}/cover.{file_ext}"
        final_cover_url = upload_image_to_storage(cover_url, cover_storage_path) if cover_url else ""
        
        payload = {
            "title": manga_title,
            "description": synopsis,
            "cover_url": final_cover_url,
            "banner_url": final_cover_url,
            "genre": genre_text,
            "is_hero": False,
            "score": 5.0
        }
        res_insert = supabase.table("manhwas").insert(payload).execute()
        manhwa_id = res_insert.data[0]['id']
        print(f"✅ Manhwa creado (ID: {manhwa_id})")
        
    # 3. Obtener capítulos
    from urllib.parse import urljoin
    links = soup.find_all('a', href=True)
    
    # ⚡ SOPORTE AJAX: Muchas webs (Madara/WordPress) cargan la lista de capítulos por AJAX
    ajax_url = f"{url.rstrip('/')}/ajax/chapters/"
    try:
        ajax_res = requests.post(ajax_url, headers=headers, timeout=10)
        if ajax_res.status_code == 200 and len(ajax_res.text) > 200:
            ajax_soup = BeautifulSoup(ajax_res.text, 'html.parser')
            ajax_links = ajax_soup.find_all('a', href=True)
            if len(ajax_links) > 0:
                print(f"  ⚡ Lista completa de capítulos detectada por AJAX ({len(ajax_links)} enlaces).")
                links.extend(ajax_links)
    except Exception:
        pass
    
    # Usamos un dict para evitar duplicados y guardar el número real extraído
    chapters_extracted = {}
    
    for link in links:
        href = link['href']
        if 'capitulo' in href.lower() or 'chapter' in href.lower():
            full_url = urljoin(url, href)
            
            if full_url not in chapters_extracted:
                # Extraer el número (soporta decimales ej. capitulo-1-1 o capitulo-1.5)
                match = re.search(r'(capitulo|chapter)[-a-zA-Z]*[-/]?(\d+([.-]\d+)?)', href.lower())
                if match:
                    chap_num_str = match.group(2).replace('-', '.')
                    try:
                        chap_number = float(chap_num_str)
                        if chap_number.is_integer():
                            chap_number = int(chap_number)
                        chapters_extracted[full_url] = chap_number
                    except ValueError:
                        continue
                        
    # Ordenar los capítulos por su número extraído (1, 1.1, 2, 3...)
    chapter_list = sorted(chapters_extracted.items(), key=lambda x: x[1])
    
    print(f"📚 Se encontraron {len(chapter_list)} posibles capítulos.")
    
    # OPTIMIZACIÓN: Obtener de golpe todos los capítulos que ya existen
    existing_chaps_res = supabase.table("chapters").select("chapter_number").eq("manhwa_id", manhwa_id).execute()
    existing_chap_numbers = set([c['chapter_number'] for c in existing_chaps_res.data]) if existing_chaps_res.data else set()
    
    for chap_url, chap_number in chapter_list:
        if chap_number in existing_chap_numbers:
            print(f"    ⏭️ El Capítulo {chap_number} ya existe. Omitiendo.")
            continue
            
        print(f"  ⏳ Procesando Capítulo {chap_number}...")
        
        chap_res = requests.get(chap_url, headers=headers)
        chap_res.encoding = 'utf-8'
        chap_soup = BeautifulSoup(chap_res.text, 'html.parser')
        
        # Insertar Capítulo en BD
        chap_payload = {
            "manhwa_id": manhwa_id,
            "chapter_number": chap_number,
            "title": ""
        }
        c_res = supabase.table("chapters").insert(chap_payload).execute()
        chapter_id = c_res.data[0]['id']
        
        images = chap_soup.find_all('img')
        pages_payload = []
        page_num = 1
        for img in images:
            src = img.get('data-src') or img.get('src')
            if src:
                src = urljoin(chap_url, src)
                # Filtrar imágenes pequeñas (iconos) o de ads
                if 'logo' not in src.lower() and 'avatar' not in src.lower() and 'banner' not in src.lower():
                    # Descargar y subir a Storage
                    file_ext = src.split('.')[-1].split('?')[0]
                    if len(file_ext) > 4: file_ext = "jpg"
                    storage_path = f"{slug}/chapter-{chap_number}/page-{page_num}.{file_ext}"
                    
                    print(f"      📥 Subiendo página {page_num}...")
                    final_url = upload_image_to_storage(src, storage_path)
                    
                    pages_payload.append({
                        "chapter_id": chapter_id,
                        "page_number": page_num,
                        "image_url": final_url
                    })
                    page_num += 1
                
        if pages_payload:
            supabase.table("pages").insert(pages_payload).execute()
            print(f"    ⚡ Insertadas {len(pages_payload)} páginas en base de datos.")

if __name__ == "__main__":
    print("\n🚀 NEKUTOON - AUTO SCRAPER (DIRECTO A BD) 🚀")
    target_url = input("🔗 Pega la URL principal del Manhwa a scrapear: ").strip()
    scrape_manhwa(target_url)
