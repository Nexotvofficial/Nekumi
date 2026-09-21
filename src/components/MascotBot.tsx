"use client";

import { useState, useRef, useEffect } from "react";
import { Music, Pause, X, MessageCircle, Play } from "lucide-react";

export default function MascotBot() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Custom YouTube ID
  const [videoId, setVideoId] = useState("jfKfPfyJRdk");
  const [customUrl, setCustomUrl] = useState("");
  
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const startRef = useRef({ x: 0, y: 0 });
  const dragInfo = useRef({ startX: 0, startY: 0, isDragMove: false });

  useEffect(() => {
    const initialX = window.innerWidth > 768 ? window.innerWidth - 150 : window.innerWidth - 100;
    const initialY = window.innerHeight > 768 ? window.innerHeight - 200 : window.innerHeight - 150;
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
    } else {
      alert("Enlace de YouTube no válido. Asegúrate de copiar el link completo.");
    }
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 md:left-4 md:right-auto z-[9999] bg-[#a855f7] p-3 rounded-full shadow-lg shadow-purple-500/50 hover:bg-[#c084fc] transition-all flex items-center gap-2 group"
      >
        <MessageCircle className="w-5 h-5 text-white" />
        <span className="text-white text-sm font-bold w-0 overflow-hidden group-hover:w-32 whitespace-nowrap transition-all duration-300">Neku Bot</span>
      </button>
    );
  }

  return (
    <div 
      style={{ transform: `translate(${position.x}px, ${position.y}px)`, touchAction: "none" }}
      className="fixed top-0 left-0 z-[9999] flex flex-col items-center"
    >
      {isPlaying && (
        <iframe
          width="0" height="0"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          className="hidden"
        ></iframe>
      )}

      {/* Chat Bubble Menu (Not draggable) */}
      <div 
        className={`transition-all duration-300 transform origin-bottom ${isOpen ? 'scale-100 opacity-100 mb-2' : 'scale-0 opacity-0 h-0 m-0'} bg-[#1a1a2e]/95 border border-[#a855f7]/50 rounded-2xl p-5 shadow-2xl shadow-purple-900/50 w-72 backdrop-blur-xl`}
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-white font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Neku Bot
          </h4>
          <button onClick={() => { setIsVisible(false); setIsPlaying(false); }} className="text-gray-400 hover:text-red-400 bg-white/5 rounded-full p-1 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-gray-300 text-xs mb-4 leading-relaxed">¡Miau! 🐾 Escribe el link de tu canción favorita de YouTube y yo me encargo de ponerla de fondo.</p>
        
        {/* Custom Song Input (Fixed bug) */}
        <div className="flex items-center gap-2 mb-4 bg-black/50 rounded-xl p-1.5 border border-white/10 focus-within:border-[#a855f7] transition-colors">
          <input 
            type="text" 
            placeholder="Pegar link de YouTube..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white px-2 py-1.5 w-full placeholder:text-gray-500"
            onKeyDown={(e) => e.key === 'Enter' && handlePlayCustom()}
          />
          <button 
            onClick={handlePlayCustom}
            className="bg-[#a855f7] text-white p-2 rounded-lg hover:bg-[#c084fc] hover:shadow-lg hover:shadow-purple-500/20 transition-all flex-shrink-0"
          >
            <Play className="w-3 h-3 fill-current" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => {
              if (!isPlaying) setVideoId("jfKfPfyJRdk"); // Reset to default Lofi
              setIsPlaying(!isPlaying);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-lg ${isPlaying ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50 hover:bg-pink-500/30 shadow-pink-500/20' : 'bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white border border-[#a855f7]/30 hover:shadow-purple-500/30'}`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Music className="w-4 h-4" />}
            {isPlaying ? 'Pausar música' : 'Reproducir Lofi por defecto'}
          </button>
        </div>
      </div>

      {/* Mascot Avatar (Draggable area) */}
      <div 
        ref={dragRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative group w-20 h-20 md:w-24 md:h-24 transition-transform hover:scale-105 select-none ${isDragging ? 'cursor-grabbing scale-95' : 'cursor-grab'}`}
      >
        <div className="absolute inset-0 bg-[#a855f7]/30 rounded-full blur-2xl -z-10 group-hover:bg-[#a855f7]/50 transition-all"></div>
        
        {/* Definitive Cute Robot Cat Mascot SVG */}
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
          
          {/* Ears */}
          <path d="M 25 35 L 15 10 L 40 28 Z" fill="url(#earGrad)" stroke="#1e1b4b" strokeWidth="2" strokeLinejoin="round" />
          <path d="M 75 35 L 85 10 L 60 28 Z" fill="url(#earGrad)" stroke="#1e1b4b" strokeWidth="2" strokeLinejoin="round" />
          
          {/* Main Head */}
          <rect x="15" y="25" width="70" height="55" rx="22" fill="url(#nekuGrad)" stroke="#1e1b4b" strokeWidth="3" />
          
          {/* Inner Screen */}
          <rect x="22" y="32" width="56" height="41" rx="14" fill="#0f172a" stroke="#1e1b4b" strokeWidth="2" />
          
          {/* Cute Eyes ^ ^ */}
          <path d="M 32 50 Q 38 42 44 50" fill="none" stroke="#e879f9" strokeWidth="4" strokeLinecap="round" />
          <path d="M 56 50 Q 62 42 68 50" fill="none" stroke="#e879f9" strokeWidth="4" strokeLinecap="round" />
          
          {/* Blushes */}
          <ellipse cx="30" cy="58" rx="5" ry="2.5" fill="#ec4899" opacity="0.8" />
          <ellipse cx="70" cy="58" rx="5" ry="2.5" fill="#ec4899" opacity="0.8" />
          
          {/* Tiny Mouth */}
          <path d="M 47 58 Q 50 62 53 58" fill="none" stroke="#e879f9" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {!isOpen && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white font-bold text-[10px] px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-[#a855f7]/50 shadow-lg">
            ¡Hazme click!
          </div>
        )}
      </div>
    </div>
  );
}
