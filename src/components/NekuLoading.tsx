import React from 'react';

export default function NekuLoading({ fullScreen = true }: { fullScreen?: boolean }) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f]"
    : "flex flex-col items-center justify-center w-full py-20";

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      {/* Animación suave y natural del Muñequito leyendo */}
      <div className="relative w-28 h-28 neku-mascot-float">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(168,85,247,0.45)]">
          {/* Cabeza */}
          <circle cx="50" cy="40" r="30" fill="#f3e8ff" />
          {/* Orejitas de gato/zorro */}
          <polygon points="25,20 15,0 40,15" fill="#a855f7" />
          <polygon points="75,20 85,0 60,15" fill="#a855f7" />
          {/* Ojos estilo Anime (parpadeo natural cada 4.5s) */}
          <ellipse cx="35" cy="40" rx="4" ry="6" fill="#121216" className="neku-mascot-eye" />
          <ellipse cx="65" cy="40" rx="4" ry="6" fill="#121216" className="neku-mascot-eye" />
          <circle cx="33.5" cy="38" r="1.4" fill="#fff" className="neku-mascot-eye" />
          <circle cx="63.5" cy="38" r="1.4" fill="#fff" className="neku-mascot-eye" />
          {/* Sonrisa */}
          <path d="M 45 50 Q 50 55 55 50" stroke="#121216" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Librito que sostiene */}
          <rect x="25" y="60" width="50" height="30" rx="3" fill="#ec4899" />
          <line x1="50" y1="60" x2="50" y2="90" stroke="#fff" strokeWidth="2" />
          <line x1="30" y1="67" x2="45" y2="67" stroke="#fbcfe8" strokeWidth="2" strokeLinecap="round" />
          <line x1="55" y1="67" x2="70" y2="67" stroke="#fbcfe8" strokeWidth="2" strokeLinecap="round" />
          <line x1="30" y1="75" x2="45" y2="75" stroke="#fbcfe8" strokeWidth="2" strokeLinecap="round" />
          <line x1="55" y1="75" x2="70" y2="75" stroke="#fbcfe8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      
      {/* Texto de Carga */}
      <div className="mt-5 flex flex-col items-center">
        <h2 className="text-lg font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#c084fc] to-[#ec4899]">
          Cargando
        </h2>
        <div className="flex gap-1.5 mt-2.5">
          <div className="w-2 h-2 rounded-full bg-[#a855f7]/80 animate-[pulse_1.8s_ease-in-out_infinite_0ms]"></div>
          <div className="w-2 h-2 rounded-full bg-[#c084fc]/80 animate-[pulse_1.8s_ease-in-out_infinite_300ms]"></div>
          <div className="w-2 h-2 rounded-full bg-[#ec4899]/80 animate-[pulse_1.8s_ease-in-out_infinite_600ms]"></div>
        </div>
      </div>
    </div>
  );
}
