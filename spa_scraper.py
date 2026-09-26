import os
import sys
import re
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

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

# --- 2. SCRAPER AVANZADO CON NAVEGADOR FANTASMA ---
def scrape_manhwa_spa(url):
    print(f"🌍 Despertando el Navegador Fantasma para: {url}")
    
    with sync_playwright() as p:
        # Lanzamos Chrome invisible
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Entramos a la página y esperamos a que el JavaScript cargue TODO (red quieta)
        page.goto(url, wait_until="networkidle", timeout=60000)
        
        # Obtenemos el HTML renderizado real
        html = page.content()
        soup = BeautifulSoup(html, 'html.parser')
        
        # --- EXTRACCIÓN DE DATOS ---
        title_tag = soup.find('h1') or soup.find('h2', class_=re.compile('title|name', re.IGNORECASE))
        if title_tag:
            manga_title = title_tag.text.strip()
        else:
            # Fallback a la etiqueta <title> del head
            manga_title = soup.title.string if soup.title else page.title()
            manga_title = re.sub(r' - .*$', '', manga_title).strip()
            
        cover_meta = soup.find('meta', property='og:image')
        cover_url = cover_meta['content'] if cover_meta else ""
        if not cover_url:
            img_tag = soup.find('img', class_=re.compile('cover|thumb'))
            if img_tag: cover_url = img_tag.get('src', '')
            
        synopsis = "Sinopsis no disponible."
        for el in soup.find_all(['div', 'p'], class_=re.compile(r'summary|desc|excerpt|sinopsis|sino|about', re.IGNORECASE)):
            text = el.text.strip()
            if len(text) > 40 and 'traducciones' not in text.lower():
                synopsis = text
                break
        if synopsis == "Sinopsis no disponible.":
            meta = soup.find('meta', property='og:description') or soup.find('meta', attrs={'name': 'description'})
            if meta: synopsis = meta['content'].strip()
                
        genres = []
        for a in soup.find_all('a', href=True):
            href = a['href'].lower()
            if '/genero/' in href or '/genre/' in href or '/category/' in href or '/tag/' in href:
                g = a.text.strip()
                if g and g not in genres: genres.append(g)
        genre_text = ", ".join(genres[:4]) if genres else "Fantasía, Acción"
        
        print(f"📖 Título: {manga_title}")
        print(f"🏷️ Géneros: {genre_text}")
        print(f"📝 Sinopsis: {synopsis[:60]}...")
        
        # Insertar Manhwa en BD
        existing = supabase.table("manhwas").select("id").eq("title", manga_title).execute()
        if existing.data:
            manhwa_id = existing.data[0]['id']
            print(f"✅ El Manhwa ya existe (ID: {manhwa_id})")
        else:
            payload = {
                "title": manga_title, "description": synopsis,
                "cover_url": cover_url, "banner_url": cover_url,
                "genre": genre_text, "is_hero": False, "score": 5.0
            }
            res_insert = supabase.table("manhwas").insert(payload).execute()
            manhwa_id = res_insert.data[0]['id']
            print(f"✅ Manhwa creado (ID: {manhwa_id})")
            
        # Extraer links de capítulos
        links = soup.find_all('a', href=True)
        chapters_extracted = {}
        for link in links:
            href = link['href']
            if 'capitulo' in href.lower() or 'chapter' in href.lower() or '/leer/' in href.lower():
                full_url = urljoin(url, href)
                if full_url not in chapters_extracted:
                    match = re.search(r'[-/](\d+([.-]\d+)?)(_[0-9]+)?/?$', href.lower())
                    if match:
                        try:
                            chap_number = float(match.group(1).replace('-', '.'))
                            if chap_number.is_integer(): chap_number = int(chap_number)
                            chapters_extracted[full_url] = chap_number
                        except ValueError: continue
                        
        chapter_list = sorted(chapters_extracted.items(), key=lambda x: x[1])
        print(f"📚 Se encontraron {len(chapter_list)} posibles capítulos.")
        
        # Procesar Capítulos
        for chap_url, chap_number in chapter_list:
            print(f"  ⏳ Procesando Capítulo {chap_number}...")
            
            existing_chap = supabase.table("chapters").select("id").eq("manhwa_id", manhwa_id).eq("chapter_number", chap_number).execute()
            if existing_chap.data:
                print(f"    ⏭️ El Capítulo {chap_number} ya existe. Omitiendo.")
                continue
                
            chap_payload = {"manhwa_id": manhwa_id, "chapter_number": chap_number, "title": f"Capítulo {chap_number}"}
            c_res = supabase.table("chapters").insert(chap_payload).execute()
            chapter_id = c_res.data[0]['id']
            
            # Navegar a la página del capítulo para ejecutar el JS de las imágenes
            page.goto(chap_url, wait_until="networkidle", timeout=60000)
            chap_html = page.content()
            chap_soup = BeautifulSoup(chap_html, 'html.parser')
            
            images = chap_soup.find_all('img')
            pages_payload = []
            page_num = 1
            for img in images:
                src = img.get('data-src') or img.get('src')
                if src:
                    src = urljoin(chap_url, src)
                    src_lower = src.lower()
                    bad_words = ['logo', 'avatar', 'banner', 'icon', 'loading', 'gif', 'gravatar', 'intensedebate', 'wordpress', 'button']
                    if not any(bw in src_lower for bw in bad_words) and 'http' in src_lower:
                        pages_payload.append({
                            "chapter_id": chapter_id,
                            "page_number": page_num,
                            "image_url": src
                        })
                        page_num += 1
                        
            if pages_payload:
                supabase.table("pages").insert(pages_payload).execute()
                print(f"    ⚡ Insertadas {len(pages_payload)} páginas (Directo de la web, sin descargar).")
                
        browser.close()

if __name__ == "__main__":
    print("\n🚀 NEKUTOON - AUTO SCRAPER (FUERZA BRUTA SPA) 🚀")
    target_url = input("🔗 Pega la URL principal del Manhwa a scrapear: ").strip()
    scrape_manhwa_spa(target_url)
