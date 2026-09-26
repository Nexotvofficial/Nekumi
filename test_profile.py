import os
from supabase import create_client

url = ""
key = ""
with open('.env.local', 'r') as f:
    for line in f:
        if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
            url = line.strip().split("=")[1].strip('"')
        elif line.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY="):
            key = line.strip().split("=")[1].strip('"')

supabase = create_client(url, key)
try:
    res = supabase.table("profiles").update({"role": "admin"}).eq("username", "Dreamkiss").execute()
    print("Update successful if role column exists:", res.data)
except Exception as e:
    print("Error:", e)
