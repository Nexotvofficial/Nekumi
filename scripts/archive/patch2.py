with open("direct_scraper_backup.py", "r") as f:
    content = f.read()

old_block = """    print(f"🌍 Analizando: {url}")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    # 1. Obtener datos del Manhwa
    try:
        res = requests.get(url, headers=headers, timeout=15)
        res.encoding = 'utf-8'
    except Exception as e:
        print(f"❌ Error al conectar con {url}: {e}")
        return False"""

new_block = """    print(f"🌍 Analizando: {url}")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    # 1. Obtener datos del Manhwa
    try:
        res = requests.get(url, headers=headers, timeout=15)
        res.encoding = 'utf-8'
        if res.status_code == 404 or 'página no encontrada' in res.text.lower() or 'no encontrada' in res.text.lower():
            raise Exception("Página 404 - No Encontrada")
        res.raise_for_status()
    except Exception as e:
        print(f"⚠️ Alerta: Error al conectar con {url} ({e})")
        print("🐉 Invocando Protocolo HIDRA (Multi-Fuente)...")
        slug = url.rstrip('/').split('/')[-1]
        nueva_url = buscar_manga_hidra(slug)
        if nueva_url:
            print(f"🐉 Hidra redirigiendo el scraping a: {nueva_url}")
            url = nueva_url
            try:
                res = requests.get(url, headers=headers, timeout=15)
                res.encoding = 'utf-8'
            except:
                return False
        else:
            print(f"❌ Hidra falló. No se pudo encontrar el manhwa en las fuentes de respaldo.")
            return False"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open("direct_scraper_backup.py", "w") as f:
        f.write(content)
    print("Hydra fallback injected successfully!")
else:
    print("Could not find the old block. Let's do it with regex.")
