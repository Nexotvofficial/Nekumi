import os
import sys
import shutil
import subprocess
import re
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# --- 1. CARGAR CONFIGURACIÓN ---
env_path = Path('.env.local')
if env_path.exists():
    load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
# Intentar buscar la Service Role Key secreta primero para saltar el RLS
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ No se encontraron las credenciales de Supabase en un archivo .env.local")
    SUPABASE_URL = input("🔗 Pega tu NEXT_PUBLIC_SUPABASE_URL: ").strip()
    SUPABASE_KEY = input("🔑 Pega tu SUPABASE_SERVICE_ROLE_KEY (secreta) o ANON_KEY: ").strip()

# Limpiar URL por si pegaron el de REST API con /rest/v1/
SUPABASE_URL = SUPABASE_URL.replace("/rest/v1/", "").replace("/rest/v1", "").rstrip("/")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- 2. INPUT DEL USUARIO ---
print("\n" + "="*50)
print("🚀 NEKUTOON HAKUNEKO AUTOMATOR VIP 🚀")
print("="*50 + "\n")

hakuneko_path = input("📁 Ruta de la carpeta descargada (Ej: C:\\Users\\Admin\\Descargas\\Solo Leveling): ").strip('"')
if not os.path.exists(hakuneko_path):
    print("❌ ERROR: La carpeta fuente no existe.")
    sys.exit(1)

manga_title = os.path.basename(os.path.normpath(hakuneko_path))
print(f"📖 Título detectado: {manga_title}")

def get_folder_size(folder_path):
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(folder_path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if not os.path.islink(fp) and not '.git' in fp:
                total_size += os.path.getsize(fp)
    return total_size

def get_manual_repo(base_dir="C:\\Users\\Administrator\\Downloads", max_gb=1.0):
    catalog_prefix = "Nekumi-Catalog-"
    if not os.path.exists(base_dir):
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
        
        # Archivo inicial
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

# --- 3. PROCESAR ARCHIVOS Y MOVER AL REPO ---
# Crear un slug (nombre de carpeta limpia)
slug = re.sub(r'[^a-z0-9]+', '-', manga_title.lower()).strip('-')
target_img_dir = os.path.join(github_repo_path, "img", slug)

print(f"\n⚙️ Creando estructura en {target_img_dir}...")
os.makedirs(target_img_dir, exist_ok=True)

chapters_data = [] # Para guardar en supabase después

# Leer capítulos de HakuNeko
hakuneko_chapters = [d for d in os.listdir(hakuneko_path) if os.path.isdir(os.path.join(hakuneko_path, d))]
print(f"📦 Se encontraron {len(hakuneko_chapters)} carpetas/capítulos.")

for folder_name in hakuneko_chapters:
    source_folder = os.path.join(hakuneko_path, folder_name)
    
    # Extraer el número del capítulo usando regex
    match = re.search(r'\d+(\.\d+)?', folder_name)
    if not match:
        continue
    
    chap_num = float(match.group())
    if chap_num.is_integer():
        chap_num = int(chap_num)
        
    clean_chap_folder = str(chap_num)
    target_chap_folder = os.path.join(target_img_dir, clean_chap_folder)
    
    # Solo copiar si no existe o actualizar (ya se hizo antes, así que es rápido)
    if not os.path.exists(target_chap_folder):
        shutil.copytree(source_folder, target_chap_folder)
    else:
        for item in os.listdir(source_folder):
            s = os.path.join(source_folder, item)
            d = os.path.join(target_chap_folder, item)
            if not os.path.exists(d):
                shutil.copy2(s, d)
                
    pages = [f for f in os.listdir(target_chap_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
    pages.sort()
    
    chapters_data.append({
        'number': chap_num,
        'title': folder_name,
        'pages_count': len(pages),
        'pages_files': pages,
        'folder': clean_chap_folder
    })

print(f"✅ Archivos preparados en {repo_name}/img/{slug}")

# --- 4. SUBIR A GITHUB ---
print("\n🚀 Subiendo archivos a GitHub...")
try:
    subprocess.run(["git", "add", "."], cwd=github_repo_path, check=True)
    subprocess.run(["git", "commit", "-m", f"auto: add {manga_title} chapters"], cwd=github_repo_path)
    
    # Intentar empujar forzosamente
    push_res = subprocess.run(["git", "push", "-f", "-u", "origin", "main"], cwd=github_repo_path, capture_output=True, text=True)
    
    if push_res.returncode != 0:
        if "Repository not found" in push_res.stderr or "not found" in push_res.stderr.lower():
            print("⚠️ El repositorio remoto no existe. Creándolo ahora...")
            gh_path = r"C:\Program Files\GitHub CLI\gh.exe"
            subprocess.run([gh_path, "repo", "create", repo_name, "--public"], cwd=github_repo_path)
            subprocess.run(["git", "remote", "add", "origin", f"https://github.com/Nexotvofficial/{repo_name}.git"], cwd=github_repo_path)
            subprocess.run(["git", "push", "-f", "-u", "origin", "main"], cwd=github_repo_path)
            print("✅ Subida a GitHub completada tras crear el repo.")
        else:
            print(f"⚠️ Error en Git: {push_res.stderr}")
    else:
        print("✅ Subida a GitHub completada.")
except Exception as e:
    print(f"❌ ERROR en Git: {e}")

# --- 5. INYECTAR EN SUPABASE ---
print("\n💉 Inyectando datos en Supabase...")

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

print("⏳ Insertando capítulos y páginas...")
chapters_data.sort(key=lambda x: x['number']) 

for chap in chapters_data:
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
            supabase.table("pages").insert(pages_payload).execute()
            
    print(f"  -> Capítulo {chap['number']} insertado ({chap['pages_count']} páginas).")

print("\n" + "="*50)
print("🎉 ¡PROCESO COMPLETADO EXITOSAMENTE! 🎉")
print("="*50 + "\n")
