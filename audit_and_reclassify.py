#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Audit, deduplicate, fix mojibake/garbage synopses, and accurately reclassify
every single manhwa in Nekutoon's Supabase database.
"""

import json
import os
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

REPO_DIR = Path(r"C:\Users\Administrator\.gemini\antigravity\scratch\Nekumi")
ENV_PATH = REPO_DIR / ".env.local"

env = {}
if ENV_PATH.exists():
    for line in ENV_PATH.read_text(encoding="utf-8", errors="ignore").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()

SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL", "https://nfuvrtlhkvprjpzeepim.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or env["SUPABASE_SERVICE_ROLE_KEY"]

SB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

WEB_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NekutoonClassifier/3.0",
    "Accept": "application/json",
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
            time.sleep(0.5 * (attempt + 1))


def norm_key(text: str) -> str:
    if not text:
        return ""
    s = unicodedata.normalize("NFD", str(text).lower())
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    return re.sub(r"\s+", " ", s)


def fix_mojibake(text: str) -> str:
    if not text:
        return ""
    if "Ã" in text or "Â" in text:
        try:
            fixed = text.encode("latin-1").decode("utf-8")
            return fixed
        except Exception:
            pass
    replacements = {
        "Ã¡": "á",
        "Ã©": "é",
        "Ã­": "í",
        "Ã³": "ó",
        "Ãº": "ú",
        "Ã±": "ñ",
        "Ã\x81": "Á",
        "Ã\x89": "É",
        "Ã\x8d": "Í",
        "Ã\x93": "Ó",
        "Ã\x9a": "Ú",
        "Ã\x91": "Ñ",
        "&mdash;": "—",
        "&quot;": '"',
        "&#039;": "'",
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text


# Trash / scanlator / demographic / raw English tags mapping -> Canonical Nekutoon Spanish Genres
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

# Tags to discard completely (scanlator watermarks, age-15 rating, generic filler)
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

# Verified false +18 SFW works that must NEVER be tagged +18
FORCE_SFW_KEYS = {
    norm_key("El primer chef de artes marciales"),
    norm_key('Genkai Shuuraku wo Datsu Shita Renkinjutsushi, Tokai de "Saikyou" nano ga Baremakuru. ~Rougai domo ni wa Iikagen Aiso ga Tsukimashita~'),
    norm_key("mientras mis discípulos se matan entrenando yo descanso"),
    norm_key("Realmente no soy el hijo del destino"),
}

# Explicit surgical overrides for titles with missing/misleading synopses or famous misclassification
EXACT_GENRE_OVERRIDES = {
    norm_key("Academia sexual"): "+18, Romance, Escolar, Comedia",
    norm_key("Tutoría Intima"): "+18, Romance, Drama",
    norm_key("Tu novia esta buena"): "+18, Romance, Drama",
    norm_key("¡Me Encanta La Gacha!"): "+18, Fantasía, Harem, Comedia",
    norm_key("El regreso del prodigio"): "+18, Drama, Romance",
    norm_key("No Moral"): "+18, BL, Romance, Drama",
    norm_key("La concubina del rey"): "+18, BL, Histórico, Drama",
    norm_key("Préstame un Poco de Azúcar -FxS"): "+18, BL, Romance, Comedia",
    norm_key("Espiral perfecta"): "+18, BL, Deportes, Romance",
    norm_key("Jinx"): "+18, BL, Deportes, Drama",
    norm_key("Codename Anastasia"): "+18, BL, Acción, Psicológico",
    norm_key("Rosas Y Champaña"): "+18, BL, Acción, Drama",
    norm_key("La granja del señor A"): "+18, BL, Fantasía, Drama",
    norm_key("Oh! Mi asistente"): "+18, BL, Romance, Comedia",
    norm_key("¿Quieres que te escriba una carta de amor?"): "+18, BL, Isekai, Romance",
    norm_key("Ácido o Amargo"): "+18, BL, Romance, Comedia",
    norm_key("Arts Manz"): "+18, BL, Drama, Romance",
    norm_key("Besame si puedes"): "+18, BL, Romance, Drama",
    norm_key("Kiss Me if You Can"): "+18, BL, Romance, Drama",
    norm_key("El chico durazno"): "+18, BL, Fantasía, Romance",
    norm_key("El compañero de cuarto que solo yo no conozco"): "+18, BL, Romance, Escolar",
    norm_key("El Maestro De Los Siervos Del Otro Mundo"): "+18, BL, Isekai, Fantasía",
    norm_key("El Proyecto Huevo"): "+18, BL, Comedia, Romance",
    norm_key("Flor de ciruelo nevada"): "+18, BL, Histórico, Drama",
    norm_key("Heridas del tercer piso"): "+18, BL, Drama, Romance",
    norm_key("La méche"): "+18, BL, Drama, Romance",
    norm_key("Los secretos de los hermanos de la familia noble"): "+18, BL, Drama, Comedia",
    norm_key("Pecados carnales SIN CENSURA"): "+18, BL, Histórico, Drama",
    norm_key("psique"): "+18, BL, Fantasía, Drama",
    norm_key("Zosan, sexo en el barco"): "+18, BL, Romance, Drama",
    norm_key("Amor No Correspondido"): "BL, Romance, Drama",
    norm_key("Como cuidar a un buho del bosque"): "BL, Fantasía, Romance, Comedia",
    norm_key("El Perro Mapache y el Zorro"): "BL, Romance, Fantasía, Comedia",
    norm_key("Me Convertí En El Objetivo de Afecto de mi Rival - FxS"): "BL, Romance, Comedia, Drama",
    norm_key("No hay mañana"): "BL, Romance, Drama",
    norm_key("Love Round!!"): "BL, Deportes, Romance, Comedia",
    norm_key("Casi accidente"): "BL, Acción, Romance, Drama",
    norm_key("Hikaru ga Shinda Natsu"): "Terror, Misterio, Sobrenatural, Psicológico",
    norm_key("Murderer Lewellyn's Enchanting Dinner Invitation"): "BL, Psicológico, Misterio, Drama",
    norm_key("Apareamiento De Elfos"): "+18, Fantasía, Romance, Comedia",
    norm_key("Cómo conquistar un amor no correspondido - Sin Censura"): "+18, Romance, Drama, Comedia",
    norm_key("Dulce de menta - Sin Censura"): "+18, Romance, Drama",
    norm_key("En busca de mi ángel"): "+18, Romance, Drama",
    norm_key("La dulce venganza de mi adorable esposa"): "+18, Romance, Drama",
    norm_key("Paseo Nocturno"): "+18, Histórico, Romance, Drama",
    norm_key("Freelancer"): "+18, Drama, Romance",
    norm_key("murmur"): "+18, GL, Romance, Drama",
    norm_key("Safe Haven (GL)"): "GL, Romance, Drama",
    norm_key("VERANO"): "GL, Romance, Escolar, Recuentos de la vida",
    norm_key("Yuri Love Slave Futari Dake No Houkago"): "+18, GL, Escolar, Drama",
    norm_key("Cómo Sobrevivir Como La Esposa Del Duque Monstruoso"): "Romance, Fantasía, Isekai, Comedia",
    norm_key("Este matrimonio definitivamente tendrá exito"): "Romance, Fantasía, Isekai, Drama",
    norm_key("Formación del príncipe heredero"): "Romance, Fantasía, Comedia, Histórico",
    norm_key("Se busca esposo por contrato para la villana"): "Romance, Fantasía, Isekai, Comedia",
    norm_key("Sobreviviendo en una novela de fantasía romantica"): "Isekai, Fantasía, Romance, Comedia",
    norm_key("Los principios de Serim"): "Romance, Drama, Escolar",
    norm_key("Noches Superpuestas"): "Romance, Drama",
    norm_key("The Jinx's Lover"): "Romance, Fantasía, Comedia, Drama",
    norm_key("PRINCE, DON'T DO THIS!"): "Romance, Histórico, Comedia, Drama",
    norm_key("Chasing Star Moon"): "Romance, Drama, Recuentos de la vida",
    norm_key("Manual de Reeducación de Damas Nobles"): "Fantasía, Comedia, Drama",
    norm_key("GTO: Great Teacher Onizuka"): "Comedia, Escolar, Drama, Acción",
    norm_key("La guía del ranker para vivir bien"): "Acción, Fantasía, Sistema, Aventura",
    norm_key("Un genio del futbol"): "Deportes, Drama, Sistema",
    norm_key("¡A por la pelota en el estadio!"): "Deportes, Comedia, Drama",
    norm_key("¡¡Haikyu!! -¡Oye, Kageyama! (Doujinshi)"): "Deportes, Romance, Comedia",
    norm_key("¡Bocchi the Rock! Gaiden꞉ Hiroi Kikuri no Fukazake Nikki"): "Comedia, Recuentos de la vida",
    norm_key("¡ Angel al lado !"): "Romance, Comedia, Escolar, Recuentos de la vida",
    norm_key("!Soy El único Que Puedo Verlo!"): "Romance, Escolar, Drama, Sobrenatural",
    norm_key("Me vi envuelto en una historia de fantasmas, pero aun así tengo que trabajar"): "Terror, Misterio, Sobrenatural, Fantasía",
    norm_key("Zom 100꞉ Zombie ni Naru made ni Shitai 100 no Koto"): "Acción, Comedia, Apocalíptico, Aventura",
    norm_key("Tomb Raider king"): "Acción, Fantasía, Aventura, Sistema",
    norm_key("Solo Leveling"): "Acción, Fantasía, Sistema, Aventura",
    norm_key("Solo Leveling Ragnarok"): "Acción, Fantasía, Sistema, Aventura",
    norm_key("El Herrero Genio del Juego"): "Acción, Fantasía, Sistema, Aventura",
    norm_key("La evolución de la serpiente inmortal"): "Acción, Fantasía, Aventura, Artes Marciales",
    norm_key("¡El Camino Supremo!"): "Acción, Artes Marciales, Murim, Fantasía",
    norm_key("¡El Heroe De Nivel Maximo Ha Regresado!"): "Acción, Fantasía, Isekai, Sistema",
    norm_key("¡Me convertí en el villano de mi videojuego!"): "Acción, Fantasía, Isekai, Sistema",
    norm_key("¡Capitan!¿Es este el campo de batalla？"): "Acción, Drama, Aventura",
    norm_key("El Genio entrenador de artes marciales"): "Acción, Artes Marciales, Murim, Sistema",
    norm_key("La Regresión 100 Del Jugador De Nivel Máximo"): "Acción, Fantasía, Isekai, Sistema",
    norm_key("Regresión del heredero del clan Yong"): "Acción, Artes Marciales, Murim, Isekai",
    norm_key("Nueva Vida del Jugador"): "Acción, Fantasía, Isekai, Sistema",
    norm_key("El Regreso del Jugador"): "Acción, Fantasía, Isekai, Sistema",
    norm_key("El jugador que regreso 10000 años despues"): "Acción, Fantasía, Isekai, Sistema",
    norm_key("El jugador del Rey Demonio que regresa de la muerte"): "Acción, Fantasía, Isekai, Sistema",
    norm_key("Grupo de Estudio"): "Acción, Escolar, Artes Marciales, Comedia",
    norm_key("Hectopascal"): "Acción, Escolar, Drama, Artes Marciales",
    norm_key("Deuda de Sangre"): "Acción, Escolar, Drama",
    norm_key("El primer chef de artes marciales"): "Acción, Artes Marciales, Murim, Comedia",
    norm_key('Genkai Shuuraku wo Datsu Shita Renkinjutsushi, Tokai de "Saikyou" nano ga Baremakuru. ~Rougai domo ni wa Iikagen Aiso ga Tsukimashita~'): "Fantasía, Aventura, Comedia",
    norm_key("mientras mis discípulos se matan entrenando yo descanso"): "Acción, Artes Marciales, Murim, Comedia",
    norm_key("Realmente no soy el hijo del destino"): "Acción, Fantasía, Artes Marciales, Sistema",
}


def has_word(text: str, pattern: str) -> bool:
    return re.search(pattern, text, flags=re.IGNORECASE) is not None


def classify_manhwa_smart(title: str, synopsis: str, current_genre: str, api_genres=None, api_is_adult=False) -> str:
    t_key = norm_key(title)
    if t_key in EXACT_GENRE_OVERRIDES:
        return EXACT_GENRE_OVERRIDES[t_key]

    tags = []

    def add_tag(label: str):
        if label and label not in tags:
            tags.append(label)

    # 1. Parse existing + API genres via canonical map
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
    title_low = title.lower()

    # Check explicit adult markers in title/synopsis (strict word boundaries, never matching 'joven maduro')
    if has_word(full_text, r"(\+18|\+19|sin censura|\bsmut\b|\bhentai\b|\ber[oó]tic[oa]\b|\byaoi\b)"):
        is_adult = True

    if t_key in FORCE_SFW_KEYS:
        is_adult = False

    # Detect BL / GL strictly
    if has_word(full_text, r"(\bboys love\b|\bmanhwa bl\b|\bbl manhwa\b|\byaoi\b|\bomegaverse\b|\balfa\b.*\bomega\b|\bomega\b.*\balfa\b)"):
        add_tag("BL")
    if has_word(full_text, r"(\bgirls love\b|\byuri\b|\(gl\))"):
        add_tag("GL")

    # Detect Murim / Artes Marciales
    if has_word(full_text, r"(\bmurim\b|\bcultivaci[oó]n\b|\bcultivador\b|\bdantian\b|\bsecta\b|\bdao\b|\binmortalidad\b|\bclan marcial\b)"):
        add_tag("Artes Marciales")
        add_tag("Murim")
    elif has_word(full_text, r"(\bartes marciales\b|\bespadach[ií]n\b|\bmaestro de la espada\b|\bemperador de la espada\b)"):
        add_tag("Artes Marciales")

    # Detect Sistema (Hunters, Dungeons, Levels, Game Window)
    if has_word(full_text, r"(\bsistema\b|\bmazmorra[s]?\b|\bcazador(?:es)? de monstruos\b|\bsube de nivel\b|\bclase sss\b|\brango nacional\b|\bnigromante\b|\bjugador\b)"):
        add_tag("Sistema")
        if "Acción" not in tags:
            add_tag("Acción")

    # Detect Isekai / Reencarnación / Regresión (NEVER matching 'adaptado de la novela' or 'regreso a casa')
    if has_word(full_text, r"(\bisekai\b|\breencarn[aóe]\w*|\btransmigr\w*|\bregresi[oó]n\b|\bregres[oó] al pasado\b|\brenac\w*|\botro mundo\b|\bmundo paralelo\b|\bvida anterior\b|\bvuelv[eo] al pasado\b)"):
        add_tag("Isekai")

    # Detect Deportes / Escolar / Terror
    if has_word(full_text, r"(\bf[uú]tbol\b|\bb[eé]isbol\b|\bvoleibol\b|\bbaloncesto\b|\bboxeador\b|\bmariscal de campo\b)"):
        add_tag("Deportes")
    if has_word(full_text, r"(\bescuela secundaria\b|\bvida escolar\b|\binstituto\b|\bcampus\b|\bestudiante de secundaria\b)"):
        if len(tags) < 3:
            add_tag("Escolar")
    if has_word(full_text, r"(\bfantasma[s]?\b|\bzombi[es]*\b|\bmaldici[oó]n\b.*\bpesadilla\b|\bterror\b)"):
        if "BL" not in tags and "+18" not in tags:
            add_tag("Terror")

    # Remove bogus 'Acción' if work is BL / GL / Romance / +18 and has ZERO combat/dungeon/martial signals
    combat_signals = has_word(
        full_text,
        r"(\bbatalla[s]?\b|\bguerrero[s]?\b|\bespada[s]?\b|\bmazmorra[s]?\b|\bmonstruo[s]?\b|\bcazador\b|\basesino[s]?\b|\bmercenario\b|\bmurim\b|\bartes marciales\b|\bnigromante\b|\bapocalipsis\b|\bluchador\b|\bcombate\b)",
    )
    if "Acción" in tags and ("BL" in tags or "GL" in tags or is_adult or "Romance" in tags):
        if not combat_signals and "Sistema" not in tags and "Murim" not in tags and "Artes Marciales" not in tags:
            tags = [t for t in tags if t != "Acción"]

    # Remove bogus 'Romance' if work is pure Dungeon/Murim Action without romantic plot
    romance_signals = has_word(
        full_text,
        r"(\bromance\b|\brom[aá]ntic[oa]\b|\benamor\w*|\bmatrimonio\b|\bespos[oa]\b|\bnovi[oa]\b|\bprometid[oa]\b|\bamor no correspondido\b|\bbeso\b|\bcita[s]?\b|\bvillana\b)",
    )
    if "Romance" in tags and ("Murim" in tags or "Sistema" in tags or "Artes Marciales" in tags) and "BL" not in tags and not is_adult:
        if not romance_signals:
            tags = [t for t in tags if t != "Romance"]

    # Put +18 first if adult, BL second if BL
    ordered = []
    if is_adult:
        ordered.append("+18")
    for priority_g in ["BL", "GL"]:
        if priority_g in tags and priority_g not in ordered:
            ordered.append(priority_g)
    for g in tags:
        if g not in ordered and g != "+18":
            ordered.append(g)

    if not ordered or ordered == ["+18"]:
        if is_adult:
            ordered = ["+18", "Romance", "Drama"]
        else:
            ordered = ["Acción", "Fantasía"]

    return ", ".join(ordered[:4])


def is_bad_synopsis(desc: str, title: str) -> bool:
    if not desc or len(desc.strip()) < 45:
        return True
    low = desc.lower()
    bad_markers = [
        "sin descripción",
        "sin descripcion",
        "sinopsis no disponible",
        "información no completada",
        "lector manga",
        "lectormanga",
        "traducido por",
        "descubre esta apasionante historia",
        "source for below information: anilist",
        "pairing: kageyama",
        "a boxer with a killer fist",
        "at a young age, little bella",
        "erika lies to her friends",
    ]
    return any(m in low for m in bad_markers)


def search_zerocomics_metadata(title: str):
    q = re.sub(r"[¡!¿?꞉:\(\)\[\]]+", " ", title).strip()
    q_words = " ".join(q.split()[:5])
    if len(q_words) < 3:
        return None
    url = f"https://api.zerocomics.net/api/series?search={urllib.parse.quote(q_words)}&page=1"
    try:
        req = urllib.request.Request(url, headers=WEB_HEADERS)
        data = json.loads(urllib.request.urlopen(req, timeout=10).read().decode("utf-8"))
        t_norm = norm_key(title)
        for item in data.get("data") or []:
            it_norm = norm_key(item.get("titulo") or "")
            alt_norm = norm_key(item.get("titulo_alternativo") or "")
            if it_norm == t_norm or (alt_norm and alt_norm == t_norm):
                return item
    except Exception:
        pass
    return None


def merge_duplicate_pair(primary_id: str, dup_id: str, chaps_by_manhwa: dict):
    p_chaps = chaps_by_manhwa.get(primary_id, [])
    d_chaps = chaps_by_manhwa.get(dup_id, [])
    p_nums = {float(c["chapter_number"]) for c in p_chaps if c.get("chapter_number") is not None}

    moved = 0
    for dc in d_chaps:
        cnum = float(dc["chapter_number"]) if dc.get("chapter_number") is not None else -1
        if cnum >= 0 and cnum not in p_nums:
            sb_request("PATCH", f"chapters?id=eq.{dc['id']}", {"manhwa_id": primary_id}, {"Prefer": "return=minimal"})
            p_nums.add(cnum)
            moved += 1
        else:
            sb_request("PATCH", f"chapters?id=eq.{dc['id']}", {"manhwa_id": None}, {"Prefer": "return=minimal"})

    sb_request("DELETE", f"reviews?manhwa_id=eq.{dup_id}", extra_headers={"Prefer": "return=minimal"})
    sb_request("DELETE", f"favorites?manhwa_id=eq.{dup_id}", extra_headers={"Prefer": "return=minimal"})
    sb_request("DELETE", f"manhwas?id=eq.{dup_id}", extra_headers={"Prefer": "return=minimal"})
    return moved


def main():
    print("🔍 Cargando catálogo completo y capítulos desde Supabase...")
    manhwas = sb_request("GET", "manhwas?select=id,title,description,genre,cover_url,banner_url,status,score&limit=1000")
    all_chaps = []
    for batch in range(35):
        rows = sb_request(
            "GET",
            f"chapters?manhwa_id=not.is.null&select=id,manhwa_id,chapter_number&offset={batch*1000}&limit=1000",
        )
        if not rows:
            break
        all_chaps.extend(rows)
        if len(rows) < 1000:
            break

    chaps_by_manhwa = defaultdict(list)
    for c in all_chaps:
        chaps_by_manhwa[c["manhwa_id"]].append(c)

    print(f"📚 Total antes de limpieza: {len(manhwas)} manhwas | {len(all_chaps)} capítulos")

    by_key = {norm_key(m["title"]): m for m in manhwas}
    removed_ids = set()

    # 1. Eliminar entrada basura que no es un manhwa ("Biblioteca de cómics, mangas, manhwas y manhuas en Lector manga")
    garbage_key = norm_key("Biblioteca de cómics, mangas, manhwas y manhuas en Lector manga")
    if garbage_key in by_key:
        g_row = by_key[garbage_key]
        gid = g_row["id"]
        print(f"🗑️ Eliminando ficha basura no-manhwa: '{g_row['title']}' ({len(chaps_by_manhwa[gid])} caps)")
        for dc in chaps_by_manhwa[gid]:
            sb_request("PATCH", f"chapters?id=eq.{dc['id']}", {"manhwa_id": None}, {"Prefer": "return=minimal"})
        sb_request("DELETE", f"reviews?manhwa_id=eq.{gid}", extra_headers={"Prefer": "return=minimal"})
        sb_request("DELETE", f"favorites?manhwa_id=eq.{gid}", extra_headers={"Prefer": "return=minimal"})
        sb_request("DELETE", f"manhwas?id=eq.{gid}", extra_headers={"Prefer": "return=minimal"})
        removed_ids.add(gid)

    # 2. Fusionar duplicados conocidos (conservando como principal el que tenga más capítulos)
    duplicate_pairs = [
        ("[Colección de historias cortas secretas] Vibración", "[Colección de historias cortas secretas] Vibración Capítulo 8"),
        ("La dulce venganza de mi adorable esposa", "La dulce venganza de mi adorable esposa Capítulo 18"),
        ("Apoteosis: Elevación al Estado de Dios", "Apotheosis"),
        ("Besame si puedes", "Kiss Me if You Can"),
        ("El maestro de la espada acogedor de estrellas", "El Maestro Espadachín Alentado Por Las Estrellas"),
        ("Evolución Demoníaca", "Mi evolución a demonio"),
    ]

    for t_a, t_b in duplicate_pairs:
        ma = by_key.get(norm_key(t_a))
        mb = by_key.get(norm_key(t_b))
        if ma and mb and ma["id"] != mb["id"]:
            # Si uno tiene 'Capítulo X' en el título, el otro siempre es el principal; si no, el de más capítulos
            if "capitulo" in norm_key(mb["title"]):
                prim, dup = ma, mb
            elif len(chaps_by_manhwa[mb["id"]]) > len(chaps_by_manhwa[ma["id"]]):
                prim, dup = mb, ma
            else:
                prim, dup = ma, mb
            moved = merge_duplicate_pair(prim["id"], dup["id"], chaps_by_manhwa)
            removed_ids.add(dup["id"])
            print(f"🔄 Duplicado fusionado: '{dup['title']}' -> '{prim['title']}' (+{moved} caps movidos)")

    kept = [m for m in manhwas if m["id"] not in removed_ids]

    # 3. Buscar metadatos reales en paralelo para fichas con sinopsis deficiente
    deficient_list = [m for m in kept if is_bad_synopsis(m.get("description") or "", m["title"])]
    print(f"🌐 Consultando metadatos oficiales para {len(deficient_list)} obras con sinopsis deficiente...")
    zc_matches = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(search_zerocomics_metadata, m["title"]): m["id"] for m in deficient_list}
        for fut, mid in futures.items():
            res = fut.result()
            if res:
                zc_matches[mid] = res

    # 4. Auditar y reclasificar las categorías y textos de TODAS las obras
    updated_count = 0
    changes_sample = []
    genre_counter = Counter()

    for m in kept:
        mid = m["id"]
        clean_title = fix_mojibake(m["title"]).strip()
        raw_desc = fix_mojibake(m.get("description") or "").strip()
        zc_info = zc_matches.get(mid)

        api_genres = zc_info.get("generos") if zc_info else None
        api_adult = bool(zc_info.get("adulto") or zc_info.get("is_adult")) if zc_info else False

        if is_bad_synopsis(raw_desc, clean_title):
            if zc_info and zc_info.get("sinopsis") and len(str(zc_info["sinopsis"]).strip()) >= 40:
                new_desc = fix_mojibake(str(zc_info["sinopsis"]).strip())
            else:
                new_desc = f"Disfruta de {clean_title} en español con capítulos completos y en alta calidad en Nekutoon."
        else:
            new_desc = raw_desc.replace("en Nekumi.", "en Nekutoon.")

        new_genre = classify_manhwa_smart(
            clean_title,
            new_desc,
            m.get("genre") or "",
            api_genres=api_genres,
            api_is_adult=api_adult,
        )

        for g in new_genre.split(","):
            genre_counter[g.strip()] += 1

        patch = {}
        if clean_title != m["title"]:
            patch["title"] = clean_title
        if new_desc != (m.get("description") or ""):
            patch["description"] = new_desc
        if new_genre != (m.get("genre") or ""):
            patch["genre"] = new_genre
            changes_sample.append((clean_title, m.get("genre") or "", new_genre))
        if not m.get("banner_url") and m.get("cover_url"):
            patch["banner_url"] = m["cover_url"]

        if patch:
            sb_request("PATCH", f"manhwas?id=eq.{mid}", patch, {"Prefer": "return=minimal"})
            updated_count += 1

    print(f"\n✅ RECLASIFICACIÓN COMPLETADA: {updated_count}/{len(kept)} manhwas actualizados | {len(removed_ids)} duplicados/basura eliminados.")
    print("📊 Nueva distribución limpia de categorías:", dict(genre_counter.most_common(25)))
    print("\n🔎 Muestra de correcciones realizadas:")
    for t, old_g, new_g in changes_sample[:35]:
        print(f"  • {t}: [{old_g}]  ==>  [{new_g}]")


if __name__ == "__main__":
    main()
