import os
import sys
import time
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from direct_scraper_backup import scrape_manhwa

# Config Supabase
env_path = Path('.env.local')
if env_path.exists():
    load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL").replace("/rest/v1/", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 1. Obtener todos los títulos de Manhwas en la DB
print("📥 Obteniendo títulos de la base de datos...")
manhwas_db = []
offset = 0
while True:
    res = supabase.table("manhwas").select("title").range(offset, offset + 999).execute()
    if not res.data:
        break
    manhwas_db.extend([m["title"].lower().strip() for m in res.data])
    offset += 1000

print(f"✅ Se encontraron {len(manhwas_db)} manhwas en la DB.")

# 2. Definir los catálogos a escanear
catalogs = [
    "https://vermanhwa.com"
]
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
urls_to_scrape = set()

# 3. Escanear catálogos
def normalize_title(title):
    return ''.join(c for c in title.lower() if c.isalnum() or c == ' ').strip()

db_titles_norm = [normalize_title(t) for t in manhwas_db]

for base_url in catalogs:
    page_num = 1
    while True:
        print(f"🔎 Buscando coincidencias en {base_url} (Página {page_num})...")
        if 'lector-mangas.lat' in base_url:
            url = f"{base_url}?page={page_num}"
        else:
            url = f"{base_url.rstrip('/')}/page/{page_num}/"
            
        try:
            res = requests.get(url, headers=headers, timeout=10)
        except:
            break
            
        if res.status_code != 200:
            break
            
        soup = BeautifulSoup(res.text, 'html.parser')
        links = soup.find_all('a', href=True)
        found_in_page = 0
        links_on_page = False
        
        for link in links:
            href = link['href']
            if any(x in href.lower() for x in ['/genre/', '/page', '/category/', '/login', '/author/', '/tag/']):
                continue
                
            if any(x in href.lower() for x in ['/comics/', '/manga/', '/manhwa/', '/comic/']):
                links_on_page = True
                if 'capitulo' not in href.lower() and 'chapter' not in href.lower() and not href.lower().endswith(tuple(str(i) for i in range(10))):
                    raw_title = link.get('title') or ""
                    if not raw_title:
                        img = link.find('img')
                        if img:
                            raw_title = img.get('alt') or img.get('title') or ""
                    if not raw_title:
                        raw_title = link.get_text(strip=True) or ""
                    
                    title_text = normalize_title(raw_title)
                    if not title_text:
                        continue
                        
                    from urllib.parse import urljoin
                    full_url = urljoin(url, href)
                    
                    # Chequear coincidencia
                    for db_t in db_titles_norm:
                        if len(title_text) > 5 and (title_text in db_t or db_t in title_text):
                            if full_url not in urls_to_scrape:
                                urls_to_scrape.add(full_url)
                                found_in_page += 1
                                print(f"  🎯 ¡Encontrado! {title_text} -> {full_url}")
                            break
                            
        if not links_on_page:
            print(f"🏁 Fin del catálogo {base_url}.")
            break
            
        page_num += 1

print(f"\n🚀 Iniciando recuperación automática de {len(urls_to_scrape)} manhwas...")

import concurrent.futures
import time

def recover_worker(url):
    print(f"🤖 Recuperando: {url}")
    try:
        scrape_manhwa(url)
    except Exception as e:
        print(f"❌ Error al recuperar {url}: {e}")
    time.sleep(1) # Pequeño respiro para la CPU

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
    executor.map(recover_worker, list(urls_to_scrape))

print("\n🎉 RECUPERACIÓN FINALIZADA.")
