"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
  Loader2,
  Star,
  Settings,
  ArrowLeft,
  BookOpen,
  MessageCircle,
  Trophy,
  Sparkles,
  Check,
  Lock,
} from "lucide-react";
import Link from "next/link";
import AvatarPicker from "@/components/AvatarPicker";
import { getAvatarSvg } from "@/lib/avatars";
import {
  READER_RANKS,
  ReaderRankBadge,
  RankIcon,
  getLocalReaderStats,
  ReaderStats,
} from "@/lib/readerRank";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [guestNick, setGuestNick] = useState<string>("Cazador");
  const [guestAvatar, setGuestAvatar] = useState<string>("hunter");
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<ReaderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      try {
        const savedNick = localStorage.getItem("nekumi_reader_nick") || "Cazador";
        const savedAv = localStorage.getItem("nekutoon_avatar_key") || "hunter";
        setGuestNick(savedNick);
        setGuestAvatar(savedAv);
      } catch {}

      const {
        data: { session },
      } = await supabase.auth.getSession();

      let userReviews: any[] = [];
      if (session?.user) {
        setUser(session.user);

        const [{ data: prof }, { data: revs }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
          supabase
            .from("reviews")
            .select("*, manhwas(title, cover_url)")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (prof) setProfile(prof);
        if (revs) {
          userReviews = revs;
          setReviews(revs);
        }
      }

      setStats(getLocalReaderStats(userReviews.length));
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const saveAvatar = async (key: string) => {
    setSaving(true);
    try {
      localStorage.setItem("nekutoon_avatar_key", key);
      setGuestAvatar(key);
    } catch {}

    if (user?.id) {
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          avatar_url: key,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        setProfile(data);
      }
    }
    setShowAvatarPicker(false);
    setSaving(false);
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#a855f7] animate-spin" />
      </div>
    );
  }

  const displayName =
    profile?.username || (user?.email ? user.email.split("@")[0] : guestNick);
  const activeAvatar = profile?.avatar_url || guestAvatar || "hunter";
  const { currentRank, nextRank, progressPercent, xpToNextRank } = stats;

  return (
    <div className="min-h-screen py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-[#c084fc]" /> Volver al Catálogo
        </Link>

        <Link href="/" className="brand" aria-label="Nekutoon Inicio">
          <span className="brand-word">
            Neku<span>toon</span>
          </span>
        </Link>
      </div>

      {/* Hunter / Monarch Rank Card */}
      <div className="glass rounded-[32px] p-6 sm:p-10 mb-8 relative overflow-hidden border border-white/10">
        <div
          className="absolute -top-20 -right-20 w-80 h-80 blur-[120px] rounded-full pointer-events-none opacity-35"
          style={{ background: currentRank.color }}
        />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-[26px] overflow-hidden border-2 bg-black/50 p-2 shadow-2xl"
              style={{ borderColor: currentRank.color, boxShadow: currentRank.glowStyle }}
              dangerouslySetInnerHTML={{ __html: getAvatarSvg(activeAvatar) }}
            />
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="absolute -bottom-2.5 -right-2.5 w-10 h-10 bg-[#a855f7] hover:bg-[#9333ea] rounded-xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
              title="Cambiar Avatar de Cazador"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
            </button>
          </div>

          {/* Info & XP Progress */}
          <div className="flex-1 w-full text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{displayName}</h1>
              <ReaderRankBadge xp={stats.xp} size="md" />
            </div>

            <p className="text-xs sm:text-sm text-white/55 mb-5">
              {currentRank.subtitle} · {user?.email || "Progreso sincronizado en este navegador"}
            </p>

            {/* XP Progress Bar */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-white/90 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c084fc]" />
                  Nivel {stats.level} · {stats.xp} XP Total
                </span>
                {nextRank ? (
                  <span className="text-white/60">
                    Faltan <strong className="text-white">{xpToNextRank} XP</strong> para{" "}
                    <strong style={{ color: nextRank.color }}>
                      Rango {nextRank.code} ({nextRank.title})
                    </strong>
                  </span>
                ) : (
                  <span className="text-fuchsia-300 font-extrabold">
                    Rango Máximo Alcanzado · Monarca de las Sombras
                  </span>
                )}
              </div>
              <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    background: "linear-gradient(90deg, #9333ea 0%, #e879f9 55%, #ec4899 100%)",
                    boxShadow: "0 0 14px rgba(232,121,249,0.6)",
                  }}
                />
              </div>
              <p className="text-[11px] text-white/45 mt-2">
                Cómo ganar XP: <strong>+10 XP</strong> por capítulo leído · <strong>+25 XP</strong> por reseña o comentario · <strong>+5 XP</strong> por reacción
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-center">
                <BookOpen className="w-4 h-4 text-[#c084fc] mx-auto mb-1" />
                <span className="block text-xl font-black text-white">{stats.chaptersRead}</span>
                <span className="text-[11px] text-white/50">Capítulos Leídos</span>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-center">
                <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="block text-xl font-black text-white">{stats.xp}</span>
                <span className="text-[11px] text-white/50">Puntos XP</span>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-center">
                <Sparkles className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                <span className="block text-xl font-black text-white">Nv. {stats.level}</span>
                <span className="text-[11px] text-white/50">Nivel de Lector</span>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-center">
                <MessageCircle className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                <span className="block text-xl font-black text-white">
                  {Math.max(stats.commentsCount, reviews.length)}
                </span>
                <span className="text-[11px] text-white/50">Aportes y Reseñas</span>
              </div>
            </div>
          </div>
        </div>

        {showAvatarPicker && (
          <div className="mt-8 p-6 bg-black/40 border border-[#a855f7]/35 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">Elige tu Avatar de Cazador</h3>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="text-white/50 hover:text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
            <AvatarPicker selected={activeAvatar} onChange={saveAvatar} />
          </div>
        )}
      </div>

      {/* Escalafón Oficial de Rangos Nekutoon */}
      <div className="glass rounded-[28px] p-6 sm:p-8 mb-8 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#c084fc]" />
              Escalafón de Rangos Nekutoon
            </h2>
            <p className="text-xs text-white/50">
              Sube de rango leyendo capítulos y participando en los comentarios de la comunidad
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {READER_RANKS.map((tier) => {
            const unlocked = stats.xp >= tier.minXp;
            const isCurrent = tier.code === currentRank.code;
            return (
              <div
                key={tier.code}
                className={`rounded-2xl p-4 border transition-all ${
                  isCurrent
                    ? `${tier.bgClass} ${tier.borderClass} scale-[1.02]`
                    : unlocked
                    ? "bg-white/[0.03] border-white/15"
                    : "bg-black/25 border-white/5 opacity-55"
                }`}
                style={isCurrent ? { boxShadow: tier.glowStyle } : undefined}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-black ${tier.textClass}`}
                  >
                    <RankIcon code={tier.code} className="w-4 h-4" />
                    Rango {tier.code}
                  </span>
                  {isCurrent ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/15 text-white">
                      ACTUAL
                    </span>
                  ) : unlocked ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-white/30" />
                  )}
                </div>
                <p className="text-sm font-extrabold text-white">{tier.title}</p>
                <p className="text-[11px] text-white/50 mb-2">{tier.subtitle}</p>
                <p className="text-[11px] font-bold text-white/70">
                  Requiere {tier.minXp} XP (~{tier.minChaptersHint} caps)
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mis Reseñas */}
      <div className="space-y-6">
        <h2 className="text-xl font-black flex items-center gap-2 text-white">
          <Star className="w-5 h-5 text-[#fbbf24]" /> Mis Reseñas Publicadas ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <div className="glass rounded-[24px] p-10 text-center text-white/50 text-sm border border-white/10">
            Aún no has publicado reseñas en fichas de manhwa. ¡Califica tus obras favoritas para ganar +25 XP!
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="glass rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 hover:bg-white/[0.02] transition-colors border border-white/10"
              >
                {rev.manhwas?.cover_url && (
                  <img
                    referrerPolicy="no-referrer"
                    src={rev.manhwas.cover_url}
                    alt="Cover"
                    className="w-20 h-28 object-cover rounded-xl shadow-lg flex-shrink-0 mx-auto sm:mx-0"
                  />
                )}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-2.5 gap-2">
                    <div>
                      <Link
                        href={`/manga/${rev.manhwa_id}`}
                        className="font-bold text-base sm:text-lg text-white hover:text-[#c084fc] transition-colors"
                      >
                        {rev.manhwas?.title || "Manhwa"}
                      </Link>
                      <p className="text-xs text-white/40">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex text-[#fbbf24] gap-0.5 bg-[#fbbf24]/10 px-2.5 py-1 rounded-lg">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? "fill-current" : "opacity-20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/75 text-sm leading-relaxed">{rev.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
