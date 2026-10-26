/**
 * Cloud sync for reader progress (XP, rank, NekuCoins, cosmetics).
 * Stores a merged snapshot in `profiles.reader_progress` (jsonb) so progress
 * survives device changes. Merge is monotonic (union / max) so syncing from
 * several devices never loses progress.
 */

const KEYS = {
  read: "nekutoon_read_chapters_v1",
  comments: "nekutoon_comments_count_v1",
  reactions: "nekutoon_reactions_count_v1",
  spent: "nekutoon_spent_coins_v1",
  owned: "nekutoon_owned_items_v1",
  equipped: "nekutoon_equipped_cosmetics_v1",
};

export interface ReaderProgress {
  readChapters: string[];
  comments: number;
  reactions: number;
  spentCoins: number;
  ownedItems: string[];
  equipped: Record<string, string>;
  updatedAt?: string;
}

function safeJson<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readLocal(): ReaderProgress {
  return {
    readChapters: safeJson<string[]>(localStorage.getItem(KEYS.read), []),
    comments: parseInt(localStorage.getItem(KEYS.comments) || "0", 10) || 0,
    reactions: parseInt(localStorage.getItem(KEYS.reactions) || "0", 10) || 0,
    spentCoins: parseInt(localStorage.getItem(KEYS.spent) || "0", 10) || 0,
    ownedItems: safeJson<string[]>(localStorage.getItem(KEYS.owned), []),
    equipped: safeJson<Record<string, string>>(localStorage.getItem(KEYS.equipped), {}),
  };
}

function writeLocal(p: ReaderProgress) {
  localStorage.setItem(KEYS.read, JSON.stringify(p.readChapters));
  localStorage.setItem(KEYS.comments, String(p.comments));
  localStorage.setItem(KEYS.reactions, String(p.reactions));
  localStorage.setItem(KEYS.spent, String(p.spentCoins));
  localStorage.setItem(KEYS.owned, JSON.stringify(p.ownedItems));
  localStorage.setItem(KEYS.equipped, JSON.stringify(p.equipped));
}

function merge(a: ReaderProgress, b: Partial<ReaderProgress> | null): ReaderProgress {
  if (!b) return a;
  return {
    readChapters: Array.from(new Set([...(a.readChapters || []), ...(b.readChapters || [])])).slice(-20000),
    comments: Math.max(a.comments || 0, b.comments || 0),
    reactions: Math.max(a.reactions || 0, b.reactions || 0),
    spentCoins: Math.max(a.spentCoins || 0, b.spentCoins || 0),
    ownedItems: Array.from(new Set([...(a.ownedItems || []), ...(b.ownedItems || [])])),
    // Local device wins for currently equipped cosmetics (latest user choice)
    equipped: { ...(b.equipped || {}), ...(a.equipped || {}) },
  };
}

let inFlight: Promise<boolean> | null = null;

/**
 * Pull remote progress, merge with local, save both. Returns true on success.
 * Silently no-ops if the `reader_progress` column doesn't exist yet.
 */
export function syncReaderProgress(supabase: any, userId?: string | null): Promise<boolean> {
  if (typeof window === "undefined" || !userId) return Promise.resolve(false);
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("reader_progress")
        .eq("id", userId)
        .maybeSingle();
      if (error) return false;

      const merged = merge(readLocal(), (data?.reader_progress as ReaderProgress) || null);
      writeLocal(merged);

      const { error: upErr } = await supabase
        .from("profiles")
        .update({ reader_progress: { ...merged, updatedAt: new Date().toISOString() } })
        .eq("id", userId);
      return !upErr;
    } catch {
      return false;
    } finally {
      setTimeout(() => {
        inFlight = null;
      }, 0);
    }
  })();

  return inFlight;
}
