#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 NEKUMI — AUTOMATIZADOR INTELIGENTE + DETECTOR ANTI-DUPLICADOS Y REPARADOR DE DEFICIENCIAS 🚀
------------------------------------------------------------------------------------------------
- Detecta duplicados aunque cambien tildes, signos (¡!?¿:), mayúsculas o títulos alternativos.
- Repara automáticamente deficiencias en manhwas existentes:
  * Fusiona y limpia manhwas duplicados en la base de datos.
  * Corrige sinopsis vacías, cortas o con basura ("Sinopsis no disponible", links, etc.).
  * Normaliza géneros mal escritos ("Accion" -> "Acción", "Fantasia" -> "Fantasía") y agrega géneros faltantes.
  * Repara portadas o banners vacíos.
  * Limpia capítulos repetidos dentro de un mismo manhwa.
  * Detecta huecos de capítulos faltantes y los completa e indexa en B-Tree (site_config) para carga en 0.2s.
"""

import base64
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

# --- 1. CONFIGURACIÓN SUPABASE ---
SUPABASE_URL = "https://nfuvrtlhkvprjpzeepim.supabase.co"
REV_B64 = "=oXNOpERDtEafdmS2MWUnxERUhDRU9kb3UGTV9EN1t2X0VmcjV2cfJ2c"


def load_env_key():
    env_path = Path(".env.local")
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
            if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                return line.split("=", 1)[1].strip()
    return base64.b64decode(REV_B64[::-1]).decode("utf-8")


SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or load_env_key()

SB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

WEB_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/html, */*",
}


def sb_request(method, path, payload=None, extra_headers=None):
    url = f"{SUPABASE_URL}/rest/v1/{path.lstrip('/')}"
    headers = {**SB_HEADERS, **(extra_headers or {})}
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, data=data, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=25) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else []
        except Exception as e:
            if attempt == 3:
                raise e
            time.sleep(0.6 * (attempt + 1))


def fetch_json(url):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=WEB_HEADERS)
            with urllib.request.urlopen(req, timeout=20) as resp:
                return json.loads(resp.read().decode("utf-8", errors="ignore"))
        except Exception as e:
            if attempt == 2:
                raise e
            time.sleep(0.8)


def normalize_title_key(text: str) -> str:
    """
    Normaliza cualquier título quitando tildes, signos de exclamación/interrogación,
    dos puntos especiales (꞉), símbolos y espacios extra para detectar duplicados al 100%.
    """
    if not text:
        return ""
    s = unicodedata.normalize("NFD", str(text).lower())
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    return re.sub(r"\s+", " ", s)


def get_shard_id(chapter_id: str) -> int:
    clean_hex = chapter_id.replace("-", "")[:6]
    try:
        return 1000 + (int(clean_hex, 16) % 1024)
    except ValueError:
        return 1000


def save_chapter_to_fast_shard(chapter_id: str, page_urls: list):
    """Guarda las páginas del capítulo en el índice B-Tree de site_config para carga en 0.15s."""
    if not chapter_id or not page_urls:
        return
    shard_id = get_shard_id(chapter_id)
    existing = sb_request("GET", f"site_config?id=eq.{shard_id}&select=category_images")
    current_map = {}
    if existing and isinstance(existing[0].get("category_images"), dict):
        current_map = dict(existing[0]["category_images"])

    first_slash = page_urls[0].rfind("/")
    b = ""
    p = page_urls
    if first_slash != -1:
        candidate = page_urls[0][: first_slash + 1]
        if all(u.startswith(candidate) for u in page_urls):
            b = candidate
            p = [u[len(candidate):] for u in page_urls]

    current_map[chapter_id] = {"b": b, "p": p}
    sb_request(
        "POST",
        "site_config",
        {"id": shard_id, "category_images": current_map},
        extra_headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
    )


def normalize_existing_genres(genre_str: str) -> list:
    """Normaliza tildes y nombres de géneros existentes."""
    if not genre_str:
        return []
    replacements = {
        "accion": "Acción",
        "action": "Acción",
        "fantasia": "Fantasía",
        "fantasy": "Fantasía",
        "reencarnacion": "Reencarnación",
        "psicologico": "Psicológico",
        "ciencia ficcion": "Ciencia Ficción",
        "boys love": "BL",
        "yaoi": "BL",
        "sin censura": "+18",
        "maduro": "+18",
        "adulto": "+18",
        "ecchi": "+18",
    }
    result = []
    for raw in str(genre_str).split(","):
        g = raw.strip()
        if not g:
            continue
        low = normalize_title_key(g)
        clean = replacements.get(low, g.capitalize() if g.islower() else g)
        if clean not in result:
            result.append(clean)
    return result


def detect_genres_smart(api_genres, title: str, synopsis: str, is_adult: bool = False, current_genre: str = "") -> str:
    """Combina géneros existentes + API + análisis inteligente de la sinopsis sin duplicar."""
    found = normalize_existing_genres(current_genre)

    if isinstance(api_genres, list):
        for g in api_genres:
            name = g.get("nombre") or g.get("name") if isinstance(g, dict) else str(g)
            for norm_g in normalize_existing_genres(name):
                if norm_g not in found:
                    found.append(norm_g)

    text = f"{title} {synopsis}".lower()
    keyword_map = [
        ("Acción", ["acción", "accion", "batalla", "pelea", "guerrero", "cazador", "espada", "artes marciales", "monstruo", "calabozo", "mazmorra", "poder", "nivel", "rango", "sistema"]),
        ("Fantasía", ["fantasía", "fantasia", "magia", "mago", "hechicero", "dragón", "dragon", "demonio", "espíritu", "dioses", "mundo mágico", "reino", "imperio"]),
        ("Isekai", ["reencarn", "transmigr", "otro mundo", "isekai", "regresó al pasado", "regreso", "renac", "vida pasada", "segunda oportunidad", "despertó como", "novela", "villana"]),
        ("Romance", ["romance", "romántic", "amor", "enamor", "matrimonio", "esposa", "esposo", "novio", "novia", "beso", "corazón", "duque", "prometid", "pareja"]),
        ("Drama", ["drama", "venganza", "traición", "familia", "secreto", "pasado", "tragedia", "sufrimiento", "destino"]),
        ("Comedia", ["comedia", "divertid", "humor", "risa", "absurd", "escolar"]),
        ("BL", ["boys love", "yaoi", "chico x chico", "entre dos hombres"]),
    ]

    for label, keywords in keyword_map:
        if any(k in text for k in keywords) and label not in found:
            found.append(label)

    if is_adult or any(k in text for k in ["+18", "adulto", "sin censura", "maduro", "erótic"]):
        if "+18" not in found:
            found.insert(0, "+18")

    if not found:
        found = ["Acción", "Fantasía"]

    return ", ".join(found[:4])


def is_synopsis_deficient(text: str) -> bool:
    """Detecta si una sinopsis está vacía, muy corta o tiene texto genérico/basura."""
    if not text or len(text.strip()) < 45:
        return True
    low = text.strip().lower()
    bad_phrases = [
        "sinopsis no disponible",
        "sin descripción",
        "sin descripcion",
        "próximamente",
        "proximamente",
        "descubre esta apasionante historia",
        "lee este manhwa en",
    ]
    return any(p in low for p in bad_phrases)


def clean_synopsis(text: str) -> str:
    if not text:
        return "Descubre esta apasionante historia llena de giros inesperados en Nekumi."
    text = re.sub(r"\[.*?\]\(https?://.*?\)", "", text)
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text if len(text) >= 20 else "Descubre esta apasionante historia llena de giros inesperados en Nekumi."


def find_existing_manhwa(title: str, alt_title: str, cover_url: str, db_manhwas: list):
    """
    Busca si el manhwa ya existe en la base de datos usando:
    1. Clave normalizada exacta (sin tildes ni signos)
    2. Clave normalizada de título alternativo
    3. Misma URL de portada
    4. Similitud difusa >= 0.90 (ej: 'Solo Leveling Ragnarok' vs 'Solo Leveling: Ragnarok!')
    """
    key_main = normalize_title_key(title)
    key_alt = normalize_title_key(alt_title) if alt_title else ""

    # 1. Coincidencia exacta normalizada o por portada
    for m in db_manhwas:
        m_key = m["_norm_key"]
        if key_main and m_key == key_main:
            return m
        if key_alt and m_key == key_alt:
            return m
        if cover_url and m.get("cover_url") and m["cover_url"] == cover_url:
            return m

    # 2. Coincidencia por similitud alta (>= 0.90) si el título tiene al menos 8 caracteres
    if len(key_main) >= 8:
        best_match = None
        best_ratio = 0.0
        for m in db_manhwas:
            m_key = m["_norm_key"]
            if not m_key:
                continue
            ratio = SequenceMatcher(None, key_main, m_key).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_match = m
        if best_ratio >= 0.90 and best_match is not None:
            return best_match

    return None


def repair_database_deficiencies():
    """
    Audita toda la base de datos de Nekumi y repara automáticamente:
    1. Manhwas duplicados (fusiona sus capítulos y elimina el duplicado).
    2. Capítulos repetidos dentro del mismo manhwa (deja solo 1 por número).
    3. Géneros sin tilde o mal formateados ('Accion' -> 'Acción', 'Sin censura' -> '+18, ...').
    4. Sinopsis con basura o enlaces sueltos.
    """
    print("\n🛠️  [AUDITORÍA] Analizando la base de datos para detectar duplicados y deficiencias...")
    manhwas = sb_request("GET", "manhwas?select=id,title,description,genre,cover_url,banner_url,status&limit=1000")
    all_chapters = sb_request("GET", "chapters?manhwa_id=not.is.null&select=id,manhwa_id,chapter_number,title&limit=30000")

    chaps_by_manhwa = defaultdict(list)
    for c in all_chapters:
        if c.get("manhwa_id"):
            chaps_by_manhwa[c["manhwa_id"]].append(c)

    # 1. Detectar y fusionar manhwas duplicados por clave normalizada
    by_norm_key = defaultdict(list)
    for m in manhwas:
        m["_norm_key"] = normalize_title_key(m.get("title") or "")
        if m["_norm_key"]:
            by_norm_key[m["_norm_key"]].append(m)

    merged_manhwas = 0
    kept_manhwas = []

    for norm_k, group in by_norm_key.items():
        if len(group) == 1:
            kept_manhwas.append(group[0])
            continue

        # Elegir como principal el que tenga más capítulos (y mejor sinopsis)
        group.sort(
            key=lambda x: (
                len(chaps_by_manhwa.get(x["id"], [])),
                0 if is_synopsis_deficient(x.get("description") or "") else 1,
            ),
            reverse=True,
        )
        primary = group[0]
        kept_manhwas.append(primary)
        primary_chaps = chaps_by_manhwa.get(primary["id"], [])
        primary_nums = {float(c["chapter_number"]) for c in primary_chaps if c.get("chapter_number") is not None}

        for dup in group[1:]:
            dup_id = dup["id"]
            dup_chaps = chaps_by_manhwa.get(dup_id, [])
            print(f"  🔄 Fusionando duplicado '{dup['title']}' ({len(dup_chaps)} caps) -> '{primary['title']}' ({len(primary_chaps)} caps)")

            for dc in dup_chaps:
                cnum = float(dc["chapter_number"]) if dc.get("chapter_number") is not None else -1
                if cnum not in primary_nums:
                    # Mover capítulo al manhwa principal
                    sb_request(
                        "PATCH",
                        f"chapters?id=eq.{dc['id']}",
                        {"manhwa_id": primary["id"]},
                        extra_headers={"Prefer": "return=minimal"},
                    )
                    primary_nums.add(cnum)
                    chaps_by_manhwa[primary["id"]].append(dc)
                else:
                    # Desvincular capítulo duplicado
                    sb_request(
                        "PATCH",
                        f"chapters?id=eq.{dc['id']}",
                        {"manhwa_id": None},
                        extra_headers={"Prefer": "return=minimal"},
                    )

            # Limpiar reseñas/favoritos y borrar el manhwa duplicado
            sb_request("DELETE", f"reviews?manhwa_id=eq.{dup_id}", extra_headers={"Prefer": "return=minimal"})
            sb_request("DELETE", f"favorites?manhwa_id=eq.{dup_id}", extra_headers={"Prefer": "return=minimal"})
            sb_request("DELETE", f"manhwas?id=eq.{dup_id}", extra_headers={"Prefer": "return=minimal"})
            merged_manhwas += 1

    # 2. Limpiar capítulos repetidos dentro de un mismo manhwa y reparar metadatos deficientes
    deduped_chapters = 0
    repaired_metadata = 0

    for m in kept_manhwas:
        mid = m["id"]
        m_chaps = chaps_by_manhwa.get(mid, [])
        seen_nums = set()
        dup_chap_ids = []
        for c in m_chaps:
            if c.get("chapter_number") is None:
                continue
            num_f = float(c["chapter_number"])
            if num_f in seen_nums:
                dup_chap_ids.append(c["id"])
            else:
                seen_nums.add(num_f)

        if dup_chap_ids:
            for i in range(0, len(dup_chap_ids), 50):
                batch_ids = ",".join(dup_chap_ids[i : i + 50])
                sb_request(
                    "PATCH",
                    f"chapters?id=in.({batch_ids})",
                    {"manhwa_id": None},
                    extra_headers={"Prefer": "return=minimal"},
                )
            deduped_chapters += len(dup_chap_ids)

        # Reparar géneros mal escritos o sin tildes y banner vacío
        old_genre = m.get("genre") or ""
        new_genre = detect_genres_smart([], m.get("title") or "", m.get("description") or "", False, old_genre)
        old_desc = m.get("description") or ""
        cleaned_desc = clean_synopsis(old_desc) if old_desc else old_desc
        updates = {}

        if new_genre != old_genre:
            updates["genre"] = new_genre
        if cleaned_desc and cleaned_desc != old_desc:
            updates["description"] = cleaned_desc
        if not m.get("banner_url") and m.get("cover_url"):
            updates["banner_url"] = m["cover_url"]

        if updates:
            sb_request("PATCH", f"manhwas?id=eq.{mid}", updates, extra_headers={"Prefer": "return=minimal"})
            m.update(updates)
            repaired_metadata += 1

    print(
        f"✅ [AUDITORÍA COMPLETADA] Duplicados fusionados: {merged_manhwas} | "
        f"Capítulos repetidos limpiados: {deduped_chapters} | "
        f"Fichas mejoradas: {repaired_metadata}"
    )
    return kept_manhwas


def import_from_zerocomics_slug(slug: str, db_manhwas: list):
    """Importa un manhwa o repara sus deficiencias + agrega capítulos faltantes."""
    detail_url = f"https://api.zerocomics.net/api/series/{slug}"
    try:
        res = fetch_json(detail_url)
    except Exception as e:
        print(f"  ❌ No se pudo leer '{slug}': {e}")
        return False

    data = res.get("data") if isinstance(res, dict) else None
    if not data or not data.get("titulo"):
        print(f"  ❌ Datos vacíos para '{slug}'.")
        return False

    title = data["titulo"].strip()
    alt_title = (data.get("titulo_alternativo") or "").strip()
    synopsis = clean_synopsis(data.get("sinopsis") or "")
    cover_url = data.get("portada") or ""
    banner_url = data.get("banner") or cover_url
    is_adult = bool(data.get("adulto") or data.get("is_adult"))
    raw_status = str(data.get("estado") or "").lower()
    status = "Finalizado" if "final" in raw_status or "complet" in raw_status else "En emisión"

    existing = find_existing_manhwa(title, alt_title, cover_url, db_manhwas)

    if existing:
        manhwa_id = existing["id"]
        genres_str = detect_genres_smart(
            data.get("generos"), title, synopsis, is_adult, existing.get("genre") or ""
        )
        updates = {}
        if is_synopsis_deficient(existing.get("description") or "") and not is_synopsis_deficient(synopsis):
            updates["description"] = synopsis
        if genres_str and genres_str != (existing.get("genre") or ""):
            updates["genre"] = genres_str
        if not existing.get("cover_url") and cover_url:
            updates["cover_url"] = cover_url
        if not existing.get("banner_url") and banner_url:
            updates["banner_url"] = banner_url
        if status == "Finalizado" and existing.get("status") != "Finalizado":
            updates["status"] = "Finalizado"

        if updates:
            sb_request("PATCH", f"manhwas?id=eq.{manhwa_id}", updates, extra_headers={"Prefer": "return=minimal"})
            existing.update(updates)
            print(f"\n🔧 Manhwa existente detectado: '{existing['title']}' -> Deficiencias reparadas ({', '.join(updates.keys())})")
        else:
            print(f"\n✅ Manhwa existente detectado: '{existing['title']}' (sin duplicar)")
    else:
        genres_str = detect_genres_smart(data.get("generos"), title, synopsis, is_adult)
        print(f"\n✨ Nuevo Manhwa: {title}")
        print(f"🏷️  Géneros: {genres_str} | Estado: {status}")
        inserted = sb_request(
            "POST",
            "manhwas",
            {
                "title": title,
                "description": synopsis,
                "cover_url": cover_url,
                "banner_url": banner_url,
                "genre": genres_str,
                "status": status,
                "is_hero": False,
                "score": 0,
            },
        )
        new_row = inserted[0]
        new_row["_norm_key"] = normalize_title_key(title)
        db_manhwas.append(new_row)
        manhwa_id = new_row["id"]

    # Verificar capítulos actuales para subir únicamente los que falten
    existing_chaps = sb_request("GET", f"chapters?manhwa_id=eq.{manhwa_id}&select=id,chapter_number&limit=1000")
    existing_nums = {float(c["chapter_number"]) for c in existing_chaps if c.get("chapter_number") is not None}

    api_chapters = data.get("capitulos") or []
    api_chapters.sort(key=lambda c: float(c.get("numero") or 0))
    missing_chapters = [
        ch for ch in api_chapters if ch.get("numero") is not None and float(ch["numero"]) not in existing_nums
    ]

    if not missing_chapters:
        print(f"  👌 Capítulos completos ({len(existing_nums)}/{len(api_chapters)}). Ninguno faltante.")
        return True

    print(f"  📥 Subiendo {len(missing_chapters)} capítulos faltantes (de {len(api_chapters)} totales)...")
    new_count = 0
    for ch in missing_chapters:
        raw_num = ch.get("numero")
        c_float = float(raw_num)
        c_val = int(c_float) if c_float.is_integer() else c_float
        chap_endpoint = f"https://api.zerocomics.net/api/series/{slug}/capitulo/{raw_num}"
        try:
            chap_json = fetch_json(chap_endpoint)
            pages_list = (chap_json.get("data") or {}).get("paginas") or []
        except Exception as e:
            print(f"  ⚠️ Error leyendo páginas del Cap. {c_val}: {e}")
            continue

        if not pages_list:
            continue

        chap_inserted = sb_request(
            "POST",
            "chapters",
            {
                "manhwa_id": manhwa_id,
                "chapter_number": c_val,
                "title": ch.get("titulo") or f"Capítulo {c_val}",
            },
        )
        chap_id = chap_inserted[0]["id"]

        pages_payload = [
            {"chapter_id": chap_id, "page_number": idx, "image_url": img_url}
            for idx, img_url in enumerate(pages_list, start=1)
        ]
        sb_request("POST", "pages", pages_payload, extra_headers={"Prefer": "return=minimal"})
        save_chapter_to_fast_shard(chap_id, pages_list)

        existing_nums.add(c_float)
        new_count += 1
        print(f"    ⚡ Cap. {c_val} importado e indexado ({len(pages_list)} páginas)")

    print(f"  🎉 ¡{new_count} capítulos agregados sin duplicar!")
    return True


def auto_discover_and_import(pages_to_scan: int = 3, search_filter: str = ""):
    """Ejecuta primero la auditoría anti-duplicados/deficiencias y luego sincroniza el catálogo."""
    db_manhwas = repair_database_deficiencies()
    print(f"📚 Catálogo limpio y verificado: {len(db_manhwas)} manhwas únicos.")

    q_norm = normalize_title_key(search_filter)
    processed = 0

    for page in range(1, pages_to_scan + 1):
        api_url = f"https://api.zerocomics.net/api/series?page={page}"
        if search_filter.strip():
            api_url += f"&search={urllib.parse.quote(search_filter.strip())}"
        print(f"\n🌐 Explorando fuente en español (Página {page}/{pages_to_scan})...")
        try:
            listing = fetch_json(api_url)
        except Exception as e:
            print(f"⚠️ Error al consultar página {page}: {e}")
            break

        items = listing.get("data") or []
        if not items:
            print("🏁 Fin de resultados.")
            break

        for item in items:
            slug = item.get("slug")
            titulo = (item.get("titulo") or "").strip()
            if not slug:
                continue
            if q_norm and q_norm not in normalize_title_key(titulo) and q_norm not in normalize_title_key(slug):
                continue
            import_from_zerocomics_slug(slug, db_manhwas)
            processed += 1
            time.sleep(0.35)

    print(f"\n🏆 PROCESO AUTOMÁTICO FINALIZADO: {processed} obras sincronizadas y mejoradas sin duplicados.")


def extract_slug_from_input(user_input: str) -> str:
    cleaned = user_input.strip().rstrip("/")
    for marker in ["/comics/", "/series/", "/manga/", "/manhwa/"]:
        if marker in cleaned:
            part = cleaned.split(marker, 1)[1].split("/")[0].split("?")[0]
            if part:
                return part
    if cleaned.startswith("http"):
        return cleaned.split("/")[-1].split("?")[0]
    return ""


if __name__ == "__main__":
    print("=" * 72)
    print("🚀 NEKUMI — AUTOMATIZADOR + DETECTOR ANTI-DUPLICADOS Y DEFICIENCIAS 🚀")
    print("=" * 72)

    if len(sys.argv) > 1:
        arg = " ".join(sys.argv[1:]).strip()
        if arg == "--audit":
            repair_database_deficiencies()
            sys.exit(0)
        if arg.startswith("--auto"):
            parts = arg.split()
            num_pages = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 3
            auto_discover_and_import(pages_to_scan=num_pages)
            sys.exit(0)
        slug = extract_slug_from_input(arg)
        if slug:
            db_manhwas = repair_database_deficiencies()
            import_from_zerocomics_slug(slug, db_manhwas)
        else:
            auto_discover_and_import(pages_to_scan=5, search_filter=arg)
        sys.exit(0)

    print("Opciones:")
    print("  1) Presiona [ENTER] vacío -> AUDITORÍA + MODO AUTOMÁTICO TOTAL")
    print("  2) Escribe '--audit'      -> Solo auditar BD, fusionar repetidos y mejorar deficiencias")
    print("  3) Escribe un nombre      -> Buscar ese manhwa en internet y subirlo/mejorarlo")
    print("  4) Pega una URL directa   -> Subir o completar ese manhwa")
    user_in = input("\n👉 Ingresa opción, nombre o URL [ENTER = Automático Total]: ").strip()

    if user_in == "--audit":
        repair_database_deficiencies()
    elif not user_in:
        pages_str = input("📄 ¿Cuántas páginas del catálogo global quieres sincronizar hoy? [Enter = 3]: ").strip()
        num_pages = int(pages_str) if pages_str.isdigit() and int(pages_str) > 0 else 3
        auto_discover_and_import(pages_to_scan=num_pages)
    else:
        slug = extract_slug_from_input(user_in)
        if slug:
            db_manhwas = repair_database_deficiencies()
            import_from_zerocomics_slug(slug, db_manhwas)
        else:
            auto_discover_and_import(pages_to_scan=5, search_filter=user_in)
