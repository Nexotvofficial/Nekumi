import os
from supabase import create_client

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    with open(".env.local", "r") as f:
        for line in f:
            if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                url = line.split("=")[1].strip()
            if line.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY="):
                key = line.split("=")[1].strip()

supabase = create_client(url, key)

res = supabase.table("chapters").select("chapter_number").eq("manhwa_id", "c431ab0c-1414-4de8-9c82-ec46d00624a4").execute()
chaps = sorted([c['chapter_number'] for c in res.data])
print(f"Total chapters: {len(chaps)}")
print(f"First 10 chapters: {chaps[:10]}")
print(f"Last 10 chapters: {chaps[-10:]}")

