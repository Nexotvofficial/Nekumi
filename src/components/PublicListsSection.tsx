"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  Heart,
  Plus,
  X as XIcon,
  Search,
  Check,
  Shield,
  Sparkles,
  Library,
  Star,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { getAvatarSvg } from "@/lib/avatars";
import { ReaderRankBadge, getLocalReaderStats, recordCommentForRank } from "@/lib/readerRank";

export interface PublicListItem {
  id: string;
  title: string;
  description: string;
  authorName: string;
  avatarKey: string;
  readerXp: number;
  isAdult: boolean;
  manhwaIds: string[];
  totalWorksCount?: number;
  views: number;
  likes: number;
  createdAt?: string;
}

interface PublicListsSectionProps {
  manhwas: any[];
  isAdultConfirmed: boolean;
  onRequireAdultConfirm: (onUnlocked: () => void) => void;
  userName?: string;
  userAvatar?: string;
}

export default function PublicListsSection({
  manhwas,
  isAdultConfirmed,
  onRequireAdultConfirm,
  userName = "Cazador",
  userAvatar = "hunter",
}: PublicListsSectionProps) {
  const [customLists, setCustomLists] = useState<PublicListItem[]>([]);
  const [activeList, setActiveList] = useState<PublicListItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAuthor, setNewAuthor] = useState(userName);
  const [newIsAdult, setNewIsAdult] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userName && userName !== "Cazador") {
      setNewAuthor(userName);
    }
  }, [userName]);

  useEffect(() => {
    fetch("/api/community?type=public_lists")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.lists)) {
          setCustomLists(data.lists);
        }
      })
      .catch(() => {});

    try {
      const savedLikes = JSON.parse(localStorage.getItem("nekutoon_liked_lists") || "[]");
      if (Array.isArray(savedLikes)) setLikedIds(new Set(savedLikes));
    } catch {}
  }, []);

  // Build curated default lists dynamically from real catalog manhwas so covers always work
  const curatedLists: PublicListItem[] = useMemo(() => {
    if (!manhwas || manhwas.length === 0) return [];

    const byGenre = (kw: string, fallbackOffset = 0) => {
      const matches = manhwas.filter((m) =>
        (m.genre || "").toLowerCase().includes(kw.toLowerCase())
      );
      const pool = matches.length >= 4 ? matches : manhwas.slice(fallbackOffset);
      return pool.slice(0, 24).map((m) => String(m.id));
    };

    const actionSystemIds = byGenre("acción", 0);
    const fantasyIds = byGenre("fantasía", 4);
    const romanceIds = byGenre("romance", 8);
    const isekaiIds = byGenre("isekai", 12);
    const adultIds = byGenre("+18", 16);
    const dramaIds = byGenre("drama", 20);

    return [
      {
        id: "curated_system_op",
        title: "Manhwas de Sistema que no te puedes perder",
        description:
          "¡Sube de nivel tu lista de lectura! Mi selección personal con los mejores manhwas de Sistema, Mazmorras y Cazadores.",
        authorName: "Sistema",
        avatarKey: "monarch",
        readerXp: 2850,
        isAdult: false,
        manhwaIds: actionSystemIds,
        totalWorksCount: Math.max(19, actionSystemIds.length),
        views: 1306,
        likes: 214,
      },
      {
        id: "curated_adult_1",
        title: "+18 Selección Especial Nocturna",
        description:
          "Obras adultas seleccionadas con el mejor arte, romance intenso y tramas sin censura para mayores de edad.",
        authorName: "PolloFS98",
        avatarKey: "shadow",
        readerXp: 920,
        isAdult: true,
        manhwaIds: adultIds,
        totalWorksCount: 77,
        views: 2260,
        likes: 389,
      },
      {
        id: "curated_regression",
        title: "Guía de Supervivencia, Academia y Regresión",
        description:
          "Protagonistas que regresan en el tiempo o reencarnan como extras en academias mágicas y cambian su destino.",
        authorName: "SungJinWoo",
        avatarKey: "hunter",
        readerXp: 1640,
        isAdult: false,
        manhwaIds: isekaiIds.length >= 4 ? isekaiIds : fantasyIds,
        totalWorksCount: 34,
        views: 1840,
        likes: 295,
      },
      {
        id: "curated_adult_2",
        title: "Archivo Prohibido Sin NTR (+18)",
        description:
          "Obras completamente autorizadas y comprobadas por la comunidad con protagonistas decididos y excelente dibujo.",
        authorName: "LaGorda",
        avatarKey: "mage",
        readerXp: 810,
        isAdult: true,
        manhwaIds: adultIds.slice().reverse(),
        totalWorksCount: 100,
        views: 1175,
        likes: 198,
      },
      {
        id: "curated_villainess",
        title: "Villanas Imperiales y Romance de Fantasía",
        description:
          "Duques del norte, contratos matrimoniales, venganza aristocrática y las mejores protagonistas estrategas.",
        authorName: "AriaRoscent",
        avatarKey: "empress",
        readerXp: 1490,
        isAdult: false,
        manhwaIds: romanceIds,
        totalWorksCount: 28,
        views: 980,
        likes: 176,
      },
      {
        id: "curated_dark_action",
        title: "Artes Marciales, Murim y Venganza Absoluta",
        description:
          "Sectas demoníacas, espadas legendarias y batallas épicas sin relleno desde el primer capítulo.",
        authorName: "KaelenV",
        avatarKey: "knight",
        readerXp: 540,
        isAdult: false,
        manhwaIds: dramaIds.length >= 4 ? dramaIds : fantasyIds.slice(2),
        totalWorksCount: 22,
        views: 1045,
        likes: 162,
      },
    ];
  }, [manhwas]);

  const allLists = useMemo(() => {
    return [...customLists, ...curatedLists];
  }, [customLists, curatedLists]);

  const manhwaMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const m of manhwas) {
      map.set(String(m.id), m);
    }
    return map;
  }, [manhwas]);

  const handleOpenList = (list: PublicListItem) => {
    const openNow = () => {
      setActiveList(list);
      fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interact_public_list",
          listId: list.id,
          subAction: "view",
        }),
      }).catch(() => {});
    };

    if (list.isAdult && !isAdultConfirmed) {
      onRequireAdultConfirm(openNow);
    } else {
      openNow();
    }
  };

  const handleLikeList = (list: PublicListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedIds.has(list.id)) return;
    const next = new Set(likedIds);
    next.add(list.id);
    setLikedIds(next);
    try {
      localStorage.setItem("nekutoon_liked_lists", JSON.stringify([...next]));
    } catch {}

    setCustomLists((prev) =>
      prev.map((l) => (l.id === list.id ? { ...l, likes: (l.likes || 0) + 1 } : l))
    );
    if (activeList?.id === list.id) {
      setActiveList({ ...activeList, likes: (activeList.likes || 0) + 1 });
    }

    fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "interact_public_list",
        listId: list.id,
        subAction: "like",
      }),
    }).catch(() => {});
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || selectedIds.length === 0) return;
    setSubmitting(true);

    const stats = recordCommentForRank();
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_public_list",
          title: newTitle.trim(),
          description: newDesc.trim(),
          authorName: newAuthor.trim() || "Cazador",
          avatarKey: userAvatar || "hunter",
          readerXp: stats.xp,
          isAdult: newIsAdult,
          manhwaIds: selectedIds,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data?.lists)) {
        setCustomLists(data.lists);
        setShowCreateModal(false);
        setNewTitle("");
        setNewDesc("");
        setSelectedIds([]);
      }
    } catch {}
    setSubmitting(false);
  };

  const pickerResults = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return manhwas.slice(0, 24);
    return manhwas
      .filter(
        (m) =>
          (m.title || "").toLowerCase().includes(q) ||
          (m.genre || "").toLowerCase().includes(q)
      )
      .slice(0, 24);
  }, [manhwas, pickerQuery]);

  const togglePickManhwa = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <section id="listas-publicas" className="section mt-8 mb-10" aria-labelledby="publicListsTitle">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Colecciones de la Comunidad
          </div>
          <h2 id="publicListsTitle" className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Library className="w-7 h-7 text-[#c084fc]" />
            Listas Públicas
          </h2>
          <p className="text-xs sm:text-sm text-white/55 mt-1">
            Explora selecciones creadas por lectores de Nekutoon o publica tu propia lista (+25 XP)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary rounded-2xl px-5 py-3 text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Crear Lista Pública
        </button>
      </div>

      {/* Grid of Public Lists (LectorXD 3-column style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {allLists.map((list) => {
          const resolvedManhwas = list.manhwaIds
            .map((id) => manhwaMap.get(String(id)))
            .filter(Boolean);
          const previewFour = resolvedManhwas.slice(0, 4);
          const showAdultMask = list.isAdult && !isAdultConfirmed;
          const countLabel = list.totalWorksCount || resolvedManhwas.length || list.manhwaIds.length;
          const isLiked = likedIds.has(list.id);

          return (
            <article
              key={list.id}
              onClick={() => handleOpenList(list)}
              className="group rounded-[22px] bg-[#131722]/90 hover:bg-[#171c29] border border-white/[0.08] hover:border-[#a855f7]/50 overflow-hidden transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-[0_14px_35px_rgba(0,0,0,0.35)] hover:-translate-y-1"
            >
              <div>
                {/* Top 4-Slice Cover Collage or +18 Adult Shield Tiles */}
                <div className="relative h-44 sm:h-48 w-full grid grid-cols-4 overflow-hidden bg-[#0b0e14] border-b border-white/[0.06]">
                  {/* Floating • PÚBLICA Badge */}
                  <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-emerald-500/35 text-[10px] font-black uppercase tracking-wider text-emerald-400 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    PÚBLICA
                  </div>

                  {showAdultMask
                    ? [0, 1, 2, 3].map((slot) => (
                        <div
                          key={slot}
                          className="h-full flex flex-col items-center justify-center border-r last:border-r-0 border-white/[0.05] bg-gradient-to-b from-[#1e2430] via-[#151a24] to-[#0e121a] px-2 text-center select-none group-hover:from-[#252c3b] transition-colors"
                        >
                          <span className="text-xl sm:text-2xl font-black text-[#f59e0b] tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.35)]">
                            +18
                          </span>
                          <span className="text-[10px] text-white/55 font-medium mt-1 leading-tight">
                            Contenido adulto
                          </span>
                        </div>
                      ))
                    : [0, 1, 2, 3].map((slot) => {
                        const m = previewFour[slot] || previewFour[slot % Math.max(1, previewFour.length)];
                        return (
                          <div
                            key={slot}
                            className="relative h-full overflow-hidden border-r last:border-r-0 border-black/40"
                          >
                            {m ? (
                              <img
                                referrerPolicy="no-referrer"
                                src={m.cover_url}
                                alt={m.title}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-white/5" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#131722] via-transparent to-transparent opacity-45" />
                          </div>
                        );
                      })}
                </div>

                {/* Card Body */}
                <div className="p-5">
                  {/* Author Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full overflow-hidden border border-[#a855f7]/50 bg-black/50 flex-shrink-0"
                        dangerouslySetInnerHTML={{ __html: getAvatarSvg(list.avatarKey || "hunter") }}
                      />
                      <span className="text-xs font-extrabold text-[#fb923c] truncate">
                        {list.authorName}
                      </span>
                    </div>
                    <ReaderRankBadge xp={list.readerXp || 200} size="xs" showLevel={false} />
                  </div>

                  {/* List Title */}
                  <h3 className="text-base sm:text-lg font-black text-white group-hover:text-[#c084fc] transition-colors line-clamp-1 mb-1.5">
                    {list.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed min-h-[36px]">
                    {list.description}
                  </p>
                </div>
              </div>

              {/* Card Footer Metrics */}
              <div className="px-5 py-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/50">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-white/45" />
                    {countLabel} obras
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Eye className="w-3.5 h-3.5 text-white/45" />
                    {(list.views || 1) + (isLiked ? 1 : 0)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleLikeList(list, e)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    isLiked
                      ? "bg-pink-500/20 text-pink-300 border border-pink-500/40"
                      : "bg-white/5 hover:bg-white/10 text-white/65"
                  }`}
                >
                  <Heart className={`w-3 h-3 ${isLiked ? "fill-current text-pink-400" : ""}`} />
                  <span>{(list.likes || 0) + (isLiked ? 1 : 0)}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal: View Public List Works */}
      {activeList && (
        <div
          className="fixed inset-0 z-[9990] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveList(null)}
        >
          <div
            className="bg-[#12151f] border border-white/15 rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-gradient-to-r from-[#a855f7]/15 via-transparent to-[#ec4899]/10">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-black uppercase text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Lista Pública
                  </span>
                  <span className="text-xs font-bold text-[#fb923c]">Por {activeList.authorName}</span>
                  <ReaderRankBadge xp={activeList.readerXp || 200} size="xs" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">{activeList.title}</h3>
                <p className="text-xs sm:text-sm text-white/65 mt-1">{activeList.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveList(null)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors flex-shrink-0"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {activeList.manhwaIds
                .map((id) => manhwaMap.get(String(id)))
                .filter(Boolean)
                .map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/manga/${item.id}`}
                    onClick={() => setActiveList(null)}
                    className="group rounded-2xl bg-black/40 border border-white/10 hover:border-[#a855f7]/50 overflow-hidden flex flex-col transition-all hover:-translate-y-1"
                  >
                    <div className="aspect-[2/3] relative overflow-hidden">
                      <img
                        referrerPolicy="no-referrer"
                        src={item.cover_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {Number(item.score) > 0 && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[#fbbf24] text-[10px] font-black inline-flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          {Number(item.score).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#c084fc]">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-white/45 truncate mt-0.5">{item.genre}</p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Public List */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[9990] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-[#12151f] border border-white/15 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#c084fc]" />
                  Crear Nueva Lista Pública
                </h3>
                <p className="text-xs text-white/55 mt-0.5">
                  Comparte tus recomendaciones con todos los lectores de Nekutoon (+25 XP)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/75 mb-1">
                    Título de tu Lista *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={70}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ej. Mejores Manhwas de Nigromantes"
                    className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#a855f7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/75 mb-1">
                    Tu Apodo de Creador
                  </label>
                  <input
                    type="text"
                    maxLength={28}
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Tu apodo"
                    className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#a855f7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/75 mb-1">
                  Descripción breve
                </label>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="¿Por qué recomiendas estas obras?"
                  className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#a855f7] resize-none"
                />
              </div>

              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newIsAdult}
                  onChange={(e) => setNewIsAdult(e.target.checked)}
                  className="accent-[#ec4899] w-4 h-4 rounded"
                />
                <span className="text-xs font-bold text-pink-400">
                  Marcar lista como Contenido Adulto (+18)
                </span>
              </label>

              {/* Manhwa Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-white/80">
                    Selecciona las obras ({selectedIds.length} elegidas, mínimo 4 recomendadas) *
                  </label>
                </div>
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="Buscar manhwa para agregar a la lista..."
                    className="w-full h-9 rounded-xl bg-black/40 border border-white/10 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#a855f7]"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                  {pickerResults.map((m) => {
                    const checked = selectedIds.includes(String(m.id));
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => togglePickManhwa(String(m.id))}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          checked
                            ? "bg-[#a855f7]/25 border-[#a855f7] text-white"
                            : "bg-black/30 border-white/10 text-white/75 hover:bg-white/5"
                        }`}
                      >
                        <img
                          referrerPolicy="no-referrer"
                          src={m.cover_url}
                          alt={m.title}
                          className="w-9 h-12 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold truncate">{m.title}</p>
                          <p className="text-[10px] text-white/45 truncate">{m.genre}</p>
                        </div>
                        {checked && <Check className="w-4 h-4 text-[#c084fc] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white/75"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTitle.trim() || selectedIds.length === 0}
                  className="btn btn-primary px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 disabled:opacity-40"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Publicar Lista ({selectedIds.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
