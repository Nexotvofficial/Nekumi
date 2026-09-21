"use client";

import { useState, useRef, useEffect } from "react";
import { X, Sparkles, Terminal, Send } from "lucide-react";

export default function MascotBot() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Estados de las "Locuras"
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isBossMode, setIsBossMode] = useState(false);
  
  // Interfaz de IA
  const [inputCommand, setInputCommand] = useState("");
  const [chatLog, setChatLog] = useState<{role: "user" | "neku", text: string}[]>([
    { role: "neku" as const, text: "Terminal Neku Inicializada. Ingrese un comando (ej. 'modo cine', 'auto scroll', 'modo seguro')." }
  ]);
  
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const startRef = useRef({ x: 0, y: 0 });
  const dragInfo = useRef({ startX: 0, startY: 0, isDragMove: false });
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialX = window.innerWidth > 768 ? window.innerWidth - 120 : window.innerWidth - 100;
    const initialY = window.innerHeight > 768 ? window.innerHeight - 150 : window.innerHeight - 150;
    setPosition({ x: initialX, y: initialY });
    posRef.current = { x: initialX, y: initialY };
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    let scrollInterval: any;
    if (isAutoScrolling) {
      scrollInterval = setInterval(() => {
        window.scrollBy({ top: 1, behavior: "smooth" });
      }, 15); // Velocidad de lectura
    }
    return () => clearInterval(scrollInterval);
  }, [isAutoScrolling]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatLog]);

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

  // CEREBRO DE LA IA (Procesador de comandos)
  const processCommand = (cmd: string) => {
    if (!cmd.trim()) return;
    
    const newLog = [...chatLog, { role: "user" as const, text: cmd }];
    setChatLog(newLog);
    setInputCommand("");
    
    const c = cmd.toLowerCase();
    
    setTimeout(() => {
      let response = "Comando no reconocido. Intenta: 'modo cine', 'lee por mi', 'modo jefe', o 'arriba'.";
      
      if (c.includes("cine") || c.includes("luz") || c.includes("luces")) {
        setIsCinemaMode(!isCinemaMode);
        response = !isCinemaMode ? "Sistema de iluminación desactivado. Modo Cine en línea." : "Sistema de iluminación restaurado.";
      } 
      else if (c.includes("lee") || c.includes("auto") || c.includes("baja")) {
        setIsAutoScrolling(true);
        response = "Ejecutando scroll automático. [Estado: Activo]";
      }
      else if (c.includes("para") || c.includes("deten") || c.includes("stop")) {
        setIsAutoScrolling(false);
        response = "Scroll automático interrumpido.";
      }
      else if (c.includes("jefe") || c.includes("panico") || c.includes("esconde")) {
        setIsBossMode(true);
        setIsOpen(false);
        response = "Protocolo de camuflaje activado. Interfaz de trabajo simulada en curso.";
      }
      else if (c.includes("arriba") || c.includes("inicio")) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        response = "Redirigiendo al inicio del documento.";
      }
      else if (c.includes("hola") || c.includes("neku")) {
        response = "Sistema operativo Neku a la escucha.";
      }

      setChatLog([...newLog, { role: "neku" as const, text: response }]);
    }, 400);
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 md:left-6 md:right-auto z-[9999] bg-[#a855f7]/10 backdrop-blur-md border border-[#a855f7]/40 p-3.5 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-[#a855f7]/20 hover:scale-105 transition-all flex items-center gap-3 group"
      >
        <Sparkles className="w-5 h-5 text-[#c084fc] animate-pulse" />
        <span className="text-white text-sm font-semibold w-0 overflow-hidden group-hover:w-32 whitespace-nowrap transition-all duration-300">Neku AI</span>
      </button>
    );
  }

  return (
    <>
      {/* CAPA MODO CINE */}
      {isCinemaMode && (
        <div className="fixed inset-0 bg-black/90 z-[9990] pointer-events-none transition-opacity duration-1000"></div>
      )}

      {/* CAPA MODO ANTI-JEFE (FALSO EXCEL) */}
      {isBossMode && (
        <div 
          onClick={() => setIsBossMode(false)}
          className="fixed inset-0 z-[100000] bg-white text-black flex flex-col cursor-pointer"
        >
          <div className="bg-green-700 text-white p-2 font-bold flex items-center gap-4 text-sm">
            <span>Reporte_Mensual_Final_v3.xlsx - Excel</span>
            <span className="font-normal text-xs opacity-70">(Click para salir del Modo Anti-Jefe)</span>
          </div>
          <div className="bg-gray-100 border-b border-gray-300 p-2 flex gap-4 text-xs">
            <span>Archivo</span><span>Inicio</span><span>Insertar</span><span>Fórmulas</span><span>Datos</span>
          </div>
          <div className="flex-1 p-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-1">A</th>
                  <th className="border border-gray-300 p-1">B</th>
                  <th className="border border-gray-300 p-1">C</th>
                  <th className="border border-gray-300 p-1">D</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(25)].map((_, i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 p-1 text-gray-500 bg-gray-100 w-8 text-center">{i + 1}</td>
                    <td className="border border-gray-300 p-1">Dato financiero {(Math.random() * 10000).toFixed(2)}</td>
                    <td className="border border-gray-300 p-1">Análisis Q{1 + (i % 4)}</td>
                    <td className="border border-gray-300 p-1">{(Math.random() * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div 
        style={{ transform: `translate(${position.x}px, ${position.y}px)`, touchAction: "none" }}
        className="fixed top-0 left-0 z-[9999] flex justify-center items-center"
      >
        <div 
          className={`absolute bottom-full mb-4 left-1/2 -translate-x-1/2 transition-all duration-300 transform origin-bottom ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'} bg-[#09090b]/95 border border-[#a855f7]/30 rounded-2xl shadow-[0_8px_30px_rgb(168,85,247,0.15)] w-80 backdrop-blur-3xl cursor-default flex flex-col overflow-hidden`}
        >
          <div className="flex justify-between items-center p-4 border-b border-white/5 bg-gradient-to-r from-[#a855f7]/10 to-transparent">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#a855f7]" />
              <h4 className="text-white font-bold text-sm tracking-wide">Neku<span className="text-[#a855f7] font-normal">.AI</span></h4>
            </div>
            <button onClick={() => { setIsVisible(false); setIsOpen(false); }} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-1.5">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-56 overflow-y-auto p-4 flex flex-col gap-3">
            {chatLog.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl p-2.5 text-xs leading-relaxed ${msg.role === "user" ? "bg-[#a855f7] text-white rounded-br-none" : "bg-[#1a1a1a] text-gray-300 border border-white/5 rounded-bl-none"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          
          <div className="p-3 border-t border-white/5 bg-black/40">
            <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-xl p-1 border border-white/10 focus-within:border-[#a855f7]/50 focus-within:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all">
              <input 
                type="text" 
                placeholder="Ingresar comando..."
                value={inputCommand}
                onChange={(e) => setInputCommand(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white px-3 py-2 w-full placeholder:text-gray-600 font-mono"
                onKeyDown={(e) => e.key === 'Enter' && processCommand(inputCommand)}
              />
              <button 
                onClick={() => processCommand(inputCommand)}
                className="bg-white/5 text-gray-400 p-2 rounded-lg hover:bg-[#a855f7] hover:text-white transition-colors flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
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
          
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl relative z-10">
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
            {isAutoScrolling ? (
               // Ojos parpadeando / escaneando cuando auto-lee
               <>
                 <path d="M 32 46 L 44 46" stroke="#e879f9" strokeWidth="4" strokeLinecap="round" />
                 <path d="M 56 46 L 68 46" stroke="#e879f9" strokeWidth="4" strokeLinecap="round" />
               </>
            ) : (
               // Ojos normales
               <>
                 <path d="M 32 50 Q 38 42 44 50" fill="none" stroke="#e879f9" strokeWidth="4" strokeLinecap="round" />
                 <path d="M 56 50 Q 62 42 68 50" fill="none" stroke="#e879f9" strokeWidth="4" strokeLinecap="round" />
               </>
            )}
            <ellipse cx="30" cy="58" rx="5" ry="2.5" fill="#ec4899" opacity="0.8" />
            <ellipse cx="70" cy="58" rx="5" ry="2.5" fill="#ec4899" opacity="0.8" />
            <path d="M 47 58 Q 50 62 53 58" fill="none" stroke="#e879f9" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </>
  );
}



