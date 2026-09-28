import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

env_path = Path('.env.local')
if env_path.exists():
    load_dotenv(env_path)

supabase = create_client(
    os.getenv("NEXT_PUBLIC_SUPABASE_URL").replace("/rest/v1/", "").rstrip("/"), 
    os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)

# Fetch all manhwas
manhwas = []
offset = 0
while True:
    res = supabase.table("manhwas").select("title").range(offset, offset + 999).execute()
    if not res.data:
        break
    manhwas.extend(res.data)
    offset += 1000

print(f"Total manhwas: {len(manhwas)}")
for m in manhwas[:10]:
    print(m["title"])
