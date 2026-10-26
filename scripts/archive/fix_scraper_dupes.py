import re

with open('direct_scraper_backup.py', 'r') as f:
    content = f.read()

old_loop = """    # Usamos un dict para evitar duplicados y guardar el número real extraído
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
    chapter_list = sorted(chapters_extracted.items(), key=lambda x: x[1])"""

new_loop = """    # Usamos un dict donde la CLAVE es el número de capítulo, para jamás tener el número duplicado
    chapters_extracted = {}
    
    for link in links:
        href = link['href']
        if 'capitulo' in href.lower() or 'chapter' in href.lower():
            full_url = urljoin(url, href)
            
            # Extraer el número (soporta decimales ej. capitulo-1-1 o capitulo-1.5)
            match = re.search(r'(capitulo|chapter)[-a-zA-Z]*[-/]?(\d+([.-]\d+)?)', href.lower())
            if match:
                chap_num_str = match.group(2).replace('-', '.')
                try:
                    chap_number = float(chap_num_str)
                    if chap_number.is_integer():
                        chap_number = int(chap_number)
                    
                    # Guardamos usando el NUMERO como llave única. Si ya existe, no se sobrescribe.
                    if chap_number not in chapters_extracted:
                        chapters_extracted[chap_number] = full_url
                except ValueError:
                    continue
                        
    # Convertimos a lista de tuplas (url, número) y ordenamos
    chapter_list = sorted([(url, num) for num, url in chapters_extracted.items()], key=lambda x: x[1])"""

content = content.replace(old_loop, new_loop)

with open('direct_scraper_backup.py', 'w') as f:
    f.write(content)
