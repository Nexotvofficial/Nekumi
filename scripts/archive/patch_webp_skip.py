
import re

with open('upload_hakuneko.py', 'r', encoding='utf-8') as f:
    code = f.read()

target = '''            if not os.path.exists(d):
                try:
                    with Image.open(s) as img:
                        # WebP supports RGBA natively. Just ensure no weird palettes crash it.
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        # Save optimized WebP
                        img.save(d, 'webp', quality=80, method=4)
                except Exception as e:
                    # Fallback si el archivo esta corrupto o no se puede procesar
                    shutil.copy2(s, os.path.join(target_chap_folder, item))'''

replacement = '''            if not os.path.exists(d):
                if item.lower().endswith('.webp'):
                    # Si ya es WebP, lo copiamos directamente para no perder tiempo ni calidad
                    import shutil
                    shutil.copy2(s, d)
                else:
                    try:
                        with Image.open(s) as img:
                            # WebP supports RGBA natively. Just ensure no weird palettes crash it.
                            if img.mode == 'P':
                                img = img.convert('RGBA')
                            # Save optimized WebP
                            img.save(d, 'webp', quality=80, method=4)
                    except Exception as e:
                        # Fallback si el archivo esta corrupto o no se puede procesar
                        import shutil
                        shutil.copy2(s, os.path.join(target_chap_folder, item))'''

code = code.replace(target, replacement)

with open('upload_hakuneko.py', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patched successfully!')

