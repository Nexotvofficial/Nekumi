import re

with open('mass_scraper_backup.py', 'r') as f:
    content = f.read()

# Replace the URL construction logic
old_url_logic = """    if 'lector-mangas.lat' in base_url:
        url = f"{base_url}?page={page_num}"
    else:
        url = f"{base_url.rstrip('/')}/page/{page_num}/"
        
    try:
        res = requests.get(url, headers=headers, timeout=15)
    except Exception as e:"""

new_url_logic = """    if page_num == 1:
        url = base_url
    else:
        if not next_page_url:
            print(f"🏁 No se encontró link para la página {page_num}. Fin del escaneo.")
            break
        url = next_page_url

    try:
        res = requests.get(url, headers=headers, timeout=15)
    except Exception as e:"""

content = content.replace(old_url_logic, new_url_logic)

# Replace the page increment logic to also find next_page_url
old_end_logic = """    if nuevos_en_pagina == 0:
        print(f"🏁 No hay más mangas en la página {page_num}. Fin del escaneo.")
        break
        
    print(f"  → {nuevos_en_pagina} nuevos en esta página. Total acumulado: {len(all_manhwas)}")
    page_num += 1
    time.sleep(1)"""

new_end_logic = """    if nuevos_en_pagina == 0 and page_num > 1:
        print(f"🏁 No hay más mangas nuevos. Fin del escaneo.")
        break
        
    print(f"  → {nuevos_en_pagina} nuevos en esta página. Total acumulado: {len(all_manhwas)}")
    
    # Buscar el link de la siguiente página de forma inteligente
    next_page_url = None
    target_text = str(page_num + 1)
    for l in soup.find_all('a', href=True):
        if l.get_text(strip=True) == target_text or l.get_text(strip=True) == '>':
            next_page_url = urljoin(url, l['href'])
            if l.get_text(strip=True) == target_text:
                break # Prioridad al número exacto

    if not next_page_url:
        print(f"🏁 No hay más páginas (llegamos a la {page_num}). Fin del escaneo.")
        break

    page_num += 1
    time.sleep(1)"""

content = content.replace(old_end_logic, new_end_logic)

# We need to initialize next_page_url before the while loop
content = content.replace("page_num = 1\n\nwhile True:", "page_num = 1\nnext_page_url = None\n\nwhile True:")

with open('mass_scraper_backup.py', 'w') as f:
    f.write(content)
