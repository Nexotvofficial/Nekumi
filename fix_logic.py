import re

with open('mass_scraper_backup.py', 'r') as f:
    content = f.read()

old_logic = """    elif url_limpia.count('/') < 3 or (url_limpia.count('/') == 3 and url_limpia.endswith('/')):
        modo = "1"
        base_url = entrada
    # De lo contrario, asumimos que es la URL de un manhwa individual
    else:
        modo = "2"
        manga_url = entrada"""

new_logic = """    elif url_limpia.count('/') < 3 or (url_limpia.count('/') == 3 and url_limpia.endswith('/')) or '/genre/' in url_limpia or '/category/' in url_limpia or url_limpia.endswith('/comics') or url_limpia.endswith('/manga'):
        modo = "1"
        base_url = entrada
    # De lo contrario, asumimos que es la URL de un manhwa individual
    else:
        modo = "2"
        manga_url = entrada"""

content = content.replace(old_logic, new_logic)

with open('mass_scraper_backup.py', 'w') as f:
    f.write(content)
