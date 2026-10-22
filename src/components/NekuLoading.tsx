import React from 'react';

export default function NekuLoading({ fullScreen = true }: { fullScreen?: boolean }) {
  const Container = fullScreen ? "div" : "div";
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f]"
    : "flex flex-col items-center justify-center w-full py-20";

  return (
    <Container className={containerClasses}>
      {/* Animación del Muñequito leyendo */}
      <div className="relative w-28 h-28 animate-[bounce_2s_infinite]">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
          {/* Cabeza */}
          <circle cx="50" cy="40" r="30" fill="#f3e8ff" />
          {/* Orejitas de gato/zorro */}
          <polygon points="25,20 15,0 40,15" fill="#a855f7" />
          <polygon points="75,20 85,0 60,15" fill="#a855f7" />
          {/* Ojos estilo Anime (parpadeando) */}
          <ellipse cx="35" cy="40" rx="4" ry="6" fill="#000" className="animate-[pulse_1s_infinite]" />
          <ellipse cx="65" cy="40" rx="4" ry="6" fill="#000" className="animate-[pulse_1s_infinite]" />
          {/* Sonrisa */}
          <path d="M 45 50 Q 50 55 55 50" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Librito que sostiene */}
          <rect x="25" y="60" width="50" height="30" rx="2" fill="#ec4899" />
          <line x1="50" y1="60" x2="50" y2="90" stroke="#fff" strokeWidth="2" />
          <line x1="30" y1="65" x2="45" y2="65" stroke="#fbcfe8" strokeWidth="2" />
          <line x1="55" y1="65" x2="70" y2="65" stroke="#fbcfe8" strokeWidth="2" />
          <line x1="30" y1="75" x2="45" y2="75" stroke="#fbcfe8" strokeWidth="2" />
          <line x1="55" y1="75" x2="70" y2="75" stroke="#fbcfe8" strokeWidth="2" />
        </svg>
      </div>
      
      {/* Texto de Carga Glow */}
      <div className="mt-6 flex flex-col items-center">
        <h2 className="text-xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#a855f7] to-[#ec4899] animate-pulse">
          Cargando
        </h2>
        <div className="flex gap-1 mt-2">
          <div className="w-2 h-2 rounded-full bg-[#a855f7] animate-[bounce_1s_infinite_0ms]"></div>
          <div className="w-2 h-2 rounded-full bg-[#a855f7] animate-[bounce_1s_infinite_200ms]"></div>
          <div className="w-2 h-2 rounded-full bg-[#a855f7] animate-[bounce_1s_infinite_400ms]"></div>
        </div>
      </div>
    </Container>
  );
}
