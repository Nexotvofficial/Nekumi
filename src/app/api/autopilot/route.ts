import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL_DEFAULT, SUPABASE_ANON_KEY_DEFAULT, getChapterShardId } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const AUTOPILOT_CONFIG_ID = 290;
const ADMIN_EMAIL = "diazmowi07@gmail.com";

interface AutopilotLog {
  time: string;
  type: "manhwa" | "chapter" | "audit" | "info";
  message: string;
}

interface AutopilotState {
  enabled: boolean;
  allowAdult: boolean;
  discoveryCursorPage: number;
  lastRunAt: string | null;
  lastCronRunAt: string | null;
  totalManhwasAdded: number;
  totalChaptersAdded: number;
  totalReclassified: number;
  recentLogs: AutopilotLog[];
}

const DEFAULT_STATE: AutopilotState = {
  enabled: true,
  allowAdult: true,
  discoveryCursorPage: 1,
  lastRunAt: null,
  lastCronRunAt: null,
  totalManhwasAdded: 0,
  totalChaptersAdded: 0,
  totalReclassified: 0,
  recentLogs: [],
};

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_DEFAULT;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    SUPABASE_ANON_KEY_DEFAULT;
  return createSupabaseAdmin(url, key, { auth: { persistSession: false } });
}

async function verifyAdminRequest(req: NextRequest): Promise<boolean> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_DEFAULT,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_DEFAULT,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll() {},
        },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user && user.email === ADMIN_EMAIL);
  } catch {
    return false;
  }
}

function normKey(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const CANONICAL_TAG_MAP: Record<string, string> = {
  accion: "Acción",
  action: "Acción",
  fantasia: "Fantasía",
  fantasy: "Fantasía",
  magic: "Fantasía",
  magia: "Fantasía",
  romance: "Romance",
  isekai: "Isekai",
  reencarnacion: "Isekai",
  transmigracion: "Isekai",
  regresion: "Isekai",
  retornado: "Isekai",
  drama: "Drama",
  "drama escolar": "Escolar",
  tragedia: "Drama",
  venganza: "Drama",
  comedia: "Comedia",
  comedy: "Comedia",
  "artes marciales": "Artes Marciales",
  "martial arts": "Artes Marciales",
  cultivacion: "Murim",
  murim: "Murim",
  sistema: "Sistema",
  "pantallas de sistemas": "Sistema",
  aventura: "Aventura",
  adventure: "Aventura",
  psicologico: "Psicológico",
  psychological: "Psicológico",
  thriller: "Psicológico",
  crimen: "Misterio",
  misterio: "Misterio",
  mystery: "Misterio",
  horror: "Terror",
  terror: "Terror",
  sobrenatural: "Sobrenatural",
  supernatural: "Sobrenatural",
  "vida escolar": "Escolar",
  "school life": "Escolar",
  escolar: "Escolar",
  deportes: "Deportes",
  deporte: "Deportes",
  sports: "Deportes",
  "ciencia ficcion": "Ciencia Ficción",
  "sci fi": "Ciencia Ficción",
  apocaliptico: "Apocalíptico",
  supervivencia: "Apocalíptico",
  historico: "Histórico",
  historia: "Histórico",
  historical: "Histórico",
  "recuentos de la vida": "Recuentos de la vida",
  "slice of life": "Recuentos de la vida",
  "vida cotidiana": "Recuentos de la vida",
  harem: "Harem",
  "harem inverso": "Romance",
  "boys love": "BL",
  bl: "BL",
  yaoi: "BL",
  omegaverse: "BL",
  "shonen ai": "BL",
  "girls love": "GL",
  gl: "GL",
  yuri: "GL",
  "18": "+18",
  "19": "+18",
  "manhwa 19": "+18",
  "18 sin censura": "+18",
  "bl sin censura": "+18",
  "sin censura": "+18",
  smut: "+18",
  adulto: "+18",
  erotico: "+18",
  hentai: "+18",
  ecchi: "+18",
};

const IGNORED_TAGS = new Set([
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
]);

function classifyManhwaSmart(
  title: string,
  synopsis: string,
  currentGenre: string,
  apiGenres?: any[],
  apiIsAdult?: boolean
): string {
  const tags: string[] = [];
  const addTag = (t: string) => {
    if (t && !tags.includes(t)) tags.push(t);
  };

  const rawSources: string[] = [];
  if (Array.isArray(apiGenres)) {
    for (const g of apiGenres) {
      rawSources.push(typeof g === "object" && g !== null ? String(g.nombre || g.name || "") : String(g));
    }
  }
  if (currentGenre) {
    rawSources.push(...currentGenre.split(","));
  }

  let isAdult = Boolean(apiIsAdult);
  for (const raw of rawSources) {
    const nk = normKey(raw);
    if (!nk || IGNORED_TAGS.has(nk)) continue;
    const mapped = CANONICAL_TAG_MAP[nk];
    if (mapped === "+18") {
      isAdult = true;
    } else if (mapped) {
      addTag(mapped);
    }
  }

  const fullText = `${title} ${synopsis}`;
  if (/(\+18|\+19|sin censura|\bsmut\b|\bhentai\b|\ber[oó]tic[oa]\b|\byaoi\b)/i.test(fullText)) {
    isAdult = true;
  }

  if (/(\bboys love\b|\bmanhwa bl\b|\bbl manhwa\b|\byaoi\b|\bomegaverse\b)/i.test(fullText)) {
    addTag("BL");
  }
  if (/(\bgirls love\b|\byuri\b|\(gl\))/i.test(fullText)) {
    addTag("GL");
  }

  if (/(\bmurim\b|\bcultivaci[oó]n\b|\bcultivador\b|\bdantian\b|\bsecta\b|\bdao\b|\binmortalidad\b|\bclan marcial\b)/i.test(fullText)) {
    addTag("Artes Marciales");
    addTag("Murim");
  } else if (/(\bartes marciales\b|\bespadach[ií]n\b|\bmaestro de la espada\b|\bemperador de la espada\b)/i.test(fullText)) {
    addTag("Artes Marciales");
  }

  if (/(\bsistema\b|\bmazmorra[s]?\b|\bcazador(?:es)? de monstruos\b|\bsube de nivel\b|\bclase sss\b|\brango nacional\b|\bnigromante\b|\bjugador\b)/i.test(fullText)) {
    addTag("Sistema");
    addTag("Acción");
  }

  if (/(\bisekai\b|\breencarn[aóe]\w*|\btransmigr\w*|\bregresi[oó]n\b|\bregres[oó] al pasado\b|\brenac\w*|\botro mundo\b|\bmundo paralelo\b|\bvida anterior\b)/i.test(fullText)) {
    addTag("Isekai");
  }

  if (/(\bf[uú]tbol\b|\bb[eé]isbol\b|\bvoleibol\b|\bbaloncesto\b|\bboxeador\b)/i.test(fullText)) {
    addTag("Deportes");
  }
  if (/(\bescuela secundaria\b|\bvida escolar\b|\binstituto\b|\bcampus\b)/i.test(fullText) && tags.length < 3) {
    addTag("Escolar");
  }
  if (/(\bfantasma[s]?\b|\bzombi[es]*\b|\bterror\b)/i.test(fullText) && !tags.includes("BL") && !isAdult) {
    addTag("Terror");
  }

  const combatSignals =
    /(\bbatalla[s]?\b|\bguerrero[s]?\b|\bespada[s]?\b|\bmazmorra[s]?\b|\bmonstruo[s]?\b|\bcazador\b|\basesino[s]?\b|\bmercenario\b|\bmurim\b|\bartes marciales\b|\bnigromante\b|\bapocalipsis\b|\bluchador\b|\bcombate\b)/i.test(
      fullText
    );

  let filteredTags = tags;
  if (
    filteredTags.includes("Acción") &&
    (filteredTags.includes("BL") || filteredTags.includes("GL") || isAdult || filteredTags.includes("Romance"))
  ) {
    if (
      !combatSignals &&
      !filteredTags.includes("Sistema") &&
      !filteredTags.includes("Murim") &&
      !filteredTags.includes("Artes Marciales")
    ) {
      filteredTags = filteredTags.filter((t) => t !== "Acción");
    }
  }

  const romanceSignals =
    /(\bromance\b|\brom[aá]ntic[oa]\b|\benamor\w*|\bmatrimonio\b|\bespos[oa]\b|\bnovi[oa]\b|\bprometid[oa]\b|\bbeso\b|\bvillana\b)/i.test(
      fullText
    );
  if (
    filteredTags.includes("Romance") &&
    (filteredTags.includes("Murim") || filteredTags.includes("Sistema") || filteredTags.includes("Artes Marciales")) &&
    !filteredTags.includes("BL") &&
    !isAdult &&
    !romanceSignals
  ) {
    filteredTags = filteredTags.filter((t) => t !== "Romance");
  }

  const ordered: string[] = [];
  if (isAdult) ordered.push("+18");
  for (const p of ["BL", "GL"]) {
    if (filteredTags.includes(p) && !ordered.includes(p)) ordered.push(p);
  }
  for (const g of filteredTags) {
    if (!ordered.includes(g) && g !== "+18") ordered.push(g);
  }

  if (ordered.length === 0 || (ordered.length === 1 && ordered[0] === "+18")) {
    if (isAdult) return "+18, Romance, Drama";
    return "Acción, Fantasía";
  }

  return ordered.slice(0, 4).join(", ");
}

function cleanSynopsis(raw: string | null | undefined, title: string): string {
  const cleaned = String(raw || "")
    .replace(/\[.*?\]\(https?:\/\/.*?\)/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (
    cleaned.length < 40 ||
    /sin descripci|sinopsis no disponible|lector\s*manga|traducido por/i.test(cleaned)
  ) {
    return `Disfruta de ${title} en español con capítulos completos y en alta definición en Nekutoon.`;
  }
  return cleaned;
}

async function fetchJson(url: string, timeoutMs = 12000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NekutoonTitanAgent/3.0",
        Accept: "application/json",
      },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getAutopilotState(supabase: any): Promise<AutopilotState> {
  const { data } = await supabase
    .from("site_config")
    .select("category_images")
    .eq("id", AUTOPILOT_CONFIG_ID)
    .maybeSingle();
  const raw = (data?.category_images as Partial<AutopilotState>) || {};
  return {
    ...DEFAULT_STATE,
    ...raw,
    recentLogs: Array.isArray(raw.recentLogs) ? raw.recentLogs.slice(0, 40) : [],
  };
}

async function saveAutopilotState(supabase: any, state: AutopilotState) {
  await supabase.from("site_config").upsert({
    id: AUTOPILOT_CONFIG_ID,
    category_images: {
      ...state,
      recentLogs: state.recentLogs.slice(0, 40),
    },
  });
}

async function savePagesToFastShard(supabase: any, chapterId: string, pageUrls: string[]) {
  if (!chapterId || pageUrls.length === 0) return;
  const shardId = getChapterShardId(chapterId);
  const { data: existing } = await supabase
    .from("site_config")
    .select("category_images")
    .eq("id", shardId)
    .maybeSingle();

  const currentMap: Record<string, any> =
    existing?.category_images && typeof existing.category_images === "object"
      ? { ...(existing.category_images as Record<string, any>) }
      : {};

  const firstSlash = pageUrls[0].lastIndexOf("/");
  let b = "";
  let p = pageUrls;
  if (firstSlash !== -1) {
    const candidate = pageUrls[0].slice(0, firstSlash + 1);
    if (pageUrls.every((u) => u.startsWith(candidate))) {
      b = candidate;
      p = pageUrls.map((u) => u.slice(candidate.length));
    }
  }

  currentMap[chapterId] = { b, p };
  await supabase.from("site_config").upsert({ id: shardId, category_images: currentMap });
}

async function pingIndexNowUrls(urls: string[]) {
  if (urls.length === 0) return;
  const payload = JSON.stringify({
    host: "www.nekutoon.com",
    key: "3b8f1c84918e47458117769cf0c9b0e9",
    keyLocation: "https://www.nekutoon.com/3b8f1c84918e47458117769cf0c9b0e9.txt",
    urlList: urls.slice(0, 100),
  });

  await Promise.allSettled([
    fetch("https://www.bing.com/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: payload,
    }),
    fetch("https://yandex.com/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: payload,
    }),
  ]);
}

async function importZeroComicsSlug(
  supabase: any,
  slug: string,
  dbManhwas: any[],
  options: { allowAdult: boolean; maxNewChapters: number }
): Promise<{
  manhwaAdded: boolean;
  chaptersAdded: number;
  title: string;
  manhwaId: string | null;
  newUrls: string[];
}> {
  const res = await fetchJson(`https://api.zerocomics.net/api/series/${slug}`);
  const data = res?.data;
  if (!data || !data.titulo) {
    return { manhwaAdded: false, chaptersAdded: 0, title: slug, manhwaId: null, newUrls: [] };
  }

  const title = String(data.titulo).trim();
  const altTitle = String(data.titulo_alternativo || "").trim();
  const isAdult = Boolean(data.adulto || data.is_adult);

  if (isAdult && !options.allowAdult) {
    return { manhwaAdded: false, chaptersAdded: 0, title, manhwaId: null, newUrls: [] };
  }

  const synopsis = cleanSynopsis(data.sinopsis, title);
  const coverUrl = String(data.portada || "");
  if (!coverUrl) {
    return { manhwaAdded: false, chaptersAdded: 0, title, manhwaId: null, newUrls: [] };
  }
  const bannerUrl = String(data.banner || coverUrl);
  const rawStatus = String(data.estado || "").toLowerCase();
  const status = rawStatus.includes("final") || rawStatus.includes("complet") ? "Finalizado" : "En emisión";
  const scoreVal = Number(data.puntuacion) > 0 ? Math.min(5, Math.round(Number(data.puntuacion) * 10) / 10) : 4.7;

  const keyMain = normKey(title);
  const keyAlt = altTitle ? normKey(altTitle) : "";

  let existing = dbManhwas.find(
    (m) =>
      (keyMain && m._normKey === keyMain) ||
      (keyAlt && m._normKey === keyAlt) ||
      (coverUrl && m.cover_url === coverUrl)
  );

  const newUrls: string[] = [];
  let manhwaAdded = false;
  let manhwaId: string;

  if (existing) {
    manhwaId = existing.id;
    const nextGenre = classifyManhwaSmart(title, synopsis, existing.genre || "", data.generos, isAdult);
    const patch: Record<string, any> = {};
    if (nextGenre !== existing.genre) patch.genre = nextGenre;
    if (!existing.banner_url && bannerUrl) patch.banner_url = bannerUrl;
    if (status === "Finalizado" && existing.status !== "Finalizado") patch.status = "Finalizado";
    if (Object.keys(patch).length > 0) {
      await supabase.from("manhwas").update(patch).eq("id", manhwaId);
      Object.assign(existing, patch);
    }
  } else {
    const apiChaptersCheck = Array.isArray(data.capitulos) ? data.capitulos : [];
    if (apiChaptersCheck.length === 0) {
      return { manhwaAdded: false, chaptersAdded: 0, title, manhwaId: null, newUrls: [] };
    }

    const genreStr = classifyManhwaSmart(title, synopsis, "", data.generos, isAdult);
    const { data: insertedRows, error: insErr } = await supabase
      .from("manhwas")
      .insert({
        title,
        description: synopsis,
        cover_url: coverUrl,
        banner_url: bannerUrl,
        genre: genreStr,
        status,
        is_hero: false,
        score: scoreVal,
      })
      .select("id, title, genre, cover_url, banner_url, status");

    if (insErr || !insertedRows || insertedRows.length === 0) {
      return { manhwaAdded: false, chaptersAdded: 0, title, manhwaId: null, newUrls: [] };
    }

    const newRow = { ...insertedRows[0], _normKey: keyMain };
    dbManhwas.push(newRow);
    manhwaId = newRow.id;
    manhwaAdded = true;
    newUrls.push(`https://www.nekutoon.com/manga/${manhwaId}`);
  }

  const { data: currentChaps } = await supabase
    .from("chapters")
    .select("chapter_number")
    .eq("manhwa_id", manhwaId)
    .limit(1000);

  const existingNums = new Set<number>(
    (currentChaps || [])
      .filter((c: any) => c.chapter_number !== null && c.chapter_number !== undefined)
      .map((c: any) => Number(c.chapter_number))
  );

  const apiChapters: any[] = Array.isArray(data.capitulos) ? [...data.capitulos] : [];
  apiChapters.sort((a, b) => Number(a.numero || 0) - Number(b.numero || 0));

  const missing = apiChapters
    .filter((ch) => ch.numero !== null && ch.numero !== undefined && !existingNums.has(Number(ch.numero)))
    .slice(0, options.maxNewChapters);

  let chaptersAdded = 0;
  for (const ch of missing) {
    const rawNum = ch.numero;
    const cNum = Number(rawNum);
    try {
      const chapJson = await fetchJson(`https://api.zerocomics.net/api/series/${slug}/capitulo/${rawNum}`);
      const pagesList: string[] = Array.isArray(chapJson?.data?.paginas) ? chapJson.data.paginas : [];
      if (pagesList.length === 0) continue;

      const { data: chapIns } = await supabase
        .from("chapters")
        .insert({
          manhwa_id: manhwaId,
          chapter_number: cNum,
          title: ch.titulo || `Capítulo ${cNum}`,
        })
        .select("id");

      const chapId = chapIns?.[0]?.id;
      if (!chapId) continue;

      const pagesPayload = pagesList.map((imgUrl, idx) => ({
        chapter_id: chapId,
        page_number: idx + 1,
        image_url: imgUrl,
      }));

      await Promise.all([
        supabase.from("pages").insert(pagesPayload),
        savePagesToFastShard(supabase, chapId, pagesList),
      ]);

      existingNums.add(cNum);
      chaptersAdded += 1;
      newUrls.push(`https://www.nekutoon.com/manga/${manhwaId}/chapter/${chapId}`);
    } catch {
      continue;
    }
  }

  return { manhwaAdded, chaptersAdded, title, manhwaId, newUrls };
}

async function runAutonomousCycle(supabase: any, state: AutopilotState, maxSeries = 4, maxChapsPerSeries = 8) {
  const { data: rawManhwas } = await supabase
    .from("manhwas")
    .select("id, title, genre, cover_url, banner_url, status")
    .limit(1500);

  const dbManhwas = (rawManhwas || []).map((m: any) => ({
    ...m,
    _normKey: normKey(m.title || ""),
  }));

  const cursorPage = Math.max(1, Math.min(250, Number(state.discoveryCursorPage) || 1));

  // Radar 1: Estrenos recién subidos hoy + Radar 2: Explorador rotativo de manhwas populares
  const [latestRes, popularRes] = await Promise.allSettled([
    fetchJson("https://api.zerocomics.net/api/series?page=1&tipo=Comics"),
    fetchJson(`https://api.zerocomics.net/api/series?page=${cursorPage}&orden=populares&tipo=Comics`),
  ]);

  const candidates: any[] = [];
  if (latestRes.status === "fulfilled" && Array.isArray(latestRes.value?.data)) {
    candidates.push(...latestRes.value.data.slice(0, 6));
  }
  if (popularRes.status === "fulfilled" && Array.isArray(popularRes.value?.data)) {
    candidates.push(...popularRes.value.data.slice(0, 10));
  }

  // Priorizar obras nuevas o existentes con capítulos nuevos
  const seenSlugs = new Set<string>();
  const uniqueCandidates = candidates.filter((c) => {
    if (!c?.slug || seenSlugs.has(c.slug)) return false;
    seenSlugs.add(c.slug);
    return Number(c.capitulos_total || 0) > 0;
  });

  let addedManhwas = 0;
  let addedChapters = 0;
  const allNewUrls: string[] = [];
  const cycleLogs: AutopilotLog[] = [];
  const nowIso = new Date().toISOString();

  let touched = 0;
  for (const item of uniqueCandidates) {
    if (touched >= maxSeries) break;
    const res = await importZeroComicsSlug(supabase, item.slug, dbManhwas, {
      allowAdult: state.allowAdult,
      maxNewChapters: maxChapsPerSeries,
    });

    if (res.manhwaAdded || res.chaptersAdded > 0) {
      touched += 1;
      if (res.manhwaAdded) {
        addedManhwas += 1;
        cycleLogs.push({
          time: nowIso,
          type: "manhwa",
          message: `Nuevo manhwa descubierto: "${res.title}" (+${res.chaptersAdded} caps indexados)`,
        });
      } else if (res.chaptersAdded > 0) {
        cycleLogs.push({
          time: nowIso,
          type: "chapter",
          message: `"${res.title}": +${res.chaptersAdded} capítulos nuevos publicados`,
        });
      }
      addedChapters += res.chaptersAdded;
      allNewUrls.push(...res.newUrls);
    }
  }

  if (cycleLogs.length === 0) {
    cycleLogs.push({
      time: nowIso,
      type: "info",
      message: `Radar completado (página popular #${cursorPage}): catálogo al día, avanzando cursor.`,
    });
  }

  const nextState: AutopilotState = {
    ...state,
    discoveryCursorPage: cursorPage >= 250 ? 1 : cursorPage + 1,
    lastRunAt: nowIso,
    totalManhwasAdded: (Number(state.totalManhwasAdded) || 0) + addedManhwas,
    totalChaptersAdded: (Number(state.totalChaptersAdded) || 0) + addedChapters,
    recentLogs: [...cycleLogs, ...state.recentLogs].slice(0, 40),
  };

  await saveAutopilotState(supabase, nextState);
  if (allNewUrls.length > 0) {
    await pingIndexNowUrls(allNewUrls);
  }

  return { state: nextState, addedManhwas, addedChapters };
}

export async function GET(req: NextRequest) {
  const supabase = getServiceSupabase();
  const trigger = req.nextUrl.searchParams.get("trigger");
  const state = await getAutopilotState(supabase);

  if (trigger === "cron") {
    if (!state.enabled) {
      return NextResponse.json({ ok: true, skipped: "paused", state });
    }
    const lastCronMs = state.lastCronRunAt ? new Date(state.lastCronRunAt).getTime() : 0;
    if (Date.now() - lastCronMs < 12 * 60 * 1000) {
      return NextResponse.json({ ok: true, skipped: "cooldown", state });
    }
    state.lastCronRunAt = new Date().toISOString();
    const result = await runAutonomousCycle(supabase, state, 4, 8);
    return NextResponse.json({
      ok: true,
      addedManhwas: result.addedManhwas,
      addedChapters: result.addedChapters,
      state: result.state,
    });
  }

  return NextResponse.json({ ok: true, state });
}

export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const state = await getAutopilotState(supabase);

  if (action === "update_settings") {
    const nextState: AutopilotState = {
      ...state,
      enabled: typeof body.enabled === "boolean" ? body.enabled : state.enabled,
      allowAdult: typeof body.allowAdult === "boolean" ? body.allowAdult : state.allowAdult,
    };
    await saveAutopilotState(supabase, nextState);
    return NextResponse.json({ ok: true, state: nextState });
  }

  if (action === "run_now") {
    const result = await runAutonomousCycle(supabase, state, 5, 10);
    return NextResponse.json({
      ok: true,
      addedManhwas: result.addedManhwas,
      addedChapters: result.addedChapters,
      state: result.state,
    });
  }

  if (action === "search_import") {
    const rawQuery = String(body.query || "").trim();
    if (!rawQuery) {
      return NextResponse.json({ error: "Escribe un nombre o URL de manhwa" }, { status: 400 });
    }

    const { data: rawManhwas } = await supabase
      .from("manhwas")
      .select("id, title, genre, cover_url, banner_url, status")
      .limit(1500);

    const dbManhwas = (rawManhwas || []).map((m: any) => ({
      ...m,
      _normKey: normKey(m.title || ""),
    }));

    let slug = "";
    const cleanedUrl = rawQuery.replace(/\/+$/, "");
    for (const marker of ["/comics/", "/series/", "/manga/", "/manhwa/"]) {
      if (cleanedUrl.includes(marker)) {
        slug = cleanedUrl.split(marker)[1]?.split("/")[0]?.split("?")[0] || "";
        break;
      }
    }

    if (!slug) {
      const searchRes = await fetchJson(
        `https://api.zerocomics.net/api/series?search=${encodeURIComponent(rawQuery)}&page=1`
      );
      const list = Array.isArray(searchRes?.data) ? searchRes.data : [];
      if (list.length === 0) {
        return NextResponse.json(
          { error: `No se encontró "${rawQuery}" en el radar global.` },
          { status: 404 }
        );
      }
      slug = list[0].slug;
    }

    const res = await importZeroComicsSlug(supabase, slug, dbManhwas, {
      allowAdult: true,
      maxNewChapters: 30,
    });

    const nowIso = new Date().toISOString();
    const logMsg = res.manhwaAdded
      ? `Importación directa: "${res.title}" creada con +${res.chaptersAdded} capítulos`
      : `Sincronización directa: "${res.title}" (+${res.chaptersAdded} capítulos añadidos)`;

    const nextState: AutopilotState = {
      ...state,
      lastRunAt: nowIso,
      totalManhwasAdded: state.totalManhwasAdded + (res.manhwaAdded ? 1 : 0),
      totalChaptersAdded: state.totalChaptersAdded + res.chaptersAdded,
      recentLogs: [{ time: nowIso, type: res.manhwaAdded ? "manhwa" : "chapter", message: logMsg }, ...state.recentLogs].slice(0, 40),
    };

    await saveAutopilotState(supabase, nextState);
    if (res.newUrls.length > 0) await pingIndexNowUrls(res.newUrls);

    return NextResponse.json({
      ok: true,
      title: res.title,
      manhwaAdded: res.manhwaAdded,
      chaptersAdded: res.chaptersAdded,
      state: nextState,
    });
  }

  if (action === "reclassify_catalog") {
    const { data: allManhwas } = await supabase
      .from("manhwas")
      .select("id, title, description, genre")
      .limit(1500);

    let updated = 0;
    for (const m of allManhwas || []) {
      const nextGenre = classifyManhwaSmart(m.title || "", m.description || "", m.genre || "");
      if (nextGenre && nextGenre !== m.genre) {
        await supabase.from("manhwas").update({ genre: nextGenre }).eq("id", m.id);
        updated += 1;
      }
    }

    const nowIso = new Date().toISOString();
    const nextState: AutopilotState = {
      ...state,
      totalReclassified: (Number(state.totalReclassified) || 0) + updated,
      recentLogs: [
        {
          time: nowIso,
          type: "audit",
          message: `Auditoría de categorías completada: ${updated} fichas reclasificadas.`,
        },
        ...state.recentLogs,
      ].slice(0, 40),
    };
    await saveAutopilotState(supabase, nextState);

    return NextResponse.json({ ok: true, updated, state: nextState });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
