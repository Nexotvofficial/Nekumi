import re

with open('src/lib/supabase.ts', 'r') as f:
    content = f.read()

old_client = """export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}"""

new_client = """export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options) => {
          return fetch(url, { ...options, cache: 'no-store' });
        }
      }
    }
  )
}"""

if "cache: 'no-store'" not in content:
    content = content.replace(old_client, new_client)
    with open('src/lib/supabase.ts', 'w') as f:
        f.write(content)
    print("Patched cache.")
else:
    print("Already patched.")
