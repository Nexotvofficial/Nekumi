import os
import re

with open('upload_hakuneko.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure Pillow is imported
if 'from PIL import Image' not in code:
    code = code.replace('import concurrent.futures', 'import concurrent.futures\nfrom PIL import Image')

# Rewrite process_chapter completely
process_target = re.search(r'def process_chapter\(folder_name\):.*?return \{', code, re.DOTALL).group(0)

new_process = '''def process_chapter(folder_name):
    source_folder = os.path.join(hakuneko_path, folder_name)
    match = re.search(r'\\d+(\\.\\d+)?', folder_name)
    if not match:
        return None
    
    chap_num = float(match.group())
    if chap_num.is_integer():
        chap_num = int(chap_num)
        
    clean_chap_folder = str(chap_num)
    target_chap_folder = os.path.join(target_img_dir, clean_chap_folder)
    
    # Creamos la carpeta del capitulo
    os.makedirs(target_chap_folder, exist_ok=True)
    
    # Compresion e iteracion
    for item in os.listdir(source_folder):
        if item.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            s = os.path.join(source_folder, item)
            base_name = os.path.splitext(item)[0]
            d = os.path.join(target_chap_folder, f"{base_name}.webp")
            
            if not os.path.exists(d):
                try:
                    with Image.open(s) as img:
                        # WebP supports RGBA natively. Just ensure no weird palettes crash it.
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        # Save optimized WebP
                        img.save(d, 'webp', quality=80, method=4)
                except Exception as e:
                    # Fallback si el archivo esta corrupto o no se puede procesar
                    shutil.copy2(s, os.path.join(target_chap_folder, item))
                    
    # Recolectar las imagenes (ya convertidas)
    pages = [f for f in os.listdir(target_chap_folder) if f.lower().endswith(('.webp', '.jpg', '.jpeg', '.png'))]
    pages.sort()
    
    with copy_lock:
        global copy_counter
        copy_counter += 1
        print(f"  [✓] Procesado y Comprimido Capítulo {chap_num} ({copy_counter}/{total_chaps})", flush=True)
        
    return {'''

code = code.replace(process_target, new_process)

with open('upload_hakuneko.py', 'w', encoding='utf-8') as f:
    f.write(code)

print('WebP compression integrated successfully!')
