import os
import sys
import shutil
import subprocess
import re
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
import concurrent.futures
from PIL import Image

# --- 1. CARGAR CONFIGURACIÓN ---
env_path = Path('.env.local')
if env_path.exists():
    load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ No se encontraron las credenciales de Supabase en un archivo .env.local")
    SUPABASE_URL = input("🔗 Pega tu NEXT_PUBLIC_SUPABASE_URL: ").strip()
    SUPABASE_KEY = input("🔑 Pega tu SUPABASE_SERVICE_ROLE_KEY (secreta) o ANON_KEY: ").strip()

SUPABASE_URL = SUPABASE_URL.replace("/rest/v1/", "").replace("/rest/v1", "").rstrip("/")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- 2. PEDIR DATOS AL USUARIO ---
print("\n" + "="*50)
print("🚀 NEKUTOON - AUTO UPLOADER HAKUNEKO (ULTRA FAST) 🚀")
print("="*50)

hakuneko_path = input("📂 Ruta de la carpeta del manga descargado (Ej: C:\\HakuNeko\\mangas\\Solo Leveling): ").strip()
if not os.path.exists(hakuneko_path):
    print("❌ La ruta no existe. Verifica e intenta de nuevo.")
    sys.exit(1)

manga_title = os.path.basename(os.path.normpath(hakuneko_path))
print(f"📖 Título detectado: {manga_title}")

def get_folder_size(folder_path):
    total_size = 0
    for dirpath, _, filenames in os.walk(folder_path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if not os.path.islink(fp) and '.git' not in fp:
                total_size += os.path.getsize(fp)
    return total_size

def get_manual_repo(base_dir="C:\\Users\\Administrator\\Downloads", max_gb=1.0):
    catalog_prefix = "Nekumi-Catalog-"
    os.makedirs(base_dir, exist_ok=True)
        
    while True:
        cat_input = input("\n📂 ¿En qué número de catálogo quieres guardarlo? (Ej: 09): ").strip()
        try:
            cat_num = int(cat_input)
            break
        except ValueError:
            print("❌ Por favor ingresa solo el número (ejemplo: 9 o 09).")
            
    repo_name = f"{catalog_prefix}{cat_num:02d}"
    repo_path = os.path.join(base_dir, repo_name)
    
    if not os.path.exists(repo_path):
        print(f"🌟 Creando nueva carpeta local para el catálogo: {repo_name}")
        os.makedirs(repo_path, exist_ok=True)
        subprocess.run(["git", "init"], cwd=repo_path, check=True)
        
        print(f"☁️ Conectando con GitHub ({repo_name})...")
        gh_path = r"C:\Program Files\GitHub CLI\gh.exe"
        if os.path.exists(gh_path):
            res = subprocess.run([gh_path, "repo", "create", repo_name, "--public"], cwd=repo_path, capture_output=True, text=True)
            if res.returncode != 0:
                print(f"⚠️ Nota: El repo podría ya existir en la nube ({res.stderr.strip()})")
        
        subprocess.run(["git", "remote", "add", "origin", f"https://github.com/Nexotvofficial/{repo_name}.git"], cwd=repo_path, capture_output=True)
        subprocess.run(["git", "branch", "-M", "main"], cwd=repo_path, capture_output=True)
        
        with open(os.path.join(repo_path, "README.md"), "w") as f:
            f.write(f"# {repo_name}\nCatálogo de imágenes auto-generado.")
        subprocess.run(["git", "add", "README.md"], cwd=repo_path, capture_output=True)
        subprocess.run(["git", "commit", "-m", "Initial commit"], cwd=repo_path, capture_output=True)
    else:
        size_bytes = get_folder_size(repo_path)
        size_gb = size_bytes / (1024**3)
        print(f"✅ Usando catálogo local existente: {repo_name} (Ocupado: {size_gb:.2f} GB / {max_gb} GB)")
        if size_gb > max_gb:
            print("⚠️ ADVERTENCIA: Este catálogo ya superó 1 GB. Considere usar uno nuevo pronto.")
            
    return repo_path, repo_name

github_repo_path, repo_name = get_manual_repo()

cover_url = input("\n🖼️ URL de la portada (Cover URL): ").strip()
banner_url = input("🖼️ URL del banner (Enter para dejar vacío): ").strip()
synopsis = input("📝 Sinopsis (Enter para 'Sin descripción'): ").strip() or "Sin descripción disponible."
genre = input("🏷️ Género Principal (Ej: Acción, Fantasía, Romance) [Acción]: ").strip() or "Acción"

# --- 3. PROCESAR ARCHIVOS (PARALELIZADO) ---
slug = re.sub(r'[^a-z0-9]+', '-', manga_title.lower()).strip('-')
target_img_dir = os.path.join(github_repo_path, "img", slug)

print(f"\n⚙️ Copiando archivos a {target_img_dir} de forma concurrente...")
os.makedirs(target_img_dir, exist_ok=True)

chapters_data = []
import threading
copy_lock = threading.Lock()
copy_counter = 0


hakuneko_chapters = [d for d in os.listdir(hakuneko_path) if os.path.isdir(os.path.join(hakuneko_path, d))]

# Opción de lotes (Para PCs que se traban)
print("\n" + "-"*50)
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
print(f"⏳ Preparando {total_chaps} capítulos...")

def process_chapter(folder_name):
    source_folder = os.path.join(hakuneko_path, folder_name)
    match = re.search(r'\d+(\.\d+)?', folder_name)
    if not match:
        return None
    
    chap_num = float(match.group())
    if chap_num.is_integer():
        chap_num = int(chap_num)
        
    clean_chap_folder = str(chap_num)
    target_chap_folder = os.path.join(target_img_dir, clean_chap_folder)
    
    # Creamos la carpeta del capitulo
    os.makedirs(target_chap_folder, exist_ok=True)
    
    # Compresion e iteracion
    for item in os.listdir(source_folder):
        if item.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            s = os.path.join(source_folder, item)
            base_name = os.path.splitext(item)[0]
            d = os.path.join(target_chap_folder, f"{base_name}.webp")
            
            if not os.path.exists(d):
                if item.lower().endswith('.webp'):
                    # Si ya es WebP, lo copiamos directamente para no perder tiempo ni calidad
                    import shutil
                    shutil.copy2(s, d)
                else:
                    try:
                        with Image.open(s) as img:
                            # WebP supports RGBA natively. Just ensure no weird palettes crash it.
                            if img.mode == 'P':
                                img = img.convert('RGBA')
                            # Save optimized WebP
                            img.save(d, 'webp', quality=80, method=4)
                    except Exception as e:
                        # Fallback si el archivo esta corrupto o no se puede procesar
                        import shutil
                        shutil.copy2(s, os.path.join(target_chap_folder, item))
                    
    # Recolectar las imagenes (ya convertidas)
    pages = [f for f in os.listdir(target_chap_folder) if f.lower().endswith(('.webp', '.jpg', '.jpeg', '.png'))]
    pages.sort()
    
    with copy_lock:
        global copy_counter
        copy_counter += 1
        print(f"  [✓] Procesado y Comprimido Capítulo {chap_num} ({copy_counter}/{total_chaps})", flush=True)
        
    return {
        'number': chap_num,
        'title': folder_name,
        'pages_count': len(pages),
        'pages_files': pages,
        'folder': clean_chap_folder
    }

# Multithreading para copiado súper rápido
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(process_chapter, hakuneko_chapters))
    for res in results:
        if res:
            chapters_data.append(res)

print(f"✅ Todos los archivos copiados en {repo_name}/img/{slug}")

# --- 4. SUBIR A GITHUB ---
print("\n🚀 Subiendo archivos a GitHub (Este paso depende de tu internet)...")
try:
    subprocess.run(["git", "add", "."], cwd=github_repo_path, check=True)
    subprocess.run(["git", "commit", "-m", f"auto: add {manga_title} chapters"], cwd=github_repo_path)
    
    # Permitimos que la consola muestre el progreso en tiempo real
    print("  -> (Nota: Verás el porcentaje de subida de git a continuación)")
    push_res = subprocess.run(["git", "push", "-f", "-u", "origin", "main"], cwd=github_repo_path)
    
    if push_res.returncode != 0:
        # Si falló, asumimos que puede ser porque el repo no existe aún en GitHub
        print("⚠️ Falló el push. Intentando crear el repositorio remotamente por si no existe...")
        gh_path = r"C:\Program Files\GitHub CLI\gh.exe"
        subprocess.run([gh_path, "repo", "create", repo_name, "--public"], cwd=github_repo_path)
        subprocess.run(["git", "remote", "add", "origin", f"https://github.com/Nexotvofficial/{repo_name}.git"], cwd=github_repo_path)
        subprocess.run(["git", "push", "-f", "-u", "origin", "main"], cwd=github_repo_path)
        print("✅ Subida a GitHub completada tras crear el repo.")
    else:
        print("✅ Subida a GitHub completada.")
except Exception as e:
    print(f"❌ ERROR en Git: {e}")

# --- 5. INYECTAR EN SUPABASE (PARALELIZADO) ---
print("\n💉 Inyectando datos en Supabase a máxima velocidad...")

# Check si el manhwa ya existe
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
    print(f"✅ Manhwa creado en BD (ID: {manhwa_id})")

print("⏳ Insertando todos los capítulos y páginas simultáneamente...")
chapters_data.sort(key=lambda x: x['number']) 

def insert_chapter_to_db(chap):
    chap_payload = {
        "manhwa_id": manhwa_id,
        "chapter_number": chap['number'],
        "title": f"Capítulo {chap['number']}"
    }
    chap_res = supabase.table("chapters").insert(chap_payload).execute()
    
    if chap_res.data:
        chapter_id = chap_res.data[0]['id']
        
        pages_payload = []
        for idx, page_file in enumerate(chap['pages_files']):
            img_url = f"https://cdn.jsdelivr.net/gh/Nexotvofficial/{repo_name}@main/img/{slug}/{chap['folder']}/{page_file}"
            pages_payload.append({
                "chapter_id": chapter_id,
                "page_number": idx + 1,
                "image_url": img_url
            })
            
        if pages_payload:
            # Enviar todas las páginas en lote (1 request)
            supabase.table("pages").insert(pages_payload).execute()
            
    print(f"  ⚡ Capítulo {chap['number']} insertado ({chap['pages_count']} páginas).")

# Multithreading para inserción en BD (súper rápido)
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    executor.map(insert_chapter_to_db, chapters_data)

print("\n" + "="*50)
print("🎉 ¡PROCESO COMPLETADO SÚPER RÁPIDO! 🎉")
print("="*50 + "\n")
