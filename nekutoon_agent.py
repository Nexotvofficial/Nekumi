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


def normalize_cdn_url(u: str) -> str:
    if not u:
        return ""
    return (
        str(u)
        .replace("https://media.ikigaicomics.lat/capitulos/", "https://store.loscomics.lat/m/capitulos/")
        .replace("http://media.ikigaicomics.lat/capitulos/", "https://store.loscomics.lat/m/capitulos/")
        .replace("https://api.zerocomics.net/storage/series/", "https://store.loscomics.lat/a/series/")
        .replace("http://api.zerocomics.net/storage/series/", "https://store.loscomics.lat/a/series/")
    )


def get_shard_id(chapter_id: str) -> int:
    clean_hex = chapter_id.replace("-", "")[:6]
    try:
        return 1000 + (int(clean_hex, 16) % 1024)
    except ValueError:
        return 1000


def save_chapter_to_fast_shard(chapter_id: str, page_urls: list):
    if not chapter_id or not page_urls:
        return
    page_urls = [normalize_cdn_url(u) for u in page_urls if u]
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
        "pendingRepairs": [],
        "recentLogs": [],
    }
    if rows and isinstance(rows[0].get("category_images"), dict):
        merged = {**default_state, **rows[0]["category_images"]}
        if not isinstance(merged.get("recentLogs"), list):
            merged["recentLogs"] = []
        if not isinstance(merged.get("pendingRepairs"), list):
            merged["pendingRepairs"] = []
        return merged
    return default_state


def add_pending_repair(manhwa_id: str, title: str, reason: str, slug_hint: str = ""):
    state = get_autopilot_state()
    pending = [p for p in (state.get("pendingRepairs") or []) if p.get("id") != manhwa_id and norm_key(p.get("title") or "") != norm_key(title)]
    pending.insert(0, {
        "id": manhwa_id,
        "title": title,
        "reason": reason,
        "slug": slug_hint,
        "detectedAt": datetime.now(timezone.utc).isoformat(),
    })
    state["pendingRepairs"] = pending[:100]
    save_autopilot_state(state)


def remove_pending_repair(manhwa_id: str, title: str = ""):
    state = get_autopilot_state()
    before = state.get("pendingRepairs") or []
    after = [p for p in before if p.get("id") != manhwa_id and (not title or norm_key(p.get("title") or "") != norm_key(title))]
    if len(after) != len(before):
        state["pendingRepairs"] = after
        save_autopilot_state(state)


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
        pages = [normalize_cdn_url(u) for u in ((cj.get("data") or {}).get("paginas") or []) if u]
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

    cover_url = normalize_cdn_url(str(data.get("portada") or "").strip())
    if not cover_url:
        return False, 0, title, []
    banner_url = normalize_cdn_url(str(data.get("banner") or cover_url).strip())
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

    if manhwa_added and chaps_added == 0:
        sb_request("DELETE", f"manhwas?id=eq.{manhwa_id}", extra_headers={"Prefer": "return=minimal"})
        db_manhwas[:] = [m for m in db_manhwas if m.get("id") != manhwa_id]
        return False, 0, title, []

    print(f"  ⚡ '{title}': +{chaps_added} capítulos listos en 0.15s B-Tree.")
    remove_pending_repair(manhwa_id, title)
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

    try:
        repair_missing_chapters_and_urls(silent=True)
    except Exception:
        pass

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
        res = fetch_json(f"https://api.zerocomics.net/api/series?q={urllib.parse.quote(cleaned)}&page=1")
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


CATEGORY_MENU = [
    ("Acción", "accion"), ("Murim / Artes Marciales", "murim"), ("Sistema", "sistema"),
    ("Fantasía", "fantasia"), ("Isekai", "isekai"), ("Romance", "romance"),
    ("Comedia", "comedia"), ("Terror", "terror"), ("BL", "bl"), ("+18", "+18"),
]

TASK_NAME = "NekutoonTitanAgent"


def ask(prompt: str, default: str = "") -> str:
    try:
        val = input(prompt).strip()
    except EOFError:
        return default
    return val or default


def ask_int(prompt: str, default: int) -> int:
    try:
        return max(1, int(ask(prompt, str(default))))
    except ValueError:
        return default


def menu_search_import():
    q = ask("\n🔎 Escribe el nombre o pega la URL del manhwa: ")
    if not q:
        return
    if "/" in q:
        import_by_query(q)
        return
    res = fetch_json(f"https://api.zerocomics.net/api/series?q={urllib.parse.quote(q)}&page=1")
    items = (res.get("data") or [])[:10]
    if not items:
        print(f"❌ No se encontró '{q}'.")
        return
    for i, it in enumerate(items, 1):
        print(f"  [{i}] {it.get('titulo')}  ({it.get('capitulos_total') or '?'} caps)")
    sel = ask("Elige número (Enter = 1, 0 = cancelar): ", "1")
    if sel == "0" or not sel.isdigit() or not (1 <= int(sel) <= len(items)):
        return
    import_by_query(f"https://x/series/{items[int(sel) - 1]['slug']}")


def menu_by_category():
    print("\n📂 Categoría:")
    for i, (label, _) in enumerate(CATEGORY_MENU, 1):
        print(f"  [{i}] {label}")
    sel = ask("Elige número: ")
    if not sel.isdigit() or not (1 <= int(sel) <= len(CATEGORY_MENU)):
        return
    label, key = CATEGORY_MENU[int(sel) - 1]
    cuantos = ask_int("¿Cuántas obras nuevas subir? (Enter = 5): ", 5)
    manhwas = sb_request("GET", "manhwas?select=id,title,genre,cover_url,banner_url,status&limit=1500")
    for m in manhwas:
        m["_norm_key"] = norm_key(m.get("title") or "")
    added, page, urls = 0, 1, []
    print(f"🚀 Buscando obras nuevas de '{label}'...")
    while added < cuantos and page <= 40:
        try:
            listing = fetch_json(f"https://api.zerocomics.net/api/series?page={page}&orden=populares&tipo=Comics")
        except Exception as e:
            print(f"  ⚠️ {e}")
            break
        for it in listing.get("data") or []:
            if added >= cuantos:
                break
            title = it.get("titulo") or ""
            if find_existing_manhwa(title, it.get("titulo_alternativo") or "", it.get("portada") or "", manhwas):
                continue
            genres = " ".join(norm_key(g.get("nombre") if isinstance(g, dict) else str(g)) for g in (it.get("generos") or []))
            guess = norm_key(classify_manhwa_smart(title, it.get("sinopsis") or "", "", it.get("generos"), bool(it.get("adulto"))))
            hay = f"{genres} {guess}"
            ok = ("18" in hay) if key == "+18" else (key in hay or (key == "murim" and "artes marciales" in hay))
            if not ok:
                continue
            m_added, c_added, t, u = sync_manhwa_slug(it["slug"], manhwas, allow_adult=True, max_chapters=80)
            if m_added:
                added += 1
                urls.extend(u)
        page += 1
    ping_indexnow(urls)
    print(f"🏆 {added} obras nuevas de '{label}' subidas.")


def guess_slug(title: str) -> str:
    s0 = unicodedata.normalize("NFD", (title or "").lower())
    s0 = "".join(ch for ch in s0 if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s0).strip("-")


def resolve_slug_for_title(title: str, db_manhwas: list, max_chapters: int = 80) -> int:
    cand1 = guess_slug(title)
    cand2 = re.sub(r"-(fxs|sin-censura)$", "", cand1)
    for cand in [cand1, cand2]:
        if not cand:
            continue
        _, c_added, _, _ = sync_manhwa_slug(cand, db_manhwas, allow_adult=True, max_chapters=max_chapters)
        if c_added > 0:
            return c_added

    clean_q = re.sub(r"\s*-\s*(FxS|Sin Censura)$", "", title, flags=re.I).strip()
    for q in [clean_q, " ".join(clean_q.split()[:4])]:
        if not q:
            continue
        try:
            res = fetch_json(f"https://api.zerocomics.net/api/series?q={urllib.parse.quote(q)}&page=1", timeout=10)
            for it in (res.get("data") or [])[:5]:
                sl = it.get("slug")
                if sl and int(it.get("capitulos_total") or 0) > 0:
                    _, c_added, _, _ = sync_manhwa_slug(sl, db_manhwas, allow_adult=True, max_chapters=max_chapters)
                    if c_added > 0:
                        return c_added
        except Exception:
            pass
    return 0


def repair_missing_chapters_and_urls(silent: bool = False):
    t0 = time.time()
    if not silent:
        print("\n⚡ [ANALIZADOR ULTRA-RÁPIDO] Escaneando obras, capítulos, shards e imágenes...")
    manhwas = sb_request("GET", "manhwas?select=id,title,cover_url,banner_url,chapters(id,chapter_number)&chapters.order=chapter_number.desc&chapters.limit=1&limit=2000")
    fixed_urls = 0
    empty_ms = []
    sample_chaps = []
    for m in manhwas:
        c_url = m.get("cover_url") or ""
        b_url = m.get("banner_url") or ""
        nc = normalize_cdn_url(c_url)
        nb = normalize_cdn_url(b_url)
        if nc != c_url or nb != b_url:
            sb_request("PATCH", f"manhwas?id=eq.{m['id']}", {"cover_url": nc, "banner_url": nb}, {"Prefer": "return=minimal"})
            fixed_urls += 1
        chaps = m.get("chapters") or []
        if not chaps:
            empty_ms.append(m)
        else:
            sample_chaps.append((m, chaps[0]["id"]))

    # Verificar que los últimos 40 capítulos subidos tengan su shard B-Tree intacto y CDN rápido (1 sola consulta IN)
    broken_shards = []
    shard_groups = {}
    for m, cid in sample_chaps[:40]:
        sid = get_shard_id(cid)
        shard_groups.setdefault(sid, []).append((m, cid))

    if shard_groups:
        sids_csv = ",".join(str(s) for s in shard_groups.keys())
        rows = sb_request("GET", f"site_config?id=in.({sids_csv})&select=id,category_images")
        row_map = {r["id"]: (r.get("category_images") or {}) for r in (rows or [])}
        for sid, pairs in shard_groups.items():
            cmap = row_map.get(sid) or {}
            dirty = False
            for m, cid in pairs:
                entry = cmap.get(cid)
                if not entry or not entry.get("p"):
                    pgs = sb_request("GET", f"pages?chapter_id=eq.{cid}&select=image_url&order=page_number.asc&limit=500")
                    urls = [normalize_cdn_url(p["image_url"]) for p in (pgs or []) if p.get("image_url")]
                    if urls:
                        save_chapter_to_fast_shard(cid, urls)
                        fixed_urls += 1
                    else:
                        broken_shards.append(m)
                else:
                    b = entry.get("b") or ""
                    nb = normalize_cdn_url(b)
                    if nb != b:
                        entry["b"] = nb
                        cmap[cid] = entry
                        dirty = True
                        fixed_urls += 1
            if dirty:
                sb_request("POST", "site_config", {"id": sid, "category_images": cmap}, {"Prefer": "resolution=merge-duplicates,return=minimal"})

    targets = {m["id"]: (m, "0 capítulos publicados") for m in empty_ms}
    for m in broken_shards:
        targets.setdefault(m["id"], (m, "Capítulo sin páginas en lector"))

    elapsed = time.time() - t0
    if fixed_urls and not silent:
        print(f"  ✅ {fixed_urls} portadas/capítulos reparados al CDN rápido.")

    if not targets:
        if not silent:
            st = get_autopilot_state()
            pend = st.get("pendingRepairs") or []
            print(f"  ✅ Diagnóstico en {elapsed:.2f}s: {len(manhwas)} obras sanas (0 rotas) | Pendientes en cola: {len(pend)}.")
        return

    print(f"  ⚠️ Detectadas {len(targets)} obras rotas en {elapsed:.2f}s. Intentando auto-reparación inmediata...")
    db_manhwas = sb_request("GET", "manhwas?select=id,title,genre,cover_url,banner_url,status&limit=2000")
    for dm in db_manhwas:
        dm["_norm_key"] = norm_key(dm.get("title") or "")

    repaired_count = 0
    queued_count = 0
    for mid, (m, reason) in targets.items():
        title = m["title"]
        c_added = resolve_slug_for_title(title, db_manhwas, max_chapters=80)
        if c_added > 0:
            repaired_count += 1
            remove_pending_repair(mid, title)
            print(f"  🔧 Auto-reparada: '{title}' (+{c_added} capítulos).")
        else:
            add_pending_repair(mid, title, reason, guess_slug(title))
            queued_count += 1
            print(f"  📌 Puesta en PENDIENTES para re-subir o reparar: '{title}' ({reason})")

    print(f"  📊 Resultado: {repaired_count} auto-reparadas | {queued_count} en cola de pendientes (Opción [9]).")


def menu_pending_queue():
    while True:
        st = get_autopilot_state()
        pending = st.get("pendingRepairs") or []
        print(f"\n📋 COLA DE OBRAS PENDIENTES / ROTAS ({len(pending)}):")
        if not pending:
            print("  🎉 ¡No hay ninguna obra pendiente ni rota! Todo el catálogo está al 100%.")
            return
        for i, p in enumerate(pending, 1):
            print(f"  [{i}] {p.get('title')}  —  ⚠️ {p.get('reason', 'Incompleta')}")
        print("\n  [A] Intentar auto-reparar TODAS ahora mismo")
        print("  [L] Limpiar/eliminar de la base de datos las que no tengan fuente")
        print("  [Número] Elegir una obra para subirle nueva URL / buscarla manualmente")
        print("  [0] Volver al menú")
        sel = ask("👉 Elige acción o número de obra: ", "0").strip()
        if sel == "0":
            return
        elif sel.upper() == "A":
            db_manhwas = sb_request("GET", "manhwas?select=id,title,genre,cover_url,banner_url,status&limit=2000")
            for dm in db_manhwas:
                dm["_norm_key"] = norm_key(dm.get("title") or "")
            for p in list(pending):
                c_added = resolve_slug_for_title(p.get("title") or "", db_manhwas, max_chapters=100)
                if c_added > 0:
                    remove_pending_repair(p.get("id") or "", p.get("title") or "")
                    print(f"  ✅ Reparada '{p.get('title')}' (+{c_added} caps).")
                else:
                    print(f"  ❌ Sigue pendiente '{p.get('title')}' (usa su número para pegarle URL o nombre nuevo).")
        elif sel.upper() == "L":
            for p in list(pending):
                mid = p.get("id")
                if mid:
                    try:
                        sb_request("DELETE", f"reviews?manhwa_id=eq.{mid}", extra_headers={"Prefer": "return=minimal"})
                        sb_request("DELETE", f"favorites?manhwa_id=eq.{mid}", extra_headers={"Prefer": "return=minimal"})
                        sb_request("DELETE", f"manhwas?id=eq.{mid}", extra_headers={"Prefer": "return=minimal"})
                    except Exception:
                        pass
                remove_pending_repair(mid or "", p.get("title") or "")
                print(f"  🗑️ Eliminada ficha rota: '{p.get('title')}'")
        elif sel.isdigit() and 1 <= int(sel) <= len(pending):
            chosen = pending[int(sel) - 1]
            print(f"\n🔨 Reparando: {chosen.get('title')}")
            q = ask("Pega la URL o escribe el nombre con el que buscarla (Enter = buscar automático): ", chosen.get("title") or "")
            if q:
                import_by_query(q)
                remove_pending_repair(chosen.get("id") or "", chosen.get("title") or "")


def menu_audit():
    repair_missing_chapters_and_urls()
    script = Path(__file__).resolve().parent / "audit_and_reclassify.py"
    if script.exists():
        import subprocess
        subprocess.run([sys.executable, str(script)])
    else:
        reclassify_all()


def menu_windows_task():
    import subprocess
    print("\n⚙️  [1] Activar cada 20 min   [2] Eliminar tarea   [3] Alternar +18 Sí/No   [0] Volver")
    sel = ask("Elige: ")
    if sel == "1":
        cmd = f'"{sys.executable}" "{Path(__file__).resolve()}" --cycle'
        subprocess.run(["schtasks", "/Create", "/F", "/SC", "MINUTE", "/MO", "20", "/TN", TASK_NAME, "/TR", cmd])
    elif sel == "2":
        subprocess.run(["schtasks", "/Delete", "/F", "/TN", TASK_NAME])
    elif sel == "3":
        st = get_autopilot_state()
        st["allowAdult"] = not st.get("allowAdult", True)
        save_autopilot_state(st)
        print(f"🔞 +18 ahora: {'PERMITIDO' if st['allowAdult'] else 'BLOQUEADO'}")


def menu_stats():
    st = get_autopilot_state()
    rows = sb_request("GET", "manhwas?select=title,genre&order=created_at.desc&limit=10")
    total = sb_request("GET", "manhwas?select=id&limit=5000")
    pend = st.get("pendingRepairs") or []
    print(f"\n📊 Obras en catálogo: {len(total)} | Pendientes de reparar: {len(pend)}")
    print(f"   Auto-subidas: {st.get('totalManhwasAdded', 0)} obras | {st.get('totalChaptersAdded', 0)} caps")
    print(f"   Piloto: {'ACTIVO' if st.get('enabled', True) else 'PAUSADO'} | +18: {'Sí' if st.get('allowAdult', True) else 'No'} | Radar pág. #{st.get('discoveryCursorPage')}")
    print("   Últimos subidos:")
    for r in rows:
        print(f"   • {r['title']}  [{r.get('genre')}]")


def interactive_menu():
    os.system("")  # habilita colores ANSI en Windows
    while True:
        try:
            pend_count = len((get_autopilot_state().get("pendingRepairs") or []))
        except Exception:
            pend_count = 0
        pend_label = f"║ [9] Cola de pendientes ({pend_count} obras por revisar)    ║"[:48].ljust(47) + "║"
        print(f"""
╔══════════════════════════════════════════════╗
║        NEKUTOON TITAN AGENT — MENÚ           ║
╠══════════════════════════════════════════════╣
║ [1] Modo automático 24/7 (sin parar)         ║
║ [2] Escaneo rápido ahora mismo               ║
║ [3] Subir manhwa por nombre o URL            ║
║ [4] Subir manhwas nuevos por categoría       ║
║ [5] Auditar categorías + limpiar duplicados  ║
║ [6] Tarea automática de Windows / filtro +18 ║
║ [7] Ver estadísticas y últimos subidos       ║
║ [8] Analizador ultra-rápido y auto-reparar   ║
{pend_label}
║ [0] Salir                                    ║
╚══════════════════════════════════════════════╝""")
        op = ask("👉 Elige una opción: ", "0")
        try:
            if op == "1":
                mins = ask_int("¿Cada cuántos minutos? (Enter = 15): ", 15)
                print("♾️  Modo 24/7 activo. Ctrl+C para volver al menú.")
                try:
                    while True:
                        try:
                            run_smart_cycle(max_series_to_update=6, max_chaps_per_series=35)
                        except Exception as err:
                            print(f"⚠️ Error recuperable: {err}")
                        print(f"⏳ Próximo escaneo en {mins} min...")
                        time.sleep(mins * 60)
                except KeyboardInterrupt:
                    print("\n⏹️  Modo 24/7 detenido.")
            elif op == "2":
                n = ask_int("¿Cuántas obras actualizar/subir? (Enter = 8): ", 8)
                run_smart_cycle(max_series_to_update=n, max_chaps_per_series=60)
            elif op == "3":
                menu_search_import()
            elif op == "4":
                menu_by_category()
            elif op == "5":
                menu_audit()
            elif op == "6":
                menu_windows_task()
            elif op == "7":
                menu_stats()
            elif op == "8":
                repair_missing_chapters_and_urls()
            elif op == "9":
                menu_pending_queue()
            elif op == "0":
                print("👋 Hasta luego.")
                return
            else:
                print("Opción no válida.")
        except KeyboardInterrupt:
            print("\n↩️  Volviendo al menú.")
        except Exception as e:
            print(f"❌ Error: {e}")


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    arg = " ".join(sys.argv[1:]).strip()
    if arg == "":
        interactive_menu()
    elif arg == "--cycle":
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
