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

res = supabase.table("pages").select("id", count="exact").limit(1).execute()
print(f"Total pages in DB: {res.count}")
