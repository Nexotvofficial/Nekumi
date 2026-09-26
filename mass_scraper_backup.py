import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import time
import re
import sys
from direct_scraper_backup import scrape_manhwa

print("╔══════════════════════════════════════════════════════════════╗")
print("║         🚀 NEKUTOON SCRAPER INTELIGENTE (HOTLINK)            ║")
print("╠══════════════════════════════════════════════════════════════╣")
print("║  1. Masivo    → Escanea catálogo entero (ej. /page/1, 2...)  ║")
print("║  2. Un Manhwa → Descarga solo 1 manhwa específico por URL    ║")
print("╚══════════════════════════════════════════════════════════════╝")
print("💡 Tip: ¡También puedes pegar directamente el link de tu manhwa aquí!")
print()

entrada = input("👉 Elige opción (1=Masivo / 2=Individual) o pega tu enlace directamente: ").strip()

# ══════════════════════════════════════════════════════════════
# DETECCIÓN INTELIGENTE DE URL DIRECTA
# ══════════════════════════════════════════════════════════════
manga_url = None
modo = "1"

if entrada.startswith("http://") or entrada.startswith("https://"):
    # El usuario pegó una URL directamente en el primer prompt
    url_limpia = entrada.lower()
    
    # Si la URL indica claramente que es una paginación de catálogo
    if '/page/' in url_limpia or '?page=' in url_limpia:
        modo = "1"
        base_url = entrada
    # Si la URL es la raíz del sitio (ej. https://vermanhwa.com o https://vermanhwa.com/)
    elif url_limpia.count('/') < 3 or (url_limpia.count('/') == 3 and url_limpia.endswith('/')):
        modo = "1"
        base_url = entrada
    # De lo contrario, asumimos que es la URL de un manhwa individual
    else:
        modo = "2"
        manga_url = entrada

elif entrada in ["2", "individual", "unico", "único", "solo", "uno", "i", "u"]:
    modo = "2"
else:
    modo = "1"

# ══════════════════════════════════════════════════════════════
# MODO 2: UN SOLO MANHWA
# ══════════════════════════════════════════════════════════════
if modo == "2":
    if not manga_url:
        print()
        manga_url = input("🔗 Pega la URL del Manhwa (ej. https://vermanhwa.com/manga/nombre-manga/): ").strip()
    
    if not manga_url:
        print("❌ No se proporcionó ninguna URL.")
        sys.exit(0)
        
    print(f"\n🎯 [MODO INDIVIDUAL] Procesando manhwa...")
    try:
        scrape_manhwa(manga_url)
        print("\n✅ ¡Proceso individual finalizado!")
    except KeyboardInterrupt:
        print("\n⏹️ Cancelado por el usuario.")
    except Exception as e:
        print(f"\n❌ Error al procesar: {e}")
    sys.exit(0)

# ══════════════════════════════════════════════════════════════
# MODO 1: MASIVO (CATÁLOGO COMPLETO)
# ══════════════════════════════════════════════════════════════
if 'base_url' not in locals():
    print()
    base_url = input("🔗 Pega la URL del catálogo (ej. https://vermanhwa.com o https://lector-mangas.lat/comics): ").strip()
    if not base_url:
        base_url = "https://vermanhwa.com"
        print(f"Usando URL por defecto: {base_url}")

print()
filtro = input("🔍 ¿Filtrar por palabra clave o género? (o presiona ENTER para todos): ").strip().lower()

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
all_manhwas = set()
page_num = 1

while True:
    print(f"\n🔎 Escaneando página {page_num}...")
    if 'lector-mangas.lat' in base_url:
        url = f"{base_url}?page={page_num}"
    else:
        url = f"{base_url.rstrip('/')}/page/{page_num}/"
        
    try:
        res = requests.get(url, headers=headers, timeout=15)
    except Exception as e:
        print(f"❌ Error al acceder a página {page_num}: {e}")
        break
        
    soup = BeautifulSoup(res.text, 'html.parser')
    links = soup.find_all('a', href=True)
    nuevos_en_pagina = 0
    
    for link in links:
        href = link['href']
        
        # Ignorar tags, autores, etc.
        if any(x in href.lower() for x in ['/genre/', '/page', '/category/', '/login', '/author/', '/tag/']):
            continue
            
        if any(x in href.lower() for x in ['/comics/', '/manga/', '/manhwa/', '/comic/', '/library/']):
            if 'capitulo' not in href.lower() and 'chapter' not in href.lower() and not re.search(r'/\d+$', href):
                full_url = urljoin(base_url, href)
                
                if filtro:
                    title_text = (link.get_text(strip=True) or "").lower()
                    parent_text = (link.parent.get_text(strip=True) if link.parent else "").lower()
                    if filtro not in title_text and filtro not in parent_text:
                        continue
                
                if full_url not in all_manhwas:
                    all_manhwas.add(full_url)
                    nuevos_en_pagina += 1
                    print(f"  ✚ Encontrado: {full_url}")
            
    if nuevos_en_pagina == 0:
        print(f"🏁 No hay más mangas en la página {page_num}. Fin del escaneo.")
        break
        
    print(f"  → {nuevos_en_pagina} nuevos en esta página. Total acumulado: {len(all_manhwas)}")
    page_num += 1
    time.sleep(1)

manhwa_list = list(all_manhwas)
print(f"\n{'='*55}")
print(f"✅ Se encontraron {len(manhwa_list)} manhwas únicos.")
if filtro:
    print(f"🔍 Filtro aplicado: '{filtro}'")
print(f"{'='*55}")

if not manhwa_list:
    print("❌ No se encontró ningún manhwa con ese filtro o URL.")
    sys.exit(0)

confirmacion = input(f"\n¿Deseas procesar estos {len(manhwa_list)} manhwas ahora? (s/n): ").strip().lower()
if confirmacion != "s":
    print("❌ Operación cancelada.")
    sys.exit(0)

try:
    for i, url in enumerate(manhwa_list):
        print(f"\n[{i+1}/{len(manhwa_list)}] 🤖 Procesando: {url}")
        scrape_manhwa(url)
        time.sleep(2)
except KeyboardInterrupt:
    print("\n⏹️ Proceso detenido por el usuario.")

print("\n🎉 ¡PROCESO COMPLETADO! 🎉")
