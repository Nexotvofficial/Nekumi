import os
import re

with open('upload_hakuneko.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Add a threading lock and total for the progress
code = code.replace('chapters_data = []', 'chapters_data = []\nimport threading\ncopy_lock = threading.Lock()\ncopy_counter = 0\ntotal_chaps = len([d for d in os.listdir(hakuneko_path) if os.path.isdir(os.path.join(hakuneko_path, d))])')

# Update the process_chapter to print progress
target_func = '''    pages.sort()
    
    return {'''
replacement = '''    pages.sort()
    
    with copy_lock:
        global copy_counter
        copy_counter += 1
        print(f"  [✓] Copiado Capítulo {chap_num} listo ({copy_counter}/{total_chaps})", flush=True)
        
    return {'''
code = code.replace(target_func, replacement)

# Update git push to show real-time progress by removing capture_output
git_push_target = '''    push_res = subprocess.run(["git", "push", "-f", "-u", "origin", "main"], cwd=github_repo_path, capture_output=True, text=True)
    
    if push_res.returncode != 0:
        if "Repository not found" in push_res.stderr or "not found" in push_res.stderr.lower():'''

git_push_replace = '''    # Permitimos que la consola muestre el progreso en tiempo real
    print("  -> (Nota: Verás el porcentaje de subida de git a continuación)")
    push_res = subprocess.run(["git", "push", "-f", "-u", "origin", "main"], cwd=github_repo_path)
    
    if push_res.returncode != 0:
        # Si falló, asumimos que puede ser porque el repo no existe aún en GitHub
        print("⚠️ Falló el push. Intentando crear el repositorio remotamente por si no existe...")'''
        
code = code.replace(git_push_target, git_push_replace)

with open('upload_hakuneko.py', 'w', encoding='utf-8') as f:
    f.write(code)

print('Updated progress in script!')
