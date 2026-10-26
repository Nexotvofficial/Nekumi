"use client";

import React, { useState } from "react";
import {
  X as XIcon,
  Coins,
  Sparkles,
  Check,
  ShoppingBag,
  Crown,
  Palette,
  Award,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import { getAvatarSvg } from "@/lib/avatars";
import {
  GUILD_SHOP_ITEMS,
  GuildShopItem,
  ReaderStats,
  ReaderRankBadge,
  buyOrEquipGuildItem,
  getShopItemById,
} from "@/lib/readerRank";

interface GuildShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: ReaderStats;
  onStatsChange: (nextStats: ReaderStats) => void;
  userName?: string;
  userAvatar?: string;
}

export default function GuildShopModal({
  isOpen,
  onClose,
  stats,
  onStatsChange,
  userName = "Cazador",
  userAvatar = "hunter",
}: GuildShopModalProps) {
  const [activeTab, setActiveTab] = useState<"frame" | "nameColor" | "customTitle">("frame");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = GUILD_SHOP_ITEMS.filter((item) => item.category === activeTab);
  const equippedFrame = getShopItemById(stats.equipped?.frameId);
  const equippedNameColor = getShopItemById(stats.equipped?.nameColorId);

  const handleAction = (item: GuildShopItem) => {
    const res = buyOrEquipGuildItem(item.id);
    onStatsChange(res.stats);
    setFeedbackMsg(res.message);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div
      className="fixed inset-0 z-[9995] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#11141d] border border-white/15 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#a855f7]/20 via-[#11141d] to-amber-500/15">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black shadow-[0_0_24px_rgba(251,191,36,0.45)]">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">Tienda del Gremio Nekutoon</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                  100% Gratis por Leer
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Canjea tus NekuCoins ganadas leyendo capítulos y comentando por marcos neón, colores de apodo y títulos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-300 font-black text-sm shadow-[0_0_18px_rgba(251,191,36,0.2)]">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{stats.coins}</span>
              <span className="text-[11px] font-bold text-amber-200/75">NekuCoins</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Preview Bar */}
        <div className="px-6 py-4 bg-black/45 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl overflow-hidden bg-black/60 p-1 transition-all ${
                equippedFrame ? equippedFrame.previewClass : "border border-white/15"
              }`}
              style={equippedFrame?.glowCss ? { boxShadow: equippedFrame.glowCss } : undefined}
              dangerouslySetInnerHTML={{ __html: getAvatarSvg(userAvatar || "hunter") }}
            />
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-white/40 block mb-0.5">
                Vista Previa en Comentarios y Muro Global
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm sm:text-base font-black ${
                    equippedNameColor ? equippedNameColor.previewClass : "text-white"
                  }`}
                >
                  {userName || "Cazador"}
                </span>
                <ReaderRankBadge
                  xp={stats.xp}
                  customTitleId={stats.equipped?.customTitleId}
                  size="xs"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/60">
            <span className="inline-flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              <BookOpen className="w-3.5 h-3.5 text-[#c084fc]" /> +20 Coins / capítulo
            </span>
            <span className="inline-flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> +40 Coins / comentario
            </span>
          </div>
        </div>

        {feedbackMsg && (
          <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#a855f7]/25 to-amber-500/20 border border-[#a855f7]/50 text-xs font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Category Tabs */}
        <div className="px-6 pt-4 flex flex-wrap gap-2">
          {[
            { id: "frame", label: "Marcos de Avatar Neón", Icon: Crown },
            { id: "nameColor", label: "Colores de Apodo", Icon: Palette },
            { id: "customTitle", label: "Títulos Especiales", Icon: Award },
          ].map((t) => {
            const IconComp = t.Icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  active
                    ? "bg-[#a855f7] text-white border-[#c084fc] shadow-[0_0_16px_rgba(168,85,247,0.4)]"
                    : "bg-white/5 text-white/65 border-white/10 hover:text-white hover:bg-white/10"
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Items Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isOwned = stats.ownedItems.includes(item.id);
            const isEquipped =
              stats.equipped?.frameId === item.id ||
              stats.equipped?.nameColorId === item.id ||
              stats.equipped?.customTitleId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-2xl p-4 border transition-all flex flex-col justify-between gap-4 ${
                  isEquipped
                    ? "bg-[#a855f7]/15 border-[#c084fc]/60 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                    : "bg-black/35 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Visual Preview */}
                  {item.category === "frame" && (
                    <div
                      className={`w-14 h-14 rounded-2xl overflow-hidden bg-black/60 p-1 flex-shrink-0 ${item.previewClass}`}
                      style={item.glowCss ? { boxShadow: item.glowCss } : undefined}
                      dangerouslySetInnerHTML={{ __html: getAvatarSvg(userAvatar || "hunter") }}
                    />
                  )}
                  {item.category === "nameColor" && (
                    <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <span className={`text-lg font-black ${item.previewClass}`}>Aa</span>
                    </div>
                  )}
                  {item.category === "customTitle" && (
                    <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-[#c084fc]" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-white truncate">{item.name}</h3>
                      {isEquipped && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                          EQUIPADO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/55 mt-1 leading-relaxed">{item.description}</p>
                    {item.category === "nameColor" && (
                      <p className={`text-xs font-black mt-1.5 ${item.previewClass}`}>
                        {userName || "SungJinWoo"}
                      </p>
                    )}
                    {item.category === "customTitle" && item.badgeText && (
                      <span
                        className={`inline-block mt-1.5 px-2 py-0.5 rounded-md border text-[10px] font-black ${item.previewClass}`}
                      >
                        {item.badgeText}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-300">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    {isOwned ? "Adquirido" : `${item.price} NekuCoins`}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleAction(item)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      isEquipped
                        ? "bg-white/10 text-white hover:bg-white/15"
                        : isOwned
                        ? "bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/35"
                        : stats.coins >= item.price
                        ? "bg-gradient-to-r from-[#a855f7] to-[#ec4899] text-white shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:scale-105"
                        : "bg-white/5 text-white/40 border border-white/10"
                    }`}
                  >
                    {isEquipped ? (
                      <>Quitar</>
                    ) : isOwned ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Equipar
                      </>
                    ) : (
                      <>Canjear ({item.price})</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
