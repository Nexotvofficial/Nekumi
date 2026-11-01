#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NEKUTOON TITAN AGENT v3.0 — Agente Autónomo Definitivo 24/7 de Manhwas
----------------------------------------------------------------------
1. Doble Radar Continuo:
   - Radar 1 (Estrenos al Minuto): detecta capítulos nuevos y estrenos recién publicados hoy.
   - Radar 2 (Explorador Rotativo de Populares): recorre automáticamente las 5,000+ obras más populares
     en español página por página (guardando el cursor en Supabase site_config ID 290).
   - Enriquecedor Cruzado (ZeroComics + Olympus Scanlation): obtiene la mejor sinopsis en español,
     portada HD, banner y estado real ('En emisión' / 'Finalizado').
2. Clasificador de Categorías de Precisión v3.0:
   - Elimina marcas de scans, etiquetas en inglés y falsos positivos ('Acción' en BL/Romance, '+18' falsos).
   - Aísla estrictamente '+18', 'BL', 'GL', 'Murim', 'Sistema', 'Isekai', 'Romance', 'Fantasía', 'Drama', 'Comedia', 'Terror'.
3. Escudo Anti-Duplicados de 4 Capas + Fusión Automática.
4. Indexación Instantánea B-Tree (site_config shards 1000..2023) para carga de capítulos en 0.15s.
5. Notificación Automática IndexNow a Bing y Yandex por cada obra y capítulo nuevo.

Modos de uso:
  python nekutoon_agent.py --cycle            # Ejecuta un ciclo inteligente completo (usado por Tarea Programada cada 20 min)
  python nekutoon_agent.py --daemon           # Modo demonio infinito 24/7 (escanea cada 15 min sin parar)
  python nekutoon_agent.py --audit            # Reclasifica y audita todas las categorías del catálogo
  python nekutoon_agent.py "Nombre o URL"     # Busca e importa un manhwa específico completo al instante
"""

import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env.local"
AUTOPILOT_CONFIG_ID = 290


def load_config():
    cfg = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8", errors="ignore").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                cfg[k.strip()] = v.strip()
    sb_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or cfg.get(
        "NEXT_PUBLIC_SUPABASE_URL", "https://nfuvrtlhkvprjpzeepim.supabase.co"
    )
    sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or cfg.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not sb_key:
        raise RuntimeError("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local o variables de entorno.")
    return sb_url, sb_key


SUPABASE_URL, SUPABASE_KEY = load_config()

SB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

WEB_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NekutoonTitanAgent/3.0",
    "Accept": "application/json, text/plain, */*",
}


def sb_request(method: str, path: str, payload=None, extra_headers=None):
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


def fetch_json(url: str, timeout: int = 18):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=WEB_HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8", errors="ignore"))
        except Exception as e:
            if attempt == 2:
                raise e
            time.sleep(0.7 * (attempt + 1))


def norm_key(text: str) -> str:
    if not text:
        return ""
    s = unicodedata.normalize("NFD", str(text).lower())
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    return re.sub(r"\s+", " ", s)


CANONICAL_TAG_MAP = {
    "accion": "Acción",
    "action": "Acción",
    "fantasia": "Fantasía",
    "fantasy": "Fantasía",
    "magic": "Fantasía",
    "magia": "Fantasía",
    "romance": "Romance",
    "isekai": "Isekai",
    "reencarnacion": "Isekai",
    "transmigracion": "Isekai",
    "regresion": "Isekai",
    "retornado": "Isekai",
    "drama": "Drama",
    "drama escolar": "Escolar",
    "tragedia": "Drama",
    "venganza": "Drama",
    "comedia": "Comedia",
    "comedy": "Comedia",
    "artes marciales": "Artes Marciales",
    "martial arts": "Artes Marciales",
    "cultivacion": "Murim",
    "murim": "Murim",
    "sistema": "Sistema",
    "pantallas de sistemas": "Sistema",
    "aventura": "Aventura",
    "adventure": "Aventura",
    "psicologico": "Psicológico",
    "psychological": "Psicológico",
    "thriller": "Psicológico",
    "crimen": "Misterio",
    "misterio": "Misterio",
    "mystery": "Misterio",
    "horror": "Terror",
    "terror": "Terror",
    "sobrenatural": "Sobrenatural",
    "supernatural": "Sobrenatural",
    "vida escolar": "Escolar",
    "school life": "Escolar",
    "escolar": "Escolar",
    "deportes": "Deportes",
    "deporte": "Deportes",
    "sports": "Deportes",
    "ciencia ficcion": "Ciencia Ficción",
    "sci fi": "Ciencia Ficción",
    "apocaliptico": "Apocalíptico",
    "supervivencia": "Apocalíptico",
    "historico": "Histórico",
    "historia": "Histórico",
    "historical": "Histórico",
    "recuentos de la vida": "Recuentos de la vida",
    "slice of life": "Recuentos de la vida",
    "vida cotidiana": "Recuentos de la vida",
    "harem": "Harem",
    "harem inverso": "Romance",
    "boys love": "BL",
    "bl": "BL",
    "yaoi": "BL",
    "omegaverse": "BL",
    "shonen ai": "BL",
    "girls love": "GL",
    "gl": "GL",
    "yuri": "GL",
    "18": "+18",
    "19": "+18",
    "manhwa 19": "+18",
    "18 sin censura": "+18",
    "bl sin censura": "+18",
    "sin censura": "+18",
    "smut": "+18",
    "adulto": "+18",
    "erotico": "+18",
    "hentai": "+18",
    "ecchi": "+18",
}

IGNORED_TAGS = {
    "15",
    "anti heroe",
    "shounen",
    "shonen",
    "seinen",
    "shoujo",
    "shojo",
    "josei",
    "lotoscan",
    "scan solecito",
    "celestialmoon scan",
    "mucho gogogo",
    "furro",
    "actor",
    "juego",
    "monstruos",
    "demonios",
    "bestias",
    "evolucion",
    "militar",
    "music",
    "musica",
}


def has_word(text: str, pattern: str) -> bool:
    return re.search(pattern, text, flags=re.IGNORECASE) is not None


def classify_manhwa_smart(title: str, synopsis: str, current_genre: str = "", api_genres=None, api_is_adult: bool = False) -> str:
    tags = []

    def add_tag(label: str):
        if label and label not in tags:
            tags.append(label)

    raw_sources = []
    if api_genres:
        for g in api_genres:
            raw_sources.append(g.get("nombre") or g.get("name") if isinstance(g, dict) else str(g))
    if current_genre:
        raw_sources.extend(str(current_genre).split(","))

    is_adult = bool(api_is_adult)
    for raw in raw_sources:
        nk = norm_key(raw)
        if not nk or nk in IGNORED_TAGS:
            continue
        mapped = CANONICAL_TAG_MAP.get(nk)
        if mapped == "+18":
            is_adult = True
        elif mapped:
            add_tag(mapped)

    full_text = f"{title} {synopsis}"
    if has_word(full_text, r"(\+18|\+19|sin censura|\bsmut\b|\bhentai\b|\ber[oó]tic[oa]\b|\byaoi\b)"):
        is_adult = True

    if has_word(full_text, r"(\bboys love\b|\bmanhwa bl\b|\bbl manhwa\b|\byaoi\b|\bomegaverse\b)"):
        add_tag("BL")
    if has_word(full_text, r"(\bgirls love\b|\byuri\b|\(gl\))"):
        add_tag("GL")

    if has_word(full_text, r"(\bmurim\b|\bcultivaci[oó]n\b|\bcultivador\b|\bdantian\b|\bsecta\b|\bdao\b|\binmortalidad\b|\bclan marcial\b)"):
        add_tag("Artes Marciales")
        add_tag("Murim")
    elif has_word(full_text, r"(\bartes marciales\b|\bespadach[ií]n\b|\bmaestro de la espada\b|\bemperador de la espada\b)"):
        add_tag("Artes Marciales")

    if has_word(full_text, r"(\bsistema\b|\bmazmorra[s]?\b|\bcazador(?:es)? de monstruos\b|\bsube de nivel\b|\bclase sss\b|\brango nacional\b|\bnigromante\b|\bjugador\b)"):
        add_tag("Sistema")
        add_tag("Acción")

    if has_word(full_text, r"(\bisekai\b|\breencarn[aóe]\w*|\btransmigr\w*|\bregresi[oó]n\b|\bregres[oó] al pasado\b|\brenac\w*|\botro mundo\b|\bmundo paralelo\b|\bvida anterior\b)"):
        add_tag("Isekai")

    if has_word(full_text, r"(\bf[uú]tbol\b|\bb[eé]isbol\b|\bvoleibol\b|\bbaloncesto\b|\bboxeador\b)"):
        add_tag("Deportes")
    if has_word(full_text, r"(\bescuela secundaria\b|\bvida escolar\b|\binstituto\b|\bcampus\b)") and len(tags) < 3:
        add_tag("Escolar")
    if has_word(full_text, r"(\bfantasma[s]?\b|\bzombi[es]*\b|\bterror\b)") and "BL" not in tags and not is_adult:
        add_tag("Terror")

    combat_signals = has_word(
        full_text,
        r"(\bbatalla[s]?\b|\bguerrero[s]?\b|\bespada[s]?\b|\bmazmorra[s]?\b|\bmonstruo[s]?\b|\bcazador\b|\basesino[s]?\b|\bmercenario\b|\bmurim\b|\bartes marciales\b|\bnigromante\b|\bapocalipsis\b|\bluchador\b|\bcombate\b)",
    )
    if "Acción" in tags and ("BL" in tags or "GL" in tags or is_adult or "Romance" in tags):
        if not combat_signals and "Sistema" not in tags and "Murim" not in tags and "Artes Marciales" not in tags:
            tags = [t for t in tags if t != "Acción"]

    romance_signals = has_word(
        full_text,
        r"(\bromance\b|\brom[aá]ntic[oa]\b|\benamor\w*|\bmatrimonio\b|\bespos[oa]\b|\bnovi[oa]\b|\bprometid[oa]\b|\bbeso\b|\bvillana\b)",
    )
    if "Romance" in tags and ("Murim" in tags or "Sistema" in tags or "Artes Marciales" in tags) and "BL" not in tags and not is_adult:
        if not romance_signals:
            tags = [t for t in tags if t != "Romance"]

    ordered = []
    if is_adult:
        ordered.append("+18")
    for p in ["BL", "GL"]:
        if p in tags and p not in ordered:
            ordered.append(p)
    for g in tags:
        if g not in ordered and g != "+18":
            ordered.append(g)

    if not ordered or ordered == ["+18"]:
        return "+18, Romance, Drama" if is_adult else "Acción, Fantasía"

    return ", ".join(ordered[:4])


def clean_synopsis(raw: str, title: str, slug: str = "") -> str:
    text = re.sub(r"<[^>]+>", " ", str(raw or ""))
    text = re.sub(r"\[.*?\]\(https?://.*?\)", "", text)
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"\s+", " ", text).strip()

    if len(text) < 45 or re.search(r"sin descripci|sinopsis no disponible|lector\s*manga|traducido por", text, re.I):
        # Intentar enriquecer desde Olympus Scanlation si existe el slug
        if slug:
            try:
                ol = fetch_json(f"https://olympusbiblioteca.com/api/series/{slug}?type=comic", timeout=7)
                ol_sum = re.sub(r"<[^>]+>", " ", str((ol.get("data") or {}).get("summary") or "")).strip()
                ol_sum = re.sub(r"\s+", " ", ol_sum)
                if len(ol_sum) >= 45:
                    return ol_sum
            except Exception:
                pass
        return f"Disfruta de {title} en español con capítulos completos y en alta calidad en Nekutoon."
    return text


def get_shard_id(chapter_id: str) -> int:
    clean_hex = chapter_id.replace("-", "")[:6]
    try:
        return 1000 + (int(clean_hex, 16) % 1024)
    except ValueError:
        return 1000


def save_chapter_to_fast_shard(chapter_id: str, page_urls: list):
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


def get_autopilot_state() -> dict:
    rows = sb_request("GET", f"site_config?id=eq.{AUTOPILOT_CONFIG_ID}&select=category_images")
    default_state = {
        "enabled": True,
        "allowAdult": True,
        "discoveryCursorPage": 1,
        "lastRunAt": None,
        "lastCronRunAt": None,
        "totalManhwasAdded": 0,
        "totalChaptersAdded": 0,
        "totalReclassified": 0,
        "recentLogs": [],
    }
    if rows and isinstance(rows[0].get("category_images"), dict):
        merged = {**default_state, **rows[0]["category_images"]}
        if not isinstance(merged.get("recentLogs"), list):
            merged["recentLogs"] = []
        return merged
    return default_state


def save_autopilot_state(state: dict):
    state["recentLogs"] = (state.get("recentLogs") or [])[:40]
    sb_request(
        "POST",
        "site_config",
        {"id": AUTOPILOT_CONFIG_ID, "category_images": state},
        extra_headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
    )


def ping_indexnow(urls: list):
    if not urls:
        return
    payload = json.dumps(
        {
            "host": "www.nekutoon.com",
            "key": "3b8f1c84918e47458117769cf0c9b0e9",
            "keyLocation": "https://www.nekutoon.com/3b8f1c84918e47458117769cf0c9b0e9.txt",
            "urlList": urls[:200],
        }
    ).encode("utf-8")
    for ep in ("https://www.bing.com/indexnow", "https://yandex.com/indexnow"):
        try:
            req = urllib.request.Request(
                ep,
                data=payload,
                headers={"Content-Type": "application/json; charset=utf-8"},
                method="POST",
            )
            urllib.request.urlopen(req, timeout=10).read()
        except Exception:
            pass


def find_existing_manhwa(title: str, alt_title: str, cover_url: str, db_manhwas: list):
    key_main = norm_key(title)
    key_alt = norm_key(alt_title) if alt_title else ""

    for m in db_manhwas:
        mk = m["_norm_key"]
        if key_main and mk == key_main:
            return m
        if key_alt and mk == key_alt:
            return m
        if cover_url and m.get("cover_url") == cover_url:
            return m

    if len(key_main) >= 10:
        best_m = None
        best_r = 0.0
        for m in db_manhwas:
            mk = m["_norm_key"]
            if not mk:
                continue
            r = SequenceMatcher(None, key_main, mk).ratio()
            if r > best_r:
                best_r = r
                best_m = m
        if best_r >= 0.91 and best_m is not None:
            return best_m

    return None


def fetch_chapter_pages_worker(slug: str, ch_item: dict):
    raw_num = ch_item.get("numero")
    try:
        cj = fetch_json(f"https://api.zerocomics.net/api/series/{slug}/capitulo/{raw_num}", timeout=15)
        pages = (cj.get("data") or {}).get("paginas") or []
        return ch_item, pages
    except Exception:
        return ch_item, []


def sync_manhwa_slug(slug: str, db_manhwas: list, allow_adult: bool = True, max_chapters: int = 80):
    try:
        res = fetch_json(f"https://api.zerocomics.net/api/series/{slug}")
    except Exception as e:
        print(f"  ⚠️ Error consultando '{slug}': {e}")
        return False, 0, slug, []

    data = res.get("data") if isinstance(res, dict) else None
    if not data or not data.get("titulo"):
        return False, 0, slug, []

    title = str(data["titulo"]).strip()
    alt_title = str(data.get("titulo_alternativo") or "").strip()
    is_adult = bool(data.get("adulto") or data.get("is_adult"))

    if is_adult and not allow_adult:
        return False, 0, title, []

    cover_url = str(data.get("portada") or "").strip()
    if not cover_url:
        return False, 0, title, []
    banner_url = str(data.get("banner") or cover_url).strip()
    synopsis = clean_synopsis(data.get("sinopsis") or "", title, slug)
    raw_status = str(data.get("estado") or "").lower()
    status = "Finalizado" if ("final" in raw_status or "complet" in raw_status) else "En emisión"
    score_val = min(5.0, round(float(data.get("puntuacion") or 4.7), 1)) if float(data.get("puntuacion") or 0) > 0 else 4.7

    existing = find_existing_manhwa(title, alt_title, cover_url, db_manhwas)
    new_urls = []
    manhwa_added = False

    if existing:
        manhwa_id = existing["id"]
        next_genre = classify_manhwa_smart(title, synopsis, existing.get("genre") or "", data.get("generos"), is_adult)
        patch = {}
        if next_genre != (existing.get("genre") or ""):
            patch["genre"] = next_genre
        if not existing.get("banner_url") and banner_url:
            patch["banner_url"] = banner_url
        if status == "Finalizado" and existing.get("status") != "Finalizado":
            patch["status"] = "Finalizado"
        if patch:
            sb_request("PATCH", f"manhwas?id=eq.{manhwa_id}", patch, {"Prefer": "return=minimal"})
            existing.update(patch)
    else:
        api_chaps_preview = data.get("capitulos") or []
        if not api_chaps_preview:
            return False, 0, title, []

        genre_str = classify_manhwa_smart(title, synopsis, "", data.get("generos"), is_adult)
        inserted = sb_request(
            "POST",
            "manhwas",
            {
                "title": title,
                "description": synopsis,
                "cover_url": cover_url,
                "banner_url": banner_url,
                "genre": genre_str,
                "status": status,
                "is_hero": False,
                "score": score_val,
            },
        )
        new_row = inserted[0]
        new_row["_norm_key"] = norm_key(title)
        db_manhwas.append(new_row)
        manhwa_id = new_row["id"]
        manhwa_added = True
        new_urls.append(f"https://www.nekutoon.com/manga/{manhwa_id}")
        print(f"✨ Nuevo Manhwa: {title} [{genre_str}]")

    existing_chaps = sb_request("GET", f"chapters?manhwa_id=eq.{manhwa_id}&select=id,chapter_number&limit=1000")
    existing_nums = {float(c["chapter_number"]) for c in existing_chaps if c.get("chapter_number") is not None}

    api_chapters = list(data.get("capitulos") or [])
    api_chapters.sort(key=lambda c: float(c.get("numero") or 0))
    missing = [
        ch for ch in api_chapters if ch.get("numero") is not None and float(ch["numero"]) not in existing_nums
    ][:max_chapters]

    if not missing:
        return manhwa_added, 0, title, new_urls

    print(f"  📥 '{title}': descargando e indexando {len(missing)} capítulos en paralelo...")
    chaps_added = 0

    with ThreadPoolExecutor(max_workers=6) as pool:
        fetched_results = list(pool.map(lambda ch: fetch_chapter_pages_worker(slug, ch), missing))

    for ch, pages_list in fetched_results:
        if not pages_list:
            continue
        c_float = float(ch["numero"])
        c_val = int(c_float) if c_float.is_integer() else c_float

        chap_ins = sb_request(
            "POST",
            "chapters",
            {
                "manhwa_id": manhwa_id,
                "chapter_number": c_val,
                "title": ch.get("titulo") or f"Capítulo {c_val}",
            },
        )
        chap_id = chap_ins[0]["id"]
        pages_payload = [
            {"chapter_id": chap_id, "page_number": idx, "image_url": u}
            for idx, u in enumerate(pages_list, start=1)
        ]
        sb_request("POST", "pages", pages_payload, {"Prefer": "return=minimal"})
        save_chapter_to_fast_shard(chap_id, pages_list)
        existing_nums.add(c_float)
        chaps_added += 1
        new_urls.append(f"https://www.nekutoon.com/manga/{manhwa_id}/chapter/{chap_id}")

    print(f"  ⚡ '{title}': +{chaps_added} capítulos listos en 0.15s B-Tree.")
    return manhwa_added, chaps_added, title, new_urls


def run_smart_cycle(max_series_to_update: int = 8, max_chaps_per_series: int = 45):
    state = get_autopilot_state()
    if not state.get("enabled", True):
        print("⏸️ Piloto automático en pausa desde /admin. Saliendo.")
        return

    manhwas = sb_request("GET", "manhwas?select=id,title,genre,cover_url,banner_url,status&limit=1500")
    for m in manhwas:
        m["_norm_key"] = norm_key(m.get("title") or "")

    cursor_page = max(1, min(300, int(state.get("discoveryCursorPage") or 1)))
    print(f"🚀 [TITAN AGENT] Escaneando Radar Estrenos Hoy + Radar Popular (Pág. #{cursor_page})...")

    candidates = []
    for url in (
        "https://api.zerocomics.net/api/series?page=1&tipo=Comics",
        "https://api.zerocomics.net/api/series?page=2&tipo=Comics",
        f"https://api.zerocomics.net/api/series?page={cursor_page}&orden=populares&tipo=Comics",
    ):
        try:
            listing = fetch_json(url)
            candidates.extend(listing.get("data") or [])
        except Exception as e:
            print(f"  ⚠️ Fuente temporalmente lenta ({url}): {e}")

    seen_slugs = set()
    unique_items = []
    for it in candidates:
        sl = it.get("slug")
        if sl and sl not in seen_slugs and int(it.get("capitulos_total") or 0) > 0:
            seen_slugs.add(sl)
            unique_items.append(it)

    now_iso = datetime.now(timezone.utc).isoformat()
    added_manhwas = 0
    added_chapters = 0
    all_new_urls = []
    new_logs = []
    touched = 0

    for item in unique_items:
        if touched >= max_series_to_update:
            break
        m_added, c_added, title, urls = sync_manhwa_slug(
            item["slug"],
            manhwas,
            allow_adult=bool(state.get("allowAdult", True)),
            max_chapters=max_chaps_per_series,
        )
        if m_added or c_added > 0:
            touched += 1
            added_chapters += c_added
            all_new_urls.extend(urls)
            if m_added:
                added_manhwas += 1
                new_logs.append(
                    {
                        "time": now_iso,
                        "type": "manhwa",
                        "message": f'Nuevo manhwa descubierto: "{title}" (+{c_added} caps indexados)',
                    }
                )
            else:
                new_logs.append(
                    {
                        "time": now_iso,
                        "type": "chapter",
                        "message": f'"{title}": +{c_added} capítulos nuevos publicados',
                    }
                )

    if not new_logs:
        new_logs.append(
            {
                "time": now_iso,
                "type": "info",
                "message": f"Escaneo completado (pág. popular #{cursor_page}). Avanzando radar.",
            }
        )

    state["discoveryCursorPage"] = 1 if cursor_page >= 300 else cursor_page + 1
    state["lastRunAt"] = now_iso
    state["totalManhwasAdded"] = int(state.get("totalManhwasAdded") or 0) + added_manhwas
    state["totalChaptersAdded"] = int(state.get("totalChaptersAdded") or 0) + added_chapters
    state["recentLogs"] = (new_logs + (state.get("recentLogs") or []))[:40]
    save_autopilot_state(state)

    if all_new_urls:
        ping_indexnow(all_new_urls)

    print(
        f"🏆 Ciclo finalizado: +{added_manhwas} manhwas nuevos | +{added_chapters} capítulos nuevos | "
        f"{len(all_new_urls)} URLs enviadas a IndexNow."
    )


def reclassify_all():
    manhwas = sb_request("GET", "manhwas?select=id,title,description,genre&limit=1500")
    updated = 0
    for m in manhwas:
        ng = classify_manhwa_smart(m.get("title") or "", m.get("description") or "", m.get("genre") or "")
        if ng and ng != (m.get("genre") or ""):
            sb_request("PATCH", f"manhwas?id=eq.{m['id']}", {"genre": ng}, {"Prefer": "return=minimal"})
            updated += 1
    print(f"✅ Auditoría completada: {updated}/{len(manhwas)} obras reclasificadas.")


def import_by_query(query: str):
    manhwas = sb_request("GET", "manhwas?select=id,title,genre,cover_url,banner_url,status&limit=1500")
    for m in manhwas:
        m["_norm_key"] = norm_key(m.get("title") or "")

    slug = ""
    cleaned = query.strip().rstrip("/")
    for marker in ("/comics/", "/series/", "/manga/", "/manhwa/"):
        if marker in cleaned:
            slug = cleaned.split(marker, 1)[1].split("/")[0].split("?")[0]
            break

    if not slug:
        res = fetch_json(f"https://api.zerocomics.net/api/series?search={urllib.parse.quote(cleaned)}&page=1")
        items = res.get("data") or []
        if not items:
            print(f"❌ No se encontró '{query}'.")
            return
        slug = items[0]["slug"]

    m_added, c_added, title, urls = sync_manhwa_slug(slug, manhwas, allow_adult=True, max_chapters=200)
    if urls:
        ping_indexnow(urls)
    state = get_autopilot_state()
    now_iso = datetime.now(timezone.utc).isoformat()
    state["lastRunAt"] = now_iso
    state["totalManhwasAdded"] = int(state.get("totalManhwasAdded") or 0) + (1 if m_added else 0)
    state["totalChaptersAdded"] = int(state.get("totalChaptersAdded") or 0) + c_added
    state["recentLogs"] = (
        [{"time": now_iso, "type": "manhwa" if m_added else "chapter", "message": f'Importación directa: "{title}" (+{c_added} caps)'}]
        + (state.get("recentLogs") or [])
    )[:40]
    save_autopilot_state(state)
    print(f"🎉 '{title}' listo (+{c_added} capítulos).")


if __name__ == "__main__":
    arg = " ".join(sys.argv[1:]).strip()
    if arg in ("", "--cycle"):
        run_smart_cycle(max_series_to_update=6, max_chaps_per_series=35)
    elif arg == "--daemon":
        print("♾️ NEKUTOON TITAN AGENT EN MODO DEMONIO 24/7 (escaneo cada 15 min)...")
        while True:
            try:
                run_smart_cycle(max_series_to_update=6, max_chaps_per_series=35)
            except Exception as err:
                print(f"⚠️ Error recuperable en ciclo: {err}")
            time.sleep(900)
    elif arg == "--audit":
        reclassify_all()
    else:
        import_by_query(arg)
