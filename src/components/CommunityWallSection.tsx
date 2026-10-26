"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MessagesSquare,
  Send,
  EyeOff,
  Eye,
  Flame,
  Sparkles,
  BookOpen,
  Coins,
  ShoppingBag,
  Loader2,
  Plus,
  X as XIcon,
  Search,
} from "lucide-react";
import { getAvatarSvg } from "@/lib/avatars";
import {
  ReaderStats,
  ReaderRankBadge,
  recordCommentForRank,
  getShopItemById,
} from "@/lib/readerRank";

export interface WallPost {
  id: string;
  authorName: string;
  avatarKey: string;
  readerXp: number;
  frameId?: string;
  nameColorId?: string;
  customTitleId?: string;
  channel: "general" | "recomendaciones" | "teorias" | "spoilers";
  isSpoiler?: boolean;
  attachedManhwaId?: string;
  attachedManhwaTitle?: string;
  attachedManhwaCover?: string;
  content: string;
  likes: number;
  createdAt: string;
}

interface CommunityWallSectionProps {
  manhwas: any[];
  stats: ReaderStats | null;
  onStatsChange: (next: ReaderStats) => void;
  onOpenShop: () => void;
  userName?: string;
  userAvatar?: string;
}

export default function CommunityWallSection({
  manhwas,
  stats,
  onStatsChange,
  onOpenShop,
  userName = "Cazador",
  userAvatar = "hunter",
}: CommunityWallSectionProps) {
  const [remotePosts, setRemotePosts] = useState<WallPost[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>("all");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  // Composer state
  const [nick, setNick] = useState(userName);
  const [postChannel, setPostChannel] = useState<WallPost["channel"]>("general");
  const [content, setContent] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [showManhwaPicker, setShowManhwaPicker] = useState(false);
  const [manhwaSearch, setManhwaSearch] = useState("");
  const [attachedManhwa, setAttachedManhwa] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userName && userName !== "Cazador") setNick(userName);
  }, [userName]);

  useEffect(() => {
    fetch("/api/community?type=global_wall")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.posts)) {
          setRemotePosts(data.posts);
        }
      })
      .catch(() => {});

    try {
      const saved = JSON.parse(localStorage.getItem("nekutoon_liked_wall") || "[]");
      if (Array.isArray(saved)) setLikedPostIds(new Set(saved));
    } catch {}
  }, []);

  // Curated seed posts so the wall always looks alive and demonstrates features (spoilers, frames, ranks, attached manhwa)
  const seedPosts: WallPost[] = useMemo(() => {
    const sample1 = manhwas[0];
    const sample2 = manhwas[2] || manhwas[0];
    return [
      {
        id: "seed_wall_1",
        authorName: "SungJinWoo",
        avatarKey: "monarch",
        readerXp: 2650,
        frameId: "frame_abyss",
        nameColorId: "color_monarch",
        customTitleId: "title_shadow",
        channel: "recomendaciones",
        isSpoiler: false,
        attachedManhwaId: sample1?.id,
        attachedManhwaTitle: sample1?.title,
        attachedManhwaCover: sample1?.cover_url,
        content:
          "Si buscan una obra con ritmo brutal desde el primer capítulo y un arte de otro nivel, tienen que empezar esta hoy mismo. La velocidad de carga en Nekutoon vuela.",
        likes: 48,
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: "seed_wall_2",
        authorName: "AriaRoscent",
        avatarKey: "empress",
        readerXp: 1520,
        frameId: "frame_solar",
        nameColorId: "color_gold",
        customTitleId: "title_empress",
        channel: "spoilers",
        isSpoiler: true,
        attachedManhwaId: sample2?.id,
        attachedManhwaTitle: sample2?.title,
        attachedManhwaCover: sample2?.cover_url,
        content:
          "¡No puedo creer ese giro al final del último episodio! Cuando el protagonista descubre que el verdadero traidor era su propio maestro del gremio quedé en shock total.",
        likes: 34,
        createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      },
      {
        id: "seed_wall_3",
        authorName: "KaelenV",
        avatarKey: "knight",
        readerXp: 640,
        frameId: "frame_cyber",
        nameColorId: "color_cyan",
        customTitleId: "title_system",
        channel: "teorias",
        isSpoiler: false,
        content:
          "Acabo de canjear el Marco Relámpago Cian en la Tienda del Gremio solo leyendo capítulos esta semana. [spoiler]Mi teoría es que el jefe oculto del piso 100 es el antiguo Monarca[/spoiler] ¿ustedes qué opinan?",
        likes: 21,
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
    ];
  }, [manhwas]);

  const allPosts = useMemo(() => {
    return [...remotePosts, ...seedPosts];
  }, [remotePosts, seedPosts]);

  const filteredPosts = useMemo(() => {
    if (activeChannel === "all") return allPosts;
    return allPosts.filter((p) => p.channel === activeChannel);
  }, [allPosts, activeChannel]);

  const handleInsertSpoilerTag = () => {
    setContent((prev) => `${prev} [spoiler]escribe aquí el spoiler[/spoiler]`.trimStart());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);

    const updatedStats = recordCommentForRank();
    onStatsChange(updatedStats);

    const finalNick = nick.trim() || "Cazador";
    try {
      localStorage.setItem("nekumi_reader_nick", finalNick);
    } catch {}

    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "post_global_wall",
          authorName: finalNick,
          avatarKey: userAvatar || "hunter",
          readerXp: updatedStats.xp,
          frameId: updatedStats.equipped?.frameId,
          nameColorId: updatedStats.equipped?.nameColorId,
          customTitleId: updatedStats.equipped?.customTitleId,
          channel: isSpoiler ? "spoilers" : postChannel,
          isSpoiler,
          attachedManhwaId: attachedManhwa?.id,
          attachedManhwaTitle: attachedManhwa?.title,
          attachedManhwaCover: attachedManhwa?.cover_url,
          content: content.trim(),
        }),
      });
      const data = await res.json();
      if (Array.isArray(data?.posts)) {
        setRemotePosts(data.posts);
        setContent("");
        setIsSpoiler(false);
        setAttachedManhwa(null);
      }
    } catch {}
    setSubmitting(false);
  };

  const handleLikePost = (postId: string) => {
    if (likedPostIds.has(postId)) return;
    const next = new Set(likedPostIds);
    next.add(postId);
    setLikedPostIds(next);
    try {
      localStorage.setItem("nekutoon_liked_wall", JSON.stringify(Array.from(next)));
    } catch {}

    setRemotePosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p))
    );

    fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like_global_wall", postId }),
    }).catch(() => {});
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderMessageContent = (post: WallPost) => {
    const isFullRevealed = revealedIds.has(post.id);

    if (post.isSpoiler && !isFullRevealed) {
      return (
        <div
          onClick={() => toggleReveal(post.id)}
          className="relative rounded-2xl p-4 bg-black/50 border border-pink-500/35 cursor-pointer group overflow-hidden select-none"
        >
          <p className="text-xs sm:text-sm text-white/75 blur-md pointer-events-none">
            {post.content}
          </p>
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[3px] group-hover:bg-black/30 transition-colors">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/25 border border-pink-400/50 text-pink-200 text-xs font-black tracking-wide shadow-lg">
              <EyeOff className="w-3.5 h-3.5 text-pink-400" />
              ALERTA DE SPOILER · Clic para descubrir
            </span>
          </div>
        </div>
      );
    }

    // Parse inline [spoiler]...[/spoiler] tags
    const parts = post.content.split(/(\[spoiler\][\s\S]*?\[\/spoiler\])/gi);
    return (
      <p className="text-xs sm:text-sm text-white/85 leading-relaxed break-words">
        {parts.map((part, idx) => {
          const match = part.match(/^\[spoiler\]([\s\S]*?)\[\/spoiler\]$/i);
          if (!match) return <React.Fragment key={idx}>{part}</React.Fragment>;
          const inlineKey = `${post.id}_in_${idx}`;
          const isInlineRevealed = revealedIds.has(inlineKey);
          return (
            <span
              key={idx}
              onClick={() => toggleReveal(inlineKey)}
              title={isInlineRevealed ? "Clic para ocultar spoiler" : "Clic para revelar spoiler"}
              className={`inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg border cursor-pointer transition-all ${
                isInlineRevealed
                  ? "bg-purple-500/20 border-purple-400/40 text-purple-200"
                  : "bg-pink-500/20 border-pink-400/45 text-pink-200"
              }`}
            >
              {!isInlineRevealed ? (
                <>
                  <EyeOff className="w-3 h-3 text-pink-400 flex-shrink-0" />
                  <span className="blur-[5px] select-none">{match[1]}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-pink-300 ml-1">
                    Spoiler
                  </span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 text-purple-300 flex-shrink-0" />
                  <span>{match[1]}</span>
                </>
              )}
            </span>
          );
        })}
      </p>
    );
  };

  const filteredPickerManhwas = useMemo(() => {
    const q = manhwaSearch.trim().toLowerCase();
    if (!q) return manhwas.slice(0, 12);
    return manhwas
      .filter((m) => (m.title || "").toLowerCase().includes(q))
      .slice(0, 12);
  }, [manhwas, manhwaSearch]);

  return (
    <section id="muro-comunidad" className="section mt-10 mb-12" aria-labelledby="wallHeading">
      <div className="glass rounded-[28px] p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#a855f7]/15 blur-[120px] rounded-full pointer-events-none" />

        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a855f7]/15 border border-[#a855f7]/35 text-[#d8b4fe] text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Gremio en Vivo · Filtro Anti-Spoiler Activo
            </div>
            <h2 id="wallHeading" className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <MessagesSquare className="w-7 h-7 text-[#c084fc]" />
              Muro y Chat Global de Cazadores
            </h2>
            <p className="text-xs sm:text-sm text-white/55 mt-1">
              Comparte teorías, recomienda manhwas con protección anti-spoiler y presume tus marcos neón del Gremio
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {stats && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/15 border border-amber-400/35 text-amber-300 text-xs font-black">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{stats.coins} NekuCoins</span>
              </div>
            )}
            <button
              type="button"
              onClick={onOpenShop}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-[#a855f7]/25 to-pink-500/25 hover:from-amber-500/35 hover:to-pink-500/35 border border-amber-400/45 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span>Tienda del Gremio (Marcos y Colores)</span>
            </button>
          </div>
        </div>

        {/* Channel Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6 relative z-10">
          {[
            { id: "all", label: "Todos los Mensajes" },
            { id: "recomendaciones", label: "Recomendaciones" },
            { id: "teorias", label: "Debate y Teorías" },
            { id: "spoilers", label: "Zona Spoilers" },
          ].map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setActiveChannel(ch.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                activeChannel === ch.id
                  ? "bg-[#a855f7] text-white border-[#c084fc] shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "bg-black/35 text-white/60 border-white/10 hover:text-white hover:bg-white/5"
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Composer Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-black/45 border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 relative z-10 space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              maxLength={26}
              placeholder="Tu apodo de Cazador"
              className="sm:w-48 h-10 rounded-xl bg-black/50 border border-white/10 px-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#a855f7]"
            />

            <select
              value={postChannel}
              onChange={(e) => setPostChannel(e.target.value as any)}
              aria-label="Canal del mensaje"
              className="sm:w-48 h-10 rounded-xl bg-[#12141c] border border-white/10 px-3 text-xs font-bold text-white focus:outline-none focus:border-[#a855f7]"
            >
              <option value="general">Canal: General</option>
              <option value="recomendaciones">Canal: Recomendaciones</option>
              <option value="teorias">Canal: Debate y Teorías</option>
              <option value="spoilers">Canal: Spoilers</option>
            </select>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleInsertSpoilerTag}
                className="px-3 h-10 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/35 text-pink-300 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                title="Insertar texto oculto anti-spoiler"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>+ Etiqueta [Spoiler]</span>
              </button>

              <button
                type="button"
                onClick={() => setShowManhwaPicker(!showManhwaPicker)}
                className="px-3 h-10 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 text-purple-200 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{attachedManhwa ? "Cambiar Obra" : "+ Adjuntar Manhwa"}</span>
              </button>
            </div>
          </div>

          {attachedManhwa && (
            <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-[#a855f7]/15 border border-[#a855f7]/35">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  referrerPolicy="no-referrer"
                  src={attachedManhwa.cover_url}
                  alt={attachedManhwa.title}
                  className="w-7 h-10 object-cover rounded"
                />
                <span className="text-xs font-bold text-white truncate">
                  Recomendando: {attachedManhwa.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedManhwa(null)}
                className="text-white/60 hover:text-white"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {showManhwaPicker && (
            <div className="p-3 rounded-xl bg-[#0e1017] border border-white/10 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manhwaSearch}
                  onChange={(e) => setManhwaSearch(e.target.value)}
                  placeholder="Buscar obra para adjuntar..."
                  className="w-full h-8 rounded-lg bg-black/50 border border-white/10 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-[#a855f7]"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {filteredPickerManhwas.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setAttachedManhwa(m);
                      setShowManhwaPicker(false);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 hover:bg-[#a855f7]/25 border border-white/5 text-left transition-colors cursor-pointer"
                  >
                    <img
                      referrerPolicy="no-referrer"
                      src={m.cover_url}
                      alt={m.title}
                      className="w-7 h-9 object-cover rounded flex-shrink-0"
                    />
                    <span className="text-[11px] font-bold text-white truncate">{m.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={550}
              placeholder="Escribe tu mensaje para la comunidad (+25 XP y +40 NekuCoins)..."
              className="flex-1 h-11 rounded-xl bg-black/50 border border-white/10 px-4 text-xs sm:text-sm text-white focus:outline-none focus:border-[#a855f7]"
            />

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-bold text-pink-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={(e) => setIsSpoiler(e.target.checked)}
                className="accent-pink-500 w-3.5 h-3.5"
              />
              <span>Difuminar todo como Spoiler</span>
            </label>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="btn btn-primary h-11 px-6 rounded-xl text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Publicar</span>
            </button>
          </div>
        </form>

        {/* Posts Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {filteredPosts.map((post) => {
            const frameItem = getShopItemById(post.frameId);
            const colorItem = getShopItemById(post.nameColorId);
            const isLiked = likedPostIds.has(post.id);

            return (
              <article
                key={post.id}
                className="rounded-2xl p-4 sm:p-5 bg-[#121622]/90 border border-white/[0.08] hover:border-white/15 flex flex-col justify-between gap-3 transition-all"
              >
                <div>
                  {/* Author Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl overflow-hidden bg-black/60 p-0.5 flex-shrink-0 ${
                          frameItem ? frameItem.previewClass : "border border-white/15"
                        }`}
                        style={frameItem?.glowCss ? { boxShadow: frameItem.glowCss } : undefined}
                        dangerouslySetInnerHTML={{ __html: getAvatarSvg(post.avatarKey || "hunter") }}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs sm:text-sm font-black truncate ${
                              colorItem ? colorItem.previewClass : "text-white"
                            }`}
                          >
                            {post.authorName}
                          </span>
                          <ReaderRankBadge
                            xp={post.readerXp || 120}
                            customTitleId={post.customTitleId}
                            size="xs"
                          />
                        </div>
                        <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
                          #{post.channel} · {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLikePost(post.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        isLiked
                          ? "bg-orange-500/20 border-orange-400/50 text-orange-300"
                          : "bg-white/5 border-white/10 text-white/65 hover:text-white"
                      }`}
                    >
                      <Flame className={`w-3.5 h-3.5 ${isLiked ? "fill-current text-orange-400" : ""}`} />
                      <span>{(post.likes || 0) + (isLiked ? 1 : 0)}</span>
                    </button>
                  </div>

                  {/* Message Content with Spoiler Blur Protection */}
                  {renderMessageContent(post)}
                </div>

                {/* Attached Manhwa Recommendation Pill */}
                {post.attachedManhwaId && post.attachedManhwaTitle && (
                  <Link
                    href={`/manga/${post.attachedManhwaId}`}
                    className="mt-2 flex items-center gap-3 p-2.5 rounded-xl bg-black/45 hover:bg-[#a855f7]/20 border border-white/10 hover:border-[#a855f7]/45 transition-all group"
                  >
                    {post.attachedManhwaCover && (
                      <img
                        referrerPolicy="no-referrer"
                        src={post.attachedManhwaCover}
                        alt={post.attachedManhwaTitle}
                        className="w-8 h-11 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#c084fc] block">
                        Obra Recomendada
                      </span>
                      <p className="text-xs font-bold text-white truncate group-hover:text-[#e879f9]">
                        {post.attachedManhwaTitle}
                      </p>
                    </div>
                    <span className="text-[11px] font-extrabold text-white/70 group-hover:text-white pr-1">
                      Ver obra
                    </span>
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
