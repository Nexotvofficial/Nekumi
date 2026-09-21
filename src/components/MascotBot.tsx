"use client";

import { useState, useRef, useEffect } from "react";
import { Music, Pause, RefreshCw, X, MessageCircle } from "lucide-react";

export default function MascotBot() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gender, setGender] = useState<"girl" | "boy">("girl");
  
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

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-[9999] bg-[#a855f7] p-3 rounded-full shadow-lg shadow-purple-500/50 hover:bg-[#c084fc] transition-all flex items-center gap-2 group"
      >
        <MessageCircle className="w-5 h-5 text-white" />
        <span className="text-white text-sm font-bold w-0 overflow-hidden group-hover:w-32 whitespace-nowrap transition-all duration-300">Invocar Mascota</span>
      </button>
    );
  }

  const girlImg = "https://api.dicebear.com/7.x/miniavs/svg?seed=NekuGirl&backgroundColor=transparent&hair=long16&clothing=shirt02&eyes=happy";
  const boyImg = "https://api.dicebear.com/7.x/miniavs/svg?seed=NekuBoy&backgroundColor=transparent&hair=short02&clothing=shirt01&eyes=happy";

  return (
    <div 
      ref={dragRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ transform: `translate(${position.x}px, ${position.y}px)`, touchAction: "none" }}
      className={`fixed top-0 left-0 z-[9999] flex flex-col items-center select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {isPlaying && (
        <iframe
          width="0" height="0"
          src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          className="hidden"
        ></iframe>
      )}

      <div 
        onPointerDown={(e) => e.stopPropagation()}
        className={`transition-all duration-300 transform origin-bottom ${isOpen ? 'scale-100 opacity-100 mb-2' : 'scale-0 opacity-0 h-0 m-0'} bg-[#1a1a2e]/95 border border-[#a855f7]/30 rounded-2xl p-4 shadow-xl shadow-purple-900/40 w-64 backdrop-blur-md cursor-default`}
      >
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-white font-bold text-sm">Asistente Nekutoon</h4>
          <button onClick={() => { setIsVisible(false); setIsPlaying(false); }} className="text-gray-400 hover:text-red-400 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-gray-300 text-xs mb-4">¡Hola! 🐾 ¿Quieres música relajante (Lofi) para acompañar tu lectura?</p>
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isPlaying ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50 hover:bg-pink-500/30' : 'bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/30 hover:bg-[#a855f7]/40'}`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Music className="w-4 h-4" />}
            {isPlaying ? 'Pausar música' : 'Reproducir Lofi'}
          </button>
          
          <button 
            onClick={() => setGender(gender === "girl" ? "boy" : "girl")}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Cambiar a {gender === "girl" ? "Chico" : "Chica"}
          </button>
        </div>
      </div>

      <div 
        className="relative group w-20 h-20 md:w-24 md:h-24 filter drop-shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:drop-shadow-[0_0_25px_rgba(168,85,247,0.7)] transition-all"
        style={{ animation: isDragging ? 'none' : 'custom-float 3s ease-in-out infinite' }}
      >
        <div className="absolute inset-0 bg-[#a855f7]/20 rounded-full blur-xl -z-10 group-hover:bg-[#c084fc]/40 transition-all"></div>
        <img 
          src={gender === "girl" ? girlImg : boyImg} 
          alt="Neku Bot" 
          className="w-full h-full object-contain drop-shadow-xl"
          draggable={false}
        />
        {!isOpen && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            ¡Mueve o hazme click!
          </div>
        )}
      </div>
    </div>
  );
}
