import re

with open('src/app/manga/[id]/chapter/[chapterId]/page.tsx', 'r') as f:
    content = f.read()

# Add retry state
if "const [retryCount, setRetryCount] = useState(0);" not in content:
    content = content.replace("const [loading, setLoading] = useState(true);", "const [loading, setLoading] = useState(true);\n  const [retryCount, setRetryCount] = useState(0);")

# Update loadData logic
load_old = """      const { data: pData } = await supabase
        .from("pages").select("*").eq("chapter_id", chapterId)
        .order("page_number", { ascending: true });
      if (pData) setPages(pData);

      setLoading(false);
    }
    if (chapterId) loadData();
  }, [chapterId, manhwaId, supabase]);"""

load_new = """      const { data: pData } = await supabase
        .from("pages").select("*").eq("chapter_id", chapterId)
        .order("page_number", { ascending: true });
        
      if (pData && pData.length > 0) {
        setPages(pData);
        setLoading(false);
      } else {
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1500); // Auto reintentar 3 veces cada 1.5s si el scraper está tardando
        } else {
          setLoading(false);
        }
      }
    }
    if (chapterId) loadData();
  }, [chapterId, manhwaId, supabase, retryCount]);"""

content = content.replace(load_old, load_new)

with open('src/app/manga/[id]/chapter/[chapterId]/page.tsx', 'w') as f:
    f.write(content)
print("Patched chapter retry.")
