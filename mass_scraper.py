import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import subprocess
import time
import re

print("🚀 INICIANDO MODO MASIVO 🚀")
base_url = input("🔗 Pega la URL del catálogo (ej. https://lector-mangas.lat/comics): ").strip()
if not base_url:
    base_url = "https://lector-mangas.lat/comics"
    print(f"Usando URL por defecto: {base_url}")

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

all_manhwas = set()
page_num = 1

while True:
    print(f"🔎 Escaneando página {page_num}...")
    url = f"{base_url}?page={page_num}"
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, 'html.parser')
    
    # Buscar todos los enlaces que sean mangas
    links = soup.find_all('a', href=True)
    nuevos_en_pagina = 0
    
    for link in links:
        href = link['href']
        # Evitar links de generos, login, o paginación
        if href.startswith('/comics/') and '/genre/' not in href and '/page' not in href:
            full_url = urljoin(base_url, href)
            if full_url not in all_manhwas:
                all_manhwas.add(full_url)
                nuevos_en_pagina += 1
                
    if nuevos_en_pagina == 0:
        print(f"🏁 No se encontraron más mangas en la página {page_num}. Fin de la búsqueda de links.")
        break
        
    page_num += 1
    time.sleep(1) # Pequeña pausa para no saturar

manhwa_list = list(all_manhwas)
print(f"✅ Se encontraron {len(manhwa_list)} manhwas únicos para procesar.")

# Llamar al script direct_scraper.py pasándole las URLs (modificaremos direct_scraper para aceptar argumentos)
# En lugar de modificarlo, direct_scraper.py usa input(), pero podemos enviar la URL a través de stdin usando subprocess
for i, url in enumerate(manhwa_list):
    print(f"\n[{i+1}/{len(manhwa_list)}] Enviando al bot trabajador: {url}")
    # Ejecutamos direct_scraper.py y le pasamos la URL como input
    process = subprocess.run(
        [".venv/bin/python", "direct_scraper.py"],
        input=url + "\n",
        text=True,
        capture_output=False
    )
    time.sleep(2) # Pausa entre cada manhwa para no ser baneados

print("🎉 MODO MASIVO COMPLETADO 🎉")
