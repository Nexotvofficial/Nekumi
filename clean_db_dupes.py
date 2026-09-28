import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

env_path = Path('.env.local')
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL").replace("/rest/v1/", "").replace("/rest/v1", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Fetch all chapters
res = supabase.table("chapters").select("id, manhwa_id, chapter_number").execute()
chapters = res.data

# Group by manhwa_id and chapter_number
seen = {}
to_delete = []

for chap in chapters:
    key = f"{chap['manhwa_id']}_{chap['chapter_number']}"
    if key in seen:
        to_delete.append(chap['id'])
    else:
        seen[key] = chap['id']

if to_delete:
    print(f"🗑️ Eliminando {len(to_delete)} capítulos duplicados de la base de datos...")
    # Supabase SDK might need batches, but we can try deleting all if it's small, or one by one
    for chap_id in to_delete:
        supabase.table("chapters").delete().eq("id", chap_id).execute()
    print("✅ Duplicados eliminados exitosamente.")
else:
    print("✅ No se encontraron capítulos duplicados en la base de datos.")
