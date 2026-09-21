"use client";

import { useState, useRef, useEffect } from "react";
import { Music, Pause, X, Play, Radio, Volume2 } from "lucide-react";
import ReactPlayer from "react-player";
const Player: any = ReactPlayer;

export default function MascotBot() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [videoId, setVideoId] = useState("jfKfPfyJRdk");
  const [customUrl, setCustomUrl] = useState("");
  
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const startRef = useRef({ x: 0, y: 0 });
  const dragInfo = useRef({ startX: 0, startY: 0, isDragMove: false });

  // Control para asegurar que montamos el reproductor solo en cliente
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialX = window.innerWidth > 768 ? window.innerWidth - 120 : window.innerWidth - 100;
    const initialY = window.innerHeight > 768 ? window.innerHeight - 150 : window.innerHeight - 150;
    setPosition({ x: initialX, y: initialY });
    posRef.current = { x: initialX, y: initialY };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragInfo.current = { startX: e.clientX, startY: e.clientY, isDragMove: false };
    startRef.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y };
    if (dragRef.current) dragRef.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    if (Math.abs(e.clientX - dragInfo.current.startX) > 5 || Math.abs(e.clientY - dragInfo.current.startY) > 5) {
      dragInfo.current.isDragMove = true;
    }
    const newX = e.clientX - startRef.current.x;
    const newY = e.clientY - startRef.current.y;
    posRef.current = { x: newX, y: newY };
    setPosition({ x: newX, y: newY });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (dragRef.current) dragRef.current.releasePointerCapture(e.pointerId);
    if (!dragInfo.current.isDragMove) {
      setIsOpen(!isOpen);
    }
  };

  const handlePlayCustom = () => {
    if (!customUrl) return;
    const match = customUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (match && match[1]) {
      setVideoId(match[1]);
      setIsPlaying(true);
      setCustomUrl("");
      setIsOpen(false);
    } else {
      alert("Enlace de YouTube no válido.");
    }
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 md:left-6 md:right-auto z-[9999] bg-[#a855f7]/10 backdrop-blur-md border border-[#a855f7]/40 p-3.5 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-[#a855f7]/20 hover:scale-105 transition-all flex items-center gap-3 group"
      >
        <Radio className="w-5 h-5 text-[#c084fc] animate-pulse" />
        <span className="text-white text-sm font-semibold w-0 overflow-hidden group-hover:w-32 whitespace-nowrap transition-all duration-300">Asistente Neku</span>
      </button>
    );
  }

  return (
    <div 
      style={{ transform: `translate(${position.x}px, ${position.y}px)`, touchAction: "none" }}
      className="fixed top-0 left-0 z-[9999] flex justify-center items-center"
    >
      <style>{`
        .eq-bar { animation: equalize 1s infinite alternate; }
        .eq-bar:nth-child(2) { animation-delay: 0.2s; }
        .eq-bar:nth-child(3) { animation-delay: 0.4s; }
        @keyframes equalize { 0% { height: 4px; } 100% { height: 12px; } }
      `}</style>
      
      {/* Reproductor Definitivo usando ReactPlayer */}
      {mounted && (
        <div className="absolute opacity-0 pointer-events-none -z-50" style={{ width: 1, height: 1, overflow: 'hidden' }}>
          
          <Player 
            url={`https://www.youtube.com/watch?v=${videoId}`}
            playing={isPlaying}
            controls={false}
            width="10px"
            height="10px"
            volume={1}
            
          />
        </div>
      )}

      {/* Premium Chat Bubble Menu */}
      <div 
        className={`absolute bottom-full mb-4 left-1/2 -translate-x-1/2 transition-all duration-300 transform origin-bottom ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'} bg-black/60 border border-white/10 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] w-80 backdrop-blur-2xl cursor-default`}
      >
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#a855f7] shadow-[0_0_8px_#a855f7]"></div>
            <h4 className="text-white font-bold text-sm tracking-wide">Neku<span className="text-[#a855f7] font-normal">Bot</span></h4>
          </div>
          <button onClick={() => { setIsVisible(false); setIsPlaying(false); }} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mb-4">
          {isPlaying ? (
            <div className="flex items-center gap-3 bg-[#a855f7]/10 border border-[#a855f7]/20 rounded-xl p-3">
              <div className="flex items-end gap-1 h-3">
                <div className="w-1 bg-[#c084fc] rounded-full eq-bar"></div>
                <div className="w-1 bg-[#c084fc] rounded-full eq-bar"></div>
                <div className="w-1 bg-[#c084fc] rounded-full eq-bar"></div>
              </div>
              <p className="text-[#c084fc] text-xs font-medium">Reproduciendo audio de fondo</p>
            </div>
          ) : (
            <p className="text-gray-400 text-xs leading-relaxed">Conecta tu música favorita de YouTube para acompañar tu lectura.</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 mb-4 bg-[#0a0a0a] rounded-xl p-1 border border-white/5 focus-within:border-[#a855f7]/50 focus-within:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all">
          <input 
            type="text" 
            placeholder="Pegar link de YouTube..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white px-3 py-2 w-full placeholder:text-gray-600"
            onKeyDown={(e) => e.key === 'Enter' && handlePlayCustom()}
          />
          <button 
            onClick={handlePlayCustom}
            className="bg-[#a855f7] text-white p-2 rounded-lg hover:bg-[#c084fc] transition-colors flex-shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        <button 
          onClick={() => {
            if (!isPlaying) { setVideoId("jfKfPfyJRdk"); }
            setIsPlaying(!isPlaying);
            if (!isPlaying) setIsOpen(false); 
          }}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${isPlaying ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gradient-to-r from-[#a855f7] to-[#7e22ce] text-white hover:opacity-90 shadow-lg shadow-purple-900/40'}`}
        >
          {isPlaying ? (
            <> <Pause className="w-4 h-4 fill-current" /> Detener Música </>
          ) : (
            <> <Volume2 className="w-4 h-4" /> Lofi Radio 24/7 </>
          )}
        </button>
      </div>

      <div 
        ref={dragRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative group w-20 h-20 md:w-24 md:h-24 transition-transform select-none ${isDragging ? 'cursor-grabbing scale-95' : 'cursor-grab hover:scale-105'} filter drop-shadow-[0_5px_15px_rgba(168,85,247,0.3)] hover:drop-shadow-[0_5px_25px_rgba(168,85,247,0.6)]`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7] to-[#4f46e5] rounded-full blur-xl -z-10 opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
        
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id="nekuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="earGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d8b4fe" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path d="M 25 35 L 15 10 L 40 28 Z" fill="url(#earGrad)" stroke="#1e1b4b" strokeWidth="2" strokeLinejoin="round" />
          <path d="M 75 35 L 85 10 L 60 28 Z" fill="url(#earGrad)" stroke="#1e1b4b" strokeWidth="2" strokeLinejoin="round" />
          <rect x="15" y="25" width="70" height="55" rx="22" fill="url(#nekuGrad)" stroke="#1e1b4b" strokeWidth="3" />
          <rect x="22" y="32" width="56" height="41" rx="14" fill="#0f172a" stroke="#1e1b4b" strokeWidth="2" />
          <path d="M 32 50 Q 38 42 44 50" fill="none" stroke="#e879f9" strokeWidth="4" strokeLinecap="round" />
          <path d="M 56 50 Q 62 42 68 50" fill="none" stroke="#e879f9" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="30" cy="58" rx="5" ry="2.5" fill="#ec4899" opacity="0.8" />
          <ellipse cx="70" cy="58" rx="5" ry="2.5" fill="#ec4899" opacity="0.8" />
          <path d="M 47 58 Q 50 62 53 58" fill="none" stroke="#e879f9" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {!isOpen && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0a0a0a]/90 text-white font-medium text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-white/10 shadow-xl backdrop-blur-md">
            Click para controles
          </div>
        )}
      </div>
    </div>
  );
}







