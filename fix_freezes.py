import re

with open('upload_hakuneko.py', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Insert duplicate check for Supabase and ask for range
supabase_injection_target = '''manhwa_payload = {
    "title": manga_title,
    "description": synopsis,
    "cover_url": cover_url,
    "banner_url": banner_url,
    "genre": genre,
    "is_hero": False,
    "score": 5.0
}

response = supabase.table("manhwas").insert(manhwa_payload).execute()
if not response.data:
    print("❌ ERROR al insertar el manhwa en Supabase.")
    sys.exit(1)

manhwa_id = response.data[0]['id']
print(f"✅ Manhwa creado en BD (ID: {manhwa_id})")'''

supabase_injection_replacement = '''# Check si el manhwa ya existe
existing_manhwa = supabase.table("manhwas").select("id").eq("title", manga_title).execute()

if existing_manhwa.data and len(existing_manhwa.data) > 0:
    manhwa_id = existing_manhwa.data[0]['id']
    print(f"✅ El Manhwa ya existe en BD (ID: {manhwa_id}). Se agregarán los nuevos capítulos.")
else:
    manhwa_payload = {
        "title": manga_title,
        "description": synopsis,
        "cover_url": cover_url,
        "banner_url": banner_url,
        "genre": genre,
        "is_hero": False,
        "score": 5.0
    }
    response = supabase.table("manhwas").insert(manhwa_payload).execute()
    if not response.data:
        print("❌ ERROR al insertar el manhwa en Supabase.")
        sys.exit(1)
    manhwa_id = response.data[0]['id']
    print(f"✅ Manhwa creado en BD (ID: {manhwa_id})")'''

code = code.replace(supabase_injection_target, supabase_injection_replacement)

# 2. Modify Chapter Range filter
chapter_prep_target = '''hakuneko_chapters = [d for d in os.listdir(hakuneko_path) if os.path.isdir(os.path.join(hakuneko_path, d))]
print(f"📦 Se encontraron {len(hakuneko_chapters)} capítulos. Preparando subprocesos...")'''

chapter_prep_replacement = '''hakuneko_chapters = [d for d in os.listdir(hakuneko_path) if os.path.isdir(os.path.join(hakuneko_path, d))]

# Opción de lotes (Para PCs que se traban)
print("\\n" + "-"*50)
print(f"📦 Se encontraron {len(hakuneko_chapters)} carpetas de capítulos en total.")
rango_op = input("¿Deseas procesar TODOS o solo un RANGO? (1 = Todos, 2 = Elegir Rango): ").strip()

if rango_op == '2':
    try:
        min_chap = float(input("  ▶ Capítulo Inicial (ej: 1): ").strip())
        max_chap = float(input("  ▶ Capítulo Final (ej: 50): ").strip())
        
        filtered_chapters = []
        for d in hakuneko_chapters:
            m = re.search(r'\d+(\.\d+)?', d)
            if m:
                num = float(m.group())
                if min_chap <= num <= max_chap:
                    filtered_chapters.append(d)
        hakuneko_chapters = filtered_chapters
        print(f"✅ Filtrado a {len(hakuneko_chapters)} capítulos (del {min_chap} al {max_chap}).")
    except ValueError:
        print("⚠️ Entrada inválida, se procesarán todos los capítulos.")

total_chaps = len(hakuneko_chapters)
print(f"⏳ Preparando {total_chaps} capítulos...")'''

code = code.replace(chapter_prep_target, chapter_prep_replacement)

# Fix total_chaps declaration being overwritten or messed up if we had it earlier
code = code.replace('total_chaps = len([d for d in os.listdir(hakuneko_path) if os.path.isdir(os.path.join(hakuneko_path, d))])', '')


# 3. Change max_workers from 16 to 4 for image compression, and 10 to 5 for DB
code = code.replace('ThreadPoolExecutor(max_workers=16)', 'ThreadPoolExecutor(max_workers=4)')
code = code.replace('ThreadPoolExecutor(max_workers=10)', 'ThreadPoolExecutor(max_workers=5)')

with open('upload_hakuneko.py', 'w', encoding='utf-8') as f:
    f.write(code)
print("Script optimized for i5 PCs!")
