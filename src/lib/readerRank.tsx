"use client";

import React from "react";
import { Shield, Swords, Crown, Sparkles, Flame, Zap, Compass } from "lucide-react";

export interface ReaderRankTier {
  code: "E" | "D" | "C" | "B" | "A" | "S" | "SS";
  title: string;
  subtitle: string;
  minXp: number;
  minChaptersHint: number;
  color: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  glowStyle: string;
}

export const READER_RANKS: ReaderRankTier[] = [
  {
    code: "E",
    title: "Novato",
    subtitle: "Despertado Reciente",
    minXp: 0,
    minChaptersHint: 0,
    color: "#a1a1aa",
    borderClass: "border-white/10",
    bgClass: "bg-white/[0.04]",
    textClass: "text-zinc-400",
    glowStyle: "none",
  },
  {
    code: "D",
    title: "Explorador",
    subtitle: "Rastreador de Mazmorras",
    minXp: 50,
    minChaptersHint: 5,
    color: "#d4d4d8",
    borderClass: "border-white/12",
    bgClass: "bg-white/[0.05]",
    textClass: "text-zinc-300",
    glowStyle: "none",
  },
  {
    code: "C",
    title: "Cazador",
    subtitle: "Vanguardia del Gremio",
    minXp: 150,
    minChaptersHint: 15,
    color: "#c4b5fd",
    borderClass: "border-violet-400/25",
    bgClass: "bg-violet-500/10",
    textClass: "text-violet-200",
    glowStyle: "none",
  },
  {
    code: "B",
    title: "Cazador Élite",
    subtitle: "Capitán de Incursión",
    minXp: 350,
    minChaptersHint: 35,
    color: "#c084fc",
    borderClass: "border-purple-400/30",
    bgClass: "bg-purple-500/12",
    textClass: "text-purple-200",
    glowStyle: "none",
  },
  {
    code: "A",
    title: "Gran Maestro",
    subtitle: "Comandante de Orden",
    minXp: 700,
    minChaptersHint: 70,
    color: "#e879f9",
    borderClass: "border-fuchsia-400/35",
    bgClass: "bg-fuchsia-500/12",
    textClass: "text-fuchsia-200",
    glowStyle: "none",
  },
  {
    code: "S",
    title: "Soberano",
    subtitle: "Autoridad Nacional",
    minXp: 1300,
    minChaptersHint: 130,
    color: "#f5d0fe",
    borderClass: "border-purple-300/45",
    bgClass: "bg-purple-500/15",
    textClass: "text-purple-100",
    glowStyle: "0 0 14px rgba(168,85,247,0.2)",
  },
  {
    code: "SS",
    title: "Monarca",
    subtitle: "Monarca de las Sombras",
    minXp: 2500,
    minChaptersHint: 250,
    color: "#e879f9",
    borderClass: "border-[#c084fc]/55",
    bgClass: "bg-gradient-to-r from-[#a855f7]/20 to-[#ec4899]/15",
    textClass: "text-white",
    glowStyle: "0 0 18px rgba(168,85,247,0.28)",
  },
];

export interface GuildShopItem {
  id: string;
  category: "frame" | "nameColor" | "customTitle";
  name: string;
  description: string;
  price: number;
  previewClass: string;
  glowCss?: string;
  badgeText?: string;
}

export const GUILD_SHOP_ITEMS: GuildShopItem[] = [
  // Avatar Neon Frames
  {
    id: "frame_abyss",
    category: "frame",
    name: "Marco Monarca Abismal",
    description: "Anillo de energía púrpura y magenta con aura abismal.",
    price: 150,
    previewClass: "border-2 border-fuchsia-400 ring-2 ring-purple-500/60",
    glowCss: "0 0 18px rgba(232,121,249,0.75), inset 0 0 10px rgba(168,85,247,0.45)",
  },
  {
    id: "frame_solar",
    category: "frame",
    name: "Marco Soberano Dorado",
    description: "Forjado en oro imperial para los cazadores de élite.",
    price: 200,
    previewClass: "border-2 border-amber-300 ring-2 ring-amber-500/60",
    glowCss: "0 0 18px rgba(251,191,36,0.8), inset 0 0 10px rgba(245,158,11,0.45)",
  },
  {
    id: "frame_cyber",
    category: "frame",
    name: "Marco Relámpago Cian",
    description: "Destello eléctrico azul del Sistema.",
    price: 120,
    previewClass: "border-2 border-cyan-300 ring-2 ring-sky-500/60",
    glowCss: "0 0 16px rgba(56,189,248,0.8), inset 0 0 8px rgba(14,165,233,0.45)",
  },
  {
    id: "frame_crimson",
    category: "frame",
    name: "Marco Llama Carmesí",
    description: "Aura ardiente de comandante de incursión.",
    price: 160,
    previewClass: "border-2 border-rose-400 ring-2 ring-pink-600/60",
    glowCss: "0 0 18px rgba(244,63,94,0.8), inset 0 0 10px rgba(236,72,153,0.45)",
  },
  {
    id: "frame_emerald",
    category: "frame",
    name: "Marco Runa Esmeralda",
    description: "Sello antiguo de vitalidad y precisión.",
    price: 100,
    previewClass: "border-2 border-emerald-300 ring-2 ring-emerald-500/55",
    glowCss: "0 0 15px rgba(52,211,153,0.75)",
  },

  // Glowing Name Colors
  {
    id: "color_monarch",
    category: "nameColor",
    name: "Apodo Aura de Sombras",
    description: "Degradado púrpura, fucsia y cristal en todos tus comentarios.",
    price: 140,
    previewClass:
      "text-transparent bg-clip-text bg-gradient-to-r from-[#e879f9] via-[#c084fc] to-[#f472b6] drop-shadow-[0_0_10px_rgba(232,121,249,0.55)]",
  },
  {
    id: "color_gold",
    category: "nameColor",
    name: "Apodo Oro Imperial",
    description: "Brillo dorado real de Rango Nacional.",
    price: 150,
    previewClass:
      "text-transparent bg-clip-text bg-gradient-to-r from-[#fde68a] via-[#fbbf24] to-[#f59e0b] drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]",
  },
  {
    id: "color_crimson",
    category: "nameColor",
    name: "Apodo Carmesí Sangriento",
    description: "Destello rojo-magenta de alta intensidad.",
    price: 110,
    previewClass:
      "text-transparent bg-clip-text bg-gradient-to-r from-[#fda4af] via-[#f43f5e] to-[#ec4899] drop-shadow-[0_0_10px_rgba(244,63,94,0.55)]",
  },
  {
    id: "color_cyan",
    category: "nameColor",
    name: "Apodo Jugador del Sistema",
    description: "Color holográfico azul ventana de estado.",
    price: 100,
    previewClass:
      "text-transparent bg-clip-text bg-gradient-to-r from-[#bae6fd] via-[#38bdf8] to-[#818cf8] drop-shadow-[0_0_10px_rgba(56,189,248,0.55)]",
  },

  // Exclusive Titles
  {
    id: "title_shadow",
    category: "customTitle",
    name: "Título: «Rey de las Sombras»",
    description: "Insignia especial junto a tu nombre en el Muro y Comentarios.",
    price: 200,
    previewClass: "text-fuchsia-300 border-fuchsia-400/50 bg-fuchsia-500/15",
    badgeText: "«Rey de las Sombras»",
  },
  {
    id: "title_system",
    category: "customTitle",
    name: "Título: «Jugador del Sistema»",
    description: "Demuestra que fuiste elegido por el Arquitecto.",
    price: 120,
    previewClass: "text-sky-300 border-sky-400/50 bg-sky-500/15",
    badgeText: "«Jugador del Sistema»",
  },
  {
    id: "title_empress",
    category: "customTitle",
    name: "Título: «Emperatriz Carmesí»",
    description: "Nobleza absoluta de las historias imperiales.",
    price: 150,
    previewClass: "text-pink-300 border-pink-400/50 bg-pink-500/15",
    badgeText: "«Emperatriz Carmesí»",
  },
  {
    id: "title_reaper",
    category: "customTitle",
    name: "Título: «Segador del Abismo»",
    description: "Temido en todas las mazmorras de Rango S.",
    price: 160,
    previewClass: "text-amber-300 border-amber-400/50 bg-amber-500/15",
    badgeText: "«Segador del Abismo»",
  },
];

export interface EquippedCosmetics {
  frameId?: string;
  nameColorId?: string;
  customTitleId?: string;
}

export interface ReaderStats {
  chaptersRead: number;
  commentsCount: number;
  reactionsCount: number;
  xp: number;
  coins: number;
  totalEarnedCoins: number;
  spentCoins: number;
  ownedItems: string[];
  equipped: EquippedCosmetics;
  level: number;
  currentRank: ReaderRankTier;
  nextRank: ReaderRankTier | null;
  progressPercent: number;
  xpToNextRank: number;
}

const READ_CHAPTERS_KEY = "nekutoon_read_chapters_v1";
const COMMENTS_COUNT_KEY = "nekutoon_comments_count_v1";
const REACTIONS_COUNT_KEY = "nekutoon_reactions_count_v1";
const SPENT_COINS_KEY = "nekutoon_spent_coins_v1";
const OWNED_ITEMS_KEY = "nekutoon_owned_items_v1";
const EQUIPPED_COSMETICS_KEY = "nekutoon_equipped_cosmetics_v1";

const WELCOME_BONUS_COINS = 250;

export function getShopItemById(id?: string): GuildShopItem | undefined {
  if (!id) return undefined;
  return GUILD_SHOP_ITEMS.find((item) => item.id === id);
}

/**
 * Computes reader rank, level, XP, and NekuCoins wallet.
 */
export function computeReaderStats(
  chaptersRead: number,
  commentsCount = 0,
  reactionsCount = 0,
  overrideXp?: number,
  spentCoins = 0,
  ownedItems: string[] = [],
  equipped: EquippedCosmetics = {}
): ReaderStats {
  const safeChapters = Math.max(0, Math.floor(chaptersRead || 0));
  const safeComments = Math.max(0, Math.floor(commentsCount || 0));
  const safeReactions = Math.max(0, Math.floor(reactionsCount || 0));

  const xp =
    typeof overrideXp === "number" && overrideXp >= 0
      ? Math.floor(overrideXp)
      : safeChapters * 10 + safeComments * 25 + safeReactions * 5;

  // NekuCoins: 250 welcome bonus + 20 per chapter + 40 per comment/post + 10 per reaction
  const totalEarnedCoins =
    WELCOME_BONUS_COINS + safeChapters * 20 + safeComments * 40 + safeReactions * 10;
  const coins = Math.max(0, totalEarnedCoins - Math.max(0, spentCoins));

  const level = Math.max(1, Math.floor(xp / 30) + 1);

  let currentIdx = 0;
  for (let i = 0; i < READER_RANKS.length; i++) {
    if (xp >= READER_RANKS[i].minXp) {
      currentIdx = i;
    }
  }

  const currentRank = READER_RANKS[currentIdx];
  const nextRank = currentIdx < READER_RANKS.length - 1 ? READER_RANKS[currentIdx + 1] : null;

  let progressPercent = 100;
  let xpToNextRank = 0;
  if (nextRank) {
    const span = Math.max(1, nextRank.minXp - currentRank.minXp);
    const gainedInTier = Math.max(0, xp - currentRank.minXp);
    progressPercent = Math.min(100, Math.round((gainedInTier / span) * 100));
    xpToNextRank = Math.max(0, nextRank.minXp - xp);
  }

  return {
    chaptersRead: safeChapters,
    commentsCount: safeComments,
    reactionsCount: safeReactions,
    xp,
    coins,
    totalEarnedCoins,
    spentCoins,
    ownedItems,
    equipped,
    level,
    currentRank,
    nextRank,
    progressPercent,
    xpToNextRank,
  };
}

export function getLocalReaderStats(extraReviewsCount = 0): ReaderStats {
  if (typeof window === "undefined") {
    return computeReaderStats(0, extraReviewsCount, 0);
  }

  try {
    const rawSet = localStorage.getItem(READ_CHAPTERS_KEY);
    const readIds = new Set<string>(rawSet ? JSON.parse(rawSet) : []);

    const histRaw = localStorage.getItem("nekumi_reading_history");
    if (histRaw) {
      const hist = JSON.parse(histRaw);
      if (Array.isArray(hist)) {
        for (const item of hist) {
          if (item?.chapterId) readIds.add(String(item.chapterId));
        }
      }
    }

    let inferredChapterCount = readIds.size;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("nekumi_last_read_") && !k.startsWith("nekumi_last_read_num_")) {
        const val = localStorage.getItem(k);
        if (val) readIds.add(val);
      }
    }
    inferredChapterCount = Math.max(inferredChapterCount, readIds.size);

    if (readIds.size > 0) {
      localStorage.setItem(READ_CHAPTERS_KEY, JSON.stringify(Array.from(readIds)));
    }

    const savedComments = parseInt(localStorage.getItem(COMMENTS_COUNT_KEY) || "0", 10) || 0;
    const savedReactions = parseInt(localStorage.getItem(REACTIONS_COUNT_KEY) || "0", 10) || 0;
    const spentCoins = parseInt(localStorage.getItem(SPENT_COINS_KEY) || "0", 10) || 0;
    const ownedItems: string[] = JSON.parse(localStorage.getItem(OWNED_ITEMS_KEY) || "[]");
    const equipped: EquippedCosmetics = JSON.parse(
      localStorage.getItem(EQUIPPED_COSMETICS_KEY) || "{}"
    );

    return computeReaderStats(
      inferredChapterCount,
      Math.max(savedComments, extraReviewsCount),
      savedReactions,
      undefined,
      spentCoins,
      Array.isArray(ownedItems) ? ownedItems : [],
      equipped && typeof equipped === "object" ? equipped : {}
    );
  } catch {
    return computeReaderStats(0, extraReviewsCount, 0);
  }
}

export function buyOrEquipGuildItem(itemId: string): {
  success: boolean;
  message: string;
  stats: ReaderStats;
} {
  const item = getShopItemById(itemId);
  const current = getLocalReaderStats();
  if (!item || typeof window === "undefined") {
    return { success: false, message: "Artículo no encontrado", stats: current };
  }

  const owned = new Set<string>(current.ownedItems);
  let spent = current.spentCoins;

  if (!owned.has(item.id)) {
    if (current.coins < item.price) {
      return {
        success: false,
        message: `Te faltan ${item.price - current.coins} NekuCoins. ¡Lee capítulos (+20) o comenta (+40) para ganar más!`,
        stats: current,
      };
    }
    spent += item.price;
    owned.add(item.id);
    try {
      localStorage.setItem(SPENT_COINS_KEY, String(spent));
      localStorage.setItem(OWNED_ITEMS_KEY, JSON.stringify(Array.from(owned)));
    } catch {}
  }

  // Toggle or equip in its slot
  const nextEquipped: EquippedCosmetics = { ...current.equipped };
  if (item.category === "frame") {
    nextEquipped.frameId = nextEquipped.frameId === item.id ? undefined : item.id;
  } else if (item.category === "nameColor") {
    nextEquipped.nameColorId = nextEquipped.nameColorId === item.id ? undefined : item.id;
  } else if (item.category === "customTitle") {
    nextEquipped.customTitleId = nextEquipped.customTitleId === item.id ? undefined : item.id;
  }

  try {
    localStorage.setItem(EQUIPPED_COSMETICS_KEY, JSON.stringify(nextEquipped));
  } catch {}

  const updated = getLocalReaderStats();
  return {
    success: true,
    message: `¡${item.name} equipado en tu perfil y comentarios!`,
    stats: updated,
  };
}

export function recordChapterReadForRank(chapterId: string): {
  stats: ReaderStats;
  leveledUp: boolean;
  rankedUp: boolean;
} {
  if (typeof window === "undefined" || !chapterId) {
    return { stats: computeReaderStats(1), leveledUp: false, rankedUp: false };
  }
  const before = getLocalReaderStats();
  try {
    const rawSet = localStorage.getItem(READ_CHAPTERS_KEY);
    const readIds = new Set<string>(rawSet ? JSON.parse(rawSet) : []);
    readIds.add(chapterId);
    localStorage.setItem(READ_CHAPTERS_KEY, JSON.stringify(Array.from(readIds)));
  } catch {}
  const after = getLocalReaderStats();
  return {
    stats: after,
    leveledUp: after.level > before.level,
    rankedUp: after.currentRank.code !== before.currentRank.code,
  };
}

export function recordCommentForRank(): ReaderStats {
  if (typeof window === "undefined") return computeReaderStats(0, 1, 0);
  try {
    const prev = parseInt(localStorage.getItem(COMMENTS_COUNT_KEY) || "0", 10) || 0;
    localStorage.setItem(COMMENTS_COUNT_KEY, String(prev + 1));
  } catch {}
  return getLocalReaderStats();
}

export function recordReactionForRank(): ReaderStats {
  if (typeof window === "undefined") return computeReaderStats(0, 0, 1);
  try {
    const prev = parseInt(localStorage.getItem(REACTIONS_COUNT_KEY) || "0", 10) || 0;
    localStorage.setItem(REACTIONS_COUNT_KEY, String(prev + 1));
  } catch {}
  return getLocalReaderStats();
}

export function RankIcon({
  code,
  className = "w-3.5 h-3.5",
}: {
  code: ReaderRankTier["code"];
  className?: string;
}) {
  switch (code) {
    case "SS":
      return <Crown className={className} />;
    case "S":
      return <Sparkles className={className} />;
    case "A":
      return <Flame className={className} />;
    case "B":
      return <Zap className={className} />;
    case "C":
      return <Swords className={className} />;
    case "D":
      return <Compass className={className} />;
    default:
      return <Shield className={className} />;
  }
}

export function ReaderRankBadge({
  xp,
  chaptersRead,
  customTitleId,
  size = "sm",
  showLevel = true,
  compact = false,
}: {
  xp?: number;
  chaptersRead?: number;
  customTitleId?: string;
  size?: "xs" | "sm" | "md";
  showLevel?: boolean;
  compact?: boolean;
}) {
  const stats =
    typeof xp === "number"
      ? computeReaderStats(0, 0, 0, xp)
      : computeReaderStats(chaptersRead ?? 1, 0, 0);
  const { currentRank, level } = stats;
  const customTitleItem = getShopItemById(customTitleId);

  const sizeClasses =
    size === "xs"
      ? "px-2 py-0.5 text-[10px] gap-1 rounded-md"
      : size === "md"
      ? "px-3 py-1 text-xs gap-1.5 rounded-xl"
      : "px-2.5 py-0.5 text-[11px] gap-1.5 rounded-lg";

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 select-none">
      <span
        className={`inline-flex items-center font-bold tracking-wide border ${currentRank.bgClass} ${currentRank.borderClass} ${currentRank.textClass} ${sizeClasses}`}
        title={`Rango ${currentRank.code} · ${currentRank.title} (${stats.xp} XP)`}
      >
        <RankIcon code={currentRank.code} className={size === "xs" ? "w-2.5 h-2.5 opacity-80" : "w-3.5 h-3.5 opacity-80"} />
        <span>
          {compact ? `Rango ${currentRank.code}` : `Rango ${currentRank.code} · ${currentRank.title}`}
        </span>
        {showLevel && !compact && (
          <span className="opacity-70 font-semibold pl-1 border-l border-current/20">Nv.{level}</span>
        )}
      </span>
      {customTitleItem?.badgeText && !compact && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-white/10 bg-white/[0.04] text-zinc-300 text-[10px] font-semibold tracking-wide">
          {customTitleItem.badgeText}
        </span>
      )}
    </span>
  );
}
