import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

env_path = Path('.env.local')
if env_path.exists():
    load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get 10 pages and check if their chapters exist
pages = supabase.table("pages").select("chapter_id").limit(10).execute()
for p in pages.data:
    chap = supabase.table("chapters").select("id").eq("id", p["chapter_id"]).execute()
    print(f"Page chapter_id: {p['chapter_id']} -> Chapter exists: {bool(chap.data)}")
