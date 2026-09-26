import re

urls = [
    "/leer/que-abundante-cosecha-seor-demonio_1743103875540-1_01",
    "/leer/que-abundante-cosecha-seor-demonio_1743103875540-10_01",
    "/leer/que-abundante-cosecha-seor-demonio_1743103875540-2.5_01",
    "/capitulo-1",
    "/chapter-1",
    "/manga/123/chapter-2.5"
]

for href in urls:
    match = re.search(r'(capitulo|chapter|leer|/c-).*?[-/](\d+([.-]\d+)?)', href.lower())
    if match:
        print(f"Match 1: {href} -> {match.group(2)}")
    else:
        print(f"Fail 1: {href}")
        
    # Mejor regex para atrapar el numero al final antes de un _ o /
    match2 = re.search(r'[-/](\d+([.-]\d+)?)(_[0-9]+)?/?$', href.lower())
    if match2:
        print(f"Match 2: {href} -> {match2.group(1)}")
    else:
        print(f"Fail 2: {href}")
    print("---")
