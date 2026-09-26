"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

export default function AntiAdblock() {
  const [detected, setDetected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // We delay the check slightly so the adblocker has time to block elements
    const timer = setTimeout(() => {
      checkAdblock();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const checkAdblock = async () => {
    let adblockEnabled = false;

    // METHOD 1: Honeypot element
    // Adblockers usually target these class names
    const baitClasses = [
      'ad-banner', 'ad-container', 'ad-slot', 'textads', 'pub_300x250', 
      'sponsor-post', 'banner-ad', 'adsbox'
    ];
    
    const bait = document.createElement("div");
    bait.innerHTML = "&nbsp;";
    bait.className = baitClasses.join(" ");
    bait.style.height = "10px";
    bait.style.width = "10px";
    bait.style.position = "absolute";
    bait.style.left = "-9999px";
    bait.style.top = "-9999px";
    document.body.appendChild(bait);

    // Wait a tiny bit for the extension to process DOM mutations
    await new Promise(r => setTimeout(r, 100));

    const computedStyle = window.getComputedStyle(bait);
    if (
      bait.offsetHeight === 0 ||
      computedStyle.display === "none" ||
      computedStyle.visibility === "hidden" ||
      !document.body.contains(bait)
    ) {
      adblockEnabled = true;
    }
    
    if (document.body.contains(bait)) {
      document.body.removeChild(bait);
    }

    // NOTE: We removed the network-based AdSense fetch test because
    // iOS Safari (ITP) and some browsers block requests to ad domains
    // by default — causing false positives for ALL iPhone users.
    // The DOM honeypot above is reliable enough to catch real adblockers.

    setDetected(adblockEnabled);
    setIsChecking(false);
  };

  const handleRefresh = () => {
    setIsChecking(true);
    setDetected(false);
    setTimeout(checkAdblock, 800);
  };

  if (!detected) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0a0a0a]/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-[#ef4444]/30 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_80px_rgba(239,68,68,0.15)] relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-500/20 blur-[60px] rounded-full pointer-events-none"></div>
        
        <div className="w-24 h-24 bg-gradient-to-b from-red-500/20 to-red-500/5 text-red-500 flex items-center justify-center rounded-full mx-auto mb-6 border border-red-500/20 relative z-10">
          <ShieldAlert size={48} className="drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 tracking-tight relative z-10 uppercase">
          Acceso Restringido
        </h2>
        
        <p className="text-[#a7a7b1] mb-6 font-medium relative z-10 text-sm sm:text-base leading-relaxed">
          Parece que estás usando <span className="text-white font-bold">Brave Shields</span> o un <span className="text-white font-bold">AdBlocker</span>. 
          Nekutoon se mantiene 100% gratuito gracias a la publicidad.
        </p>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-left relative z-10">
          <p className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Cómo solucionar esto:
          </p>
          <ul className="text-xs text-[#a7a7b1] space-y-2">
            <li>1. Toca el ícono del león (Brave) o el escudo (AdBlock) en tu navegador.</li>
            <li>2. Desactiva la protección para <strong>este sitio</strong>.</li>
            <li>3. Refresca la página para continuar leyendo.</li>
          </ul>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isChecking}
          className="w-full py-4 rounded-xl font-bold bg-[#ef4444] text-white hover:bg-[#dc2626] transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isChecking ? (
            <><RefreshCw size={20} className="animate-spin" /> Verificando...</>
          ) : (
            <><RefreshCw size={20} /> Ya lo desactivé (Recargar)</>
          )}
        </button>
      </div>
    </div>
  );
}
