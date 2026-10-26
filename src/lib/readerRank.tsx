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
    color: "#94a3b8",
    borderClass: "border-slate-400/35",
    bgClass: "bg-slate-500/15",
    textClass: "text-slate-300",
    glowStyle: "0 0 12px rgba(148,163,184,0.18)",
  },
  {
    code: "D",
    title: "Explorador",
    subtitle: "Rastreador de Mazmorras",
    minXp: 50,
    minChaptersHint: 5,
    color: "#34d399",
    borderClass: "border-emerald-400/40",
    bgClass: "bg-emerald-500/15",
    textClass: "text-emerald-300",
    glowStyle: "0 0 14px rgba(52,211,153,0.25)",
  },
  {
    code: "C",
    title: "Cazador",
    subtitle: "Vanguardia del Gremio",
    minXp: 150,
    minChaptersHint: 15,
    color: "#38bdf8",
    borderClass: "border-sky-400/45",
    bgClass: "bg-sky-500/15",
    textClass: "text-sky-300",
    glowStyle: "0 0 16px rgba(56,189,248,0.28)",
  },
  {
    code: "B",
    title: "Cazador Élite",
    subtitle: "Capitán de Incursión",
    minXp: 350,
    minChaptersHint: 35,
    color: "#a855f7",
    borderClass: "border-purple-400/50",
    bgClass: "bg-purple-500/20",
    textClass: "text-purple-300",
    glowStyle: "0 0 18px rgba(168,85,247,0.35)",
  },
  {
    code: "A",
    title: "Gran Maestro",
    subtitle: "Comandante de Orden",
    minXp: 700,
    minChaptersHint: 70,
    color: "#ec4899",
    borderClass: "border-pink-400/55",
    bgClass: "bg-pink-500/20",
    textClass: "text-pink-300",
    glowStyle: "0 0 20px rgba(236,72,153,0.38)",
  },
  {
    code: "S",
    title: "Soberano",
    subtitle: "Autoridad Nacional",
    minXp: 1300,
    minChaptersHint: 130,
    color: "#fbbf24",
    borderClass: "border-amber-400/60",
    bgClass: "bg-amber-500/20",
    textClass: "text-amber-300",
    glowStyle: "0 0 22px rgba(251,191,36,0.42)",
  },
  {
    code: "SS",
    title: "Monarca",
    subtitle: "Monarca de las Sombras",
    minXp: 2500,
    minChaptersHint: 250,
    color: "#e879f9",
    borderClass: "border-fuchsia-400/75",
    bgClass: "bg-gradient-to-r from-purple-600/30 via-fuchsia-500/25 to-amber-500/25",
    textClass: "text-fuchsia-200",
    glowStyle: "0 0 26px rgba(232,121,249,0.55)",
  },
];

export interface ReaderStats {
  chaptersRead: number;
  commentsCount: number;
  reactionsCount: number;
  xp: number;
  level: number;
  currentRank: ReaderRankTier;
  nextRank: ReaderRankTier | null;
  progressPercent: number;
  xpToNextRank: number;
}

const READ_CHAPTERS_KEY = "nekutoon_read_chapters_v1";
const COMMENTS_COUNT_KEY = "nekutoon_comments_count_v1";
const REACTIONS_COUNT_KEY = "nekutoon_reactions_count_v1";

/**
 * Computes reader rank, level, and progress from XP or raw counts.
 */
export function computeReaderStats(
  chaptersRead: number,
  commentsCount = 0,
  reactionsCount = 0,
  overrideXp?: number
): ReaderStats {
  const safeChapters = Math.max(0, Math.floor(chaptersRead || 0));
  const safeComments = Math.max(0, Math.floor(commentsCount || 0));
  const safeReactions = Math.max(0, Math.floor(reactionsCount || 0));

  const xp =
    typeof overrideXp === "number" && overrideXp >= 0
      ? Math.floor(overrideXp)
      : safeChapters * 10 + safeComments * 25 + safeReactions * 5;

  // Level scales smoothly: Level 1 at 0 XP, +1 level every 30 XP early on
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
    level,
    currentRank,
    nextRank,
    progressPercent,
    xpToNextRank,
  };
}

/**
 * Reads local storage and reconciles any existing reading history so returning readers
 * immediately get credit for chapters they already read.
 */
export function getLocalReaderStats(extraReviewsCount = 0): ReaderStats {
  if (typeof window === "undefined") {
    return computeReaderStats(0, extraReviewsCount, 0);
  }

  try {
    const rawSet = localStorage.getItem(READ_CHAPTERS_KEY);
    const readIds = new Set<string>(rawSet ? JSON.parse(rawSet) : []);

    // Also harvest existing nekumi_reading_history & nekumi_last_read_* keys
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

    return computeReaderStats(
      inferredChapterCount,
      Math.max(savedComments, extraReviewsCount),
      savedReactions
    );
  } catch {
    return computeReaderStats(0, extraReviewsCount, 0);
  }
}

/**
 * Records a chapter read and returns updated stats + whether the user ranked up.
 */
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
  size = "sm",
  showLevel = true,
}: {
  xp?: number;
  chaptersRead?: number;
  size?: "xs" | "sm" | "md";
  showLevel?: boolean;
}) {
  const stats =
    typeof xp === "number"
      ? computeReaderStats(0, 0, 0, xp)
      : computeReaderStats(chaptersRead ?? 1, 0, 0);
  const { currentRank, level } = stats;

  const sizeClasses =
    size === "xs"
      ? "px-2 py-0.5 text-[10px] gap-1 rounded-md"
      : size === "md"
      ? "px-3 py-1 text-xs gap-1.5 rounded-xl"
      : "px-2.5 py-0.5 text-[11px] gap-1.5 rounded-lg";

  return (
    <span
      className={`inline-flex items-center font-extrabold tracking-wide border ${currentRank.bgClass} ${currentRank.borderClass} ${currentRank.textClass} ${sizeClasses} select-none`}
      style={{ boxShadow: currentRank.glowStyle }}
      title={`Rango ${currentRank.code} · ${currentRank.title} (${stats.xp} XP)`}
    >
      <RankIcon code={currentRank.code} className={size === "xs" ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />
      <span>
        Rango {currentRank.code} · {currentRank.title}
      </span>
      {showLevel && (
        <span className="opacity-80 font-black pl-1 border-l border-current/25">Nv.{level}</span>
      )}
    </span>
  );
}
