with open("hidra_engine.py", "r") as f:
    content = f.read()

old_block = """            res = requests.get(url, headers=headers, timeout=5)
            if res.status_code == 200:
                # Verificación rápida: ¿Tiene capítulos?
                if 'capítulo' in res.text.lower() or 'chapter' in res.text.lower() or 'ajax/chapters' in res.text.lower():
                    print(f"  ✅ ¡Éxito! Encontrado en: {url}")
                    return url"""

new_block = """            res = requests.get(url, headers=headers, timeout=5, allow_redirects=True)
            # Evitar falsos positivos si la página redirige al inicio
            if res.status_code == 200 and len(res.url) > len(base) - 5 and "manga" in res.url:
                if 'capítulo' in res.text.lower() or 'chapter' in res.text.lower() or 'ajax/chapters' in res.text.lower():
                    print(f"  ✅ ¡Éxito! Encontrado en: {res.url}")
                    return res.url"""

content = content.replace(old_block, new_block)

with open("hidra_engine.py", "w") as f:
    f.write(content)

print("Hydra patched to avoid redirect false positives!")
