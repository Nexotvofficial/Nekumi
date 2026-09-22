import re

with open('upload_hakuneko.py', 'r', encoding='utf-8') as f:
    code = f.read()

bad_block = '''    if push_res.returncode != 0:
        # Si falló, asumimos que puede ser porque el repo no existe aún en GitHub
        print("⚠️ Falló el push. Intentando crear el repositorio remotamente por si no existe...")
            print("⚠️ El repo no existe remotamente. Creando...")
            gh_path = r"C:\Program Files\GitHub CLI\gh.exe"
            subprocess.run([gh_path, "repo", "create", repo_name, "--public"], cwd=github_repo_path)
            subprocess.run(["git", "remote", "add", "origin", f"https://github.com/Nexotvofficial/{repo_name}.git"], cwd=github_repo_path)
            subprocess.run(["git", "push", "-f", "-u", "origin", "main"], cwd=github_repo_path)
            print("✅ Subida a GitHub completada tras crear el repo.")
        else:
            print(f"⚠️ Error en Git: {push_res.stderr}")
    else:'''

good_block = '''    if push_res.returncode != 0:
        # Si falló, asumimos que puede ser porque el repo no existe aún en GitHub
        print("⚠️ Falló el push. Intentando crear el repositorio remotamente por si no existe...")
        gh_path = r"C:\Program Files\GitHub CLI\gh.exe"
        subprocess.run([gh_path, "repo", "create", repo_name, "--public"], cwd=github_repo_path)
        subprocess.run(["git", "remote", "add", "origin", f"https://github.com/Nexotvofficial/{repo_name}.git"], cwd=github_repo_path)
        subprocess.run(["git", "push", "-f", "-u", "origin", "main"], cwd=github_repo_path)
        print("✅ Subida a GitHub completada tras crear el repo.")
    else:'''

code = code.replace(bad_block, good_block)

with open('upload_hakuneko.py', 'w', encoding='utf-8') as f:
    f.write(code)

print('Indent fixed!')
